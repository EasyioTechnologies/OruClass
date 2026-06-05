// PIJAM capacity / ramp-to-failure test — runs against PROD (api.orulabs.in).
//
// Adds guest participants in STAGES. Every bot STAYS connected and IN the training
// (room) across stages, so concurrency is cumulative. At each stage it runs a full
// submission storm across ALL connected bots and snapshots live VPS docker stats,
// so you see latency + CPU/mem climb and find the ceiling.
//
// Usage:
//   node apps/api/scripts/capacity-test.mjs
// Env overrides:
//   API        default https://api.orulabs.in
//   STEP       bots added per stage          (default 50)
//   MAX        hard ceiling — stop here       (default 600)
//   STAGES     explicit cumulative targets, comma list, overrides STEP/MAX
//              e.g. STAGES="25,50,100,200,400"
//   GUEST_RATE guest provisioning cap/60s     (default 380; server caps at 400)
//   SSH_HOST   ssh alias for docker stats      (default "oru"; empty = skip)
//   TRAINER_EMAIL / TRAINER_PASS / JOIN_TOKEN
//
// Break thresholds (auto-stop): connect-fail >10% of a stage, ack-fail >5% of room,
// or ack p95 > 4000ms. Whatever stage last passed = your safe max.

import { io } from "socket.io-client";
import { execSync } from "node:child_process";

const API = process.env.API ?? "https://api.orulabs.in";
const STEP = Number(process.env.STEP ?? 50);
const MAX = Number(process.env.MAX ?? 600);
const GUEST_RATE = Number(process.env.GUEST_RATE ?? 380);
const SSH_HOST = process.env.SSH_HOST ?? "oru";
const TRAINER_EMAIL = process.env.TRAINER_EMAIL ?? "gamingcristy19@gmail.com";
const TRAINER_PASS = process.env.TRAINER_PASS ?? "Burhan@2211";
const JOIN_TOKEN = process.env.JOIN_TOKEN ?? "zdT4h5haJxcuDfqP";
const WINDOW_MS = 60_000;
const PROVISION_BATCH = 20; // parallel guest+connect per micro-batch

// break thresholds
const MAX_CONNECT_FAIL_PCT = 10;
const MAX_ACK_FAIL_PCT = 5;
const MAX_ACK_P95_MS = 4000;

const STAGES = process.env.STAGES
  ? process.env.STAGES.split(",").map((s) => Number(s.trim())).filter(Boolean)
  : (() => { const a = []; for (let t = STEP; t <= MAX; t += STEP) a.push(t); return a; })();

const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]);
};
const stat = (arr) => ({
  p50: pct(arr, 50), p95: pct(arr, 95), max: arr.length ? Math.round(Math.max(...arr)) : 0,
});

async function jpost(path, body, token) {
  const r = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: r.status, json };
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const s = io(API, { transports: ["websocket"], auth: { token }, reconnection: false, timeout: 15000 });
    const t = setTimeout(() => { s.close(); reject(new Error("connect timeout")); }, 15000);
    s.on("connect", () => { clearTimeout(t); resolve(s); });
    s.on("connect_error", (e) => { clearTimeout(t); reject(e); });
  });
}

function joinRoom(s, trainingId) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    s.once("module:unlocked", finish);
    s.once("participant:joined", finish);
    s.emit("participant:join", { trainingId, role: "participant" });
    setTimeout(finish, 1500);
  });
}

// Live VPS load snapshot via ssh + docker stats (best-effort).
function vpsStats() {
  if (!SSH_HOST) return null;
  try {
    const out = execSync(
      `ssh ${SSH_HOST} "docker stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}' oruclass-api-1 oruclass-postgres-1 oruclass-redis-1; echo LOAD; uptime"`,
      { timeout: 25000, encoding: "utf8" },
    );
    const lines = out.trim().split("\n");
    const rows = {};
    let load = "";
    for (const ln of lines) {
      if (ln.includes("|")) {
        const [name, cpu, mem] = ln.split("|");
        const short = name.replace("oruclass-", "").replace("-1", "");
        rows[short] = { cpu: cpu.trim(), mem: mem.trim() };
      } else if (ln.includes("load average")) {
        load = ln.split("load average:")[1]?.trim() ?? "";
      }
    }
    return { rows, load };
  } catch (e) {
    return { error: e.message.split("\n")[0] };
  }
}

async function main() {
  console.log(`\n=== PIJAM CAPACITY RAMP ===`);
  console.log(`API ${API} · stages [${STAGES.join(", ")}] · provisioning <=${GUEST_RATE}/60s\n`);

  // trainer login → training + a module
  const login = await jpost("/api/auth/login", { email: TRAINER_EMAIL, password: TRAINER_PASS });
  if (login.status !== 200) { console.error("Trainer login FAILED:", login.status, login.json); process.exit(1); }
  const trainerToken = login.json.accessToken;
  console.log("✓ trainer logged in");

  const joinRes = await jpost(`/api/join/${JOIN_TOKEN}`, {}, trainerToken);
  if (joinRes.status !== 200 || !joinRes.json.training) { console.error("Resolve training FAILED:", joinRes.status, joinRes.json); process.exit(1); }
  const training = joinRes.json.training;
  const trainingId = training.id;
  let moduleId = training.currentActiveModuleId;
  if (!moduleId) {
    const t = await fetch(`${API}/api/workspaces/${training.workspaceId}/trainings/${trainingId}`, {
      headers: { Authorization: `Bearer ${trainerToken}`, "X-Workspace-ID": training.workspaceId },
    });
    const tj = await t.json().catch(() => ({}));
    moduleId = tj?.modules?.[0]?.id;
  }
  if (!moduleId) { console.error("No module — unlock one in the live session first."); process.exit(1); }
  console.log(`✓ training ${trainingId} · module ${moduleId}\n`);

  const idle = vpsStats();
  if (idle?.rows) {
    console.log("idle VPS:", Object.entries(idle.rows).map(([k, v]) => `${k} cpu ${v.cpu} mem ${v.mem}`).join("  ·  "), `| load ${idle.load}`);
  }

  const sockets = [];            // all bots, kept alive
  let aggregateCount = 0;        // cumulative data:aggregate received across all bots
  let stormStart = 0;
  const aggLat = [];
  const report = [];

  // provisioning pacing
  let windowStart = performance.now();
  let inWindow = 0;
  let provisioned = 0;

  async function provisionOne(i) {
    const g = await jpost("/api/auth/guest", { name: `Cap-${i}` });
    if (g.status !== 200 && g.status !== 201) return { err: `guest ${g.status}` };
    const token = g.json.accessToken;
    if (!token) return { err: "no token" };
    const c0 = performance.now();
    const s = await connect(token);
    const connectMs = performance.now() - c0;
    s.on("data:aggregate", () => { aggregateCount++; if (stormStart) aggLat.push(performance.now() - stormStart); });
    const j0 = performance.now();
    await joinRoom(s, trainingId);
    sockets.push(s);
    return { s, connectMs, joinMs: performance.now() - j0 };
  }

  let stopReason = null;

  for (const target of STAGES) {
    const need = target - sockets.length;
    if (need <= 0) continue;

    const tConnect = [], tJoin = [];
    let connFail = 0;

    // provision `need` more bots in paced parallel micro-batches
    let made = 0;
    while (made < need) {
      if (inWindow >= GUEST_RATE) {
        const wait = WINDOW_MS - (performance.now() - windowStart) + 500;
        if (wait > 0) { process.stdout.write(`   …guest-cap pause ${Math.round(wait / 1000)}s\n`); await new Promise((r) => setTimeout(r, wait)); }
        windowStart = performance.now(); inWindow = 0;
      }
      const room = Math.min(PROVISION_BATCH, need - made, GUEST_RATE - inWindow);
      const batch = await Promise.all(
        Array.from({ length: room }, (_, k) => provisionOne(provisioned + made + k + 1).catch((e) => ({ err: e.message }))),
      );
      for (const r of batch) {
        if (r.err) connFail++;
        else { tConnect.push(r.connectMs); tJoin.push(r.joinMs); }
      }
      made += room; inWindow += room;
    }
    provisioned += made;

    // settle, then verify who's still actually connected
    await new Promise((r) => setTimeout(r, 1000));
    const live = sockets.filter((s) => s.connected).length;

    // STORM — every connected bot submits in the same tick
    const ackLat = []; let acksOk = 0, acksFail = 0;
    aggregateCount = 0; aggLat.length = 0;
    stormStart = performance.now();
    await Promise.all(sockets.map((s) => new Promise((resolve) => {
      if (!s.connected) { acksFail++; return resolve(); }
      const t0 = performance.now();
      const done = setTimeout(() => { acksFail++; resolve(); }, 10000);
      s.emit("response:submit", { trainingId, moduleId, responseData: { value: Math.random() < 0.5 ? "A" : "B" } }, (res) => {
        clearTimeout(done); ackLat.push(performance.now() - t0); if (res?.ok) acksOk++; else acksFail++; resolve();
      });
    })));
    const stormMs = performance.now() - stormStart;
    await new Promise((r) => setTimeout(r, 1500)); // let broadcasts land

    const v = vpsStats();
    const c = stat(tConnect), j = stat(tJoin), a = stat(ackLat);
    const connFailPct = need ? Math.round((connFail / need) * 100) : 0;
    const ackFailPct = live ? Math.round((acksFail / live) * 100) : 0;

    report.push({ target, live, connFail, connFailPct, c, j, a, acksOk, acksFail, ackFailPct, stormMs, agg: aggregateCount, v });

    const vpsStr = v?.rows
      ? Object.entries(v.rows).map(([k, x]) => `${k} ${x.cpu}/${x.mem.split(" / ")[0]}`).join(" ")
      : (v?.error ? `stats:err` : "");
    console.log(
      `■ ${String(target).padStart(4)} bots | live ${live} connFail ${connFail}(${connFailPct}%) ` +
      `| connect p95 ${c.p95} join p95 ${j.p95} | ack ok/fail ${acksOk}/${acksFail} p95 ${a.p95} storm ${Math.round(stormMs)}ms ` +
      `| agg ${aggregateCount} | VPS ${vpsStr}${v?.load ? ` load ${v.load.split(",")[0]}` : ""}`,
    );

    // break checks
    if (connFailPct > MAX_CONNECT_FAIL_PCT) { stopReason = `connect-fail ${connFailPct}% > ${MAX_CONNECT_FAIL_PCT}% at ${target}`; break; }
    if (ackFailPct > MAX_ACK_FAIL_PCT) { stopReason = `ack-fail ${ackFailPct}% > ${MAX_ACK_FAIL_PCT}% at ${target}`; break; }
    if (a.p95 > MAX_ACK_P95_MS) { stopReason = `ack p95 ${a.p95}ms > ${MAX_ACK_P95_MS}ms at ${target}`; break; }
  }

  // ── summary ───────────────────────────────────────────────────────────────
  console.log(`\n========== CAPACITY SUMMARY ==========`);
  console.log(`bots | live | connP95 | joinP95 | ackP95 | ack fail | storm | agg | api cpu / mem`);
  let safeMax = 0;
  for (const r of report) {
    const ok = r.connFailPct <= MAX_CONNECT_FAIL_PCT && r.ackFailPct <= MAX_ACK_FAIL_PCT && r.a.p95 <= MAX_ACK_P95_MS;
    if (ok) safeMax = r.live;
    const apiv = r.v?.rows?.api ? `${r.v.rows.api.cpu} / ${r.v.rows.api.mem.split(" / ")[0]}` : "-";
    console.log(
      `${String(r.target).padStart(4)} | ${String(r.live).padStart(4)} | ${String(r.c.p95).padStart(6)} | ${String(r.j.p95).padStart(6)} | ` +
      `${String(r.a.p95).padStart(5)} | ${String(r.acksFail).padStart(4)} (${r.ackFailPct}%) | ${String(Math.round(r.stormMs)).padStart(5)} | ${String(r.agg).padStart(4)} | ${apiv} ${ok ? "" : "← DEGRADED"}`,
    );
  }
  console.log(`--------------------------------------`);
  console.log(stopReason ? `STOPPED: ${stopReason}` : `Completed all stages (ceiling MAX=${MAX} not broken — raise MAX to push further).`);
  console.log(`SAFE MAX concurrent (all green): ~${safeMax} participants`);
  console.log(`======================================\n`);

  for (const s of sockets) s.close();
  process.exit(0);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });

// PIJAM submission-storm load test — runs against PROD (api.orulabs.in).
// 50 guest participants join one live session, then all submit at once.
// Measures connect/join/ack/broadcast latency + errors + rate-limit hits.
//
// Usage:
//   node apps/api/scripts/load-test.mjs
// Env overrides:
//   API   (default https://api.orulabs.in)
//   N     participant count (default 50)
//   TRAINER_EMAIL / TRAINER_PASS / JOIN_TOKEN

import { io } from "socket.io-client";

const API = process.env.API ?? "https://api.orulabs.in";
const N = Number(process.env.N ?? 50);
const TRAINER_EMAIL = process.env.TRAINER_EMAIL ?? "gamingcristy19@gmail.com";
const TRAINER_PASS = process.env.TRAINER_PASS ?? "Burhan@2211";
const JOIN_TOKEN = process.env.JOIN_TOKEN ?? "zdT4h5haJxcuDfqP";

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
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: r.status, json };
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const s = io(API, {
      transports: ["websocket"],
      auth: { token },
      reconnection: false,
      timeout: 15000,
    });
    const t = setTimeout(() => { s.close(); reject(new Error("connect timeout")); }, 15000);
    s.on("connect", () => { clearTimeout(t); resolve(s); });
    s.on("connect_error", (e) => { clearTimeout(t); reject(e); });
  });
}

function joinRoom(s, trainingId) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => { if (!done) { done = true; resolve(ok); } };
    // We consider "joined" once we get our roster sync or a module/session signal,
    // or after a short grace period (server doesn't ack join explicitly).
    s.once("module:unlocked", () => finish(true));
    s.once("participant:joined", () => finish(true));
    s.emit("participant:join", { trainingId, role: "participant" });
    setTimeout(() => finish(true), 1500);
  });
}

async function main() {
  console.log(`\n=== PIJAM submission-storm load test ===`);
  console.log(`API ${API} · ${N} participants\n`);

  // 1) Trainer login → resolve training id + a module id
  const login = await jpost("/api/auth/login", { email: TRAINER_EMAIL, password: TRAINER_PASS });
  if (login.status !== 200) {
    console.error("Trainer login FAILED:", login.status, login.json);
    process.exit(1);
  }
  const trainerToken = login.json.accessToken;
  console.log("✓ trainer logged in");

  const joinRes = await jpost(`/api/join/${JOIN_TOKEN}`, {}, trainerToken);
  if (joinRes.status !== 200 || !joinRes.json.training) {
    console.error("Resolve training FAILED:", joinRes.status, joinRes.json);
    process.exit(1);
  }
  const training = joinRes.json.training;
  const trainingId = training.id;
  let moduleId = training.currentActiveModuleId;
  console.log(`✓ training ${trainingId} · status=${training.sessionStatus}`);

  if (!moduleId) {
    const t = await fetch(`${API}/api/workspaces/${training.workspaceId}/trainings/${trainingId}`, {
      headers: { Authorization: `Bearer ${trainerToken}`, "X-Workspace-ID": training.workspaceId },
    });
    const tj = await t.json().catch(() => ({}));
    moduleId = tj?.modules?.[0]?.id;
  }
  if (!moduleId) {
    console.error("No module to submit to — unlock a module in the live session first.");
    process.exit(1);
  }
  console.log(`✓ target module ${moduleId}\n`);

  // 2) Spin up N guest participants
  // NOTE: /api/auth/* is rate-limited to 20 req/60s PER IP. From one machine all N
  // guest logins share one IP, so we pace creation under the cap (GUEST_RATE per
  // 60s window). In real PIJAM this same limit bites when many participants share
  // one venue router/NAT — flagged in the report.
  const GUEST_RATE = Number(process.env.GUEST_RATE ?? 18); // stay under 20/60s
  const WINDOW_MS = 60_000;
  const tConnect = [], tJoin = [], errors = [];
  const sockets = [];
  let aggregateCount = 0;
  const aggLat = [];
  let stormStart = 0;

  console.log(`→ provisioning ${N} guests + sockets (paced ${GUEST_RATE}/60s to dodge auth limit)…`);
  let windowStart = performance.now();
  let inWindow = 0;
  for (let i = 0; i < N; i++) {
    if (inWindow >= GUEST_RATE) {
      const wait = WINDOW_MS - (performance.now() - windowStart) + 500;
      if (wait > 0) { console.log(`   …rate-limit pause ${Math.round(wait / 1000)}s`); await new Promise((r) => setTimeout(r, wait)); }
      windowStart = performance.now();
      inWindow = 0;
    }
    try {
      const g = await jpost("/api/auth/guest", { name: `LoadBot-${i + 1}` });
      inWindow++;
      if (g.status !== 200 && g.status !== 201) { errors.push(`guest ${i}: ${g.status}`); continue; }
      const token = g.json.accessToken;
      if (!token) { errors.push(`guest ${i}: no token`); continue; }
      const c0 = performance.now();
      const s = await connect(token);
      tConnect.push(performance.now() - c0);
      s.on("error", (e) => errors.push(`sock: ${e?.code ?? "?"}`));
      s.on("data:aggregate", () => {
        aggregateCount++;
        if (stormStart) aggLat.push(performance.now() - stormStart);
      });
      sockets.push(s);
    } catch (e) {
      errors.push(`connect ${i}: ${e.message}`);
    }
  }
  console.log(`✓ ${sockets.length}/${N} sockets connected`);

  // 2b) JOIN BURST — all participants enter the room at once (real arrival pattern)
  console.log("→ JOIN BURST (all join room simultaneously)…");
  await Promise.all(sockets.map(async (s) => {
    const j0 = performance.now();
    await joinRoom(s, trainingId);
    tJoin.push(performance.now() - j0);
  }));
  console.log(`✓ ${sockets.length} joined\n`);

  // settle
  await new Promise((r) => setTimeout(r, 1500));

  // 3) THE STORM — everyone submits in the same tick
  console.log("→ SUBMISSION STORM (all submit at once)…");
  const ackLat = [];
  let acksOk = 0, acksFail = 0;
  stormStart = performance.now();

  await Promise.all(
    sockets.map((s) => new Promise((resolve) => {
      const t0 = performance.now();
      const done = setTimeout(() => { acksFail++; resolve(); }, 10000);
      s.emit(
        "response:submit",
        { trainingId, moduleId, responseData: { value: Math.random() < 0.5 ? "A" : "B" } },
        (res) => {
          clearTimeout(done);
          ackLat.push(performance.now() - t0);
          if (res?.ok) acksOk++; else acksFail++;
          resolve();
        },
      );
    })),
  );
  const stormDuration = performance.now() - stormStart;

  // let broadcasts land
  await new Promise((r) => setTimeout(r, 2500));

  // 4) Report
  console.log(`\n========== RESULTS ==========`);
  console.log(`Participants connected : ${sockets.length}/${N}`);
  console.log(`Connect latency  (ms)  : p50 ${stat(tConnect).p50}  p95 ${stat(tConnect).p95}  max ${stat(tConnect).max}`);
  console.log(`Join latency     (ms)  : p50 ${stat(tJoin).p50}  p95 ${stat(tJoin).p95}  max ${stat(tJoin).max}`);
  console.log(`--- storm ---`);
  console.log(`Submit acks ok / fail  : ${acksOk} / ${acksFail}`);
  console.log(`Ack latency      (ms)  : p50 ${stat(ackLat).p50}  p95 ${stat(ackLat).p95}  max ${stat(ackLat).max}`);
  console.log(`Storm wall time  (ms)  : ${Math.round(stormDuration)}  (last submit acked)`);
  console.log(`data:aggregate broadcasts received : ${aggregateCount}`);
  console.log(`Broadcast fan-out (ms) : p50 ${stat(aggLat).p50}  p95 ${stat(aggLat).p95}  max ${stat(aggLat).max}`);
  console.log(`Errors / rate-limits   : ${errors.length}`);
  if (errors.length) {
    const tally = {};
    for (const e of errors) tally[e] = (tally[e] ?? 0) + 1;
    for (const [k, v] of Object.entries(tally)) console.log(`   ${v}× ${k}`);
  }
  console.log(`=============================\n`);

  for (const s of sockets) s.close();
  process.exit(0);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });

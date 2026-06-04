/**
 * PIJAM load harness — empirical concurrency check for the live session path.
 *
 * Seeds a throwaway training (sessionStatus "live", one unlocked module), mints
 * N JWTs, opens N socket.io-client connections, joins them, then fires a
 * simultaneous response:submit storm and reports connect/ack success + latency.
 * Cleans up every seeded row at the end (and on Ctrl-C).
 *
 *   bun apps/api/scripts/load-test.ts            # 40 participants vs localhost:3001
 *   LOAD_TEST_N=80 LOAD_TEST_URL=http://localhost:3001 bun apps/api/scripts/load-test.ts
 *   bun apps/api/scripts/load-test.ts --clean    # purge leftover loadtest-* rows only
 *
 * Never point this at prod — it writes real rows. All seeded emails use the
 * "loadtest-" prefix so --clean can sweep stragglers.
 */
import { randomUUID } from "crypto";
import { performance } from "perf_hooks";
import { io as ioClient, type Socket } from "socket.io-client";
import { inArray, like, eq } from "drizzle-orm";
import { db } from "../src/db/client";
import {
  users,
  workspaces,
  workspaceMembers,
  trainings,
  trainingModules,
  trainingFacilitators,
  trainingParticipants,
  liveSessions,
  participantResponses,
} from "../src/db/schema";
import { signAccessToken } from "../src/auth/jwt";

const API_URL = process.env.LOAD_TEST_URL ?? "http://localhost:3001";
const N = Number(process.env.LOAD_TEST_N ?? 40);
const EMAIL_PREFIX = "loadtest-";

type Seed = {
  workspaceId: string;
  trainingId: string;
  moduleId: string;
  trainerId: string;
  participantIds: string[];
};

async function purgeByPrefix() {
  const stale = await db.select({ id: users.id }).from(users).where(like(users.email, `${EMAIL_PREFIX}%`));
  if (stale.length === 0) return 0;
  const ids = stale.map((u) => u.id);
  // Find trainings created by these users and delete children first (no reliance
  // on FK cascade config), then workspaces, then the users themselves.
  const tr = await db.select({ id: trainings.id, workspaceId: trainings.workspaceId }).from(trainings).where(inArray(trainings.createdBy, ids));
  for (const t of tr) {
    await db.delete(participantResponses).where(eq(participantResponses.trainingId, t.id));
    await db.delete(trainingParticipants).where(eq(trainingParticipants.trainingId, t.id));
    await db.delete(trainingFacilitators).where(eq(trainingFacilitators.trainingId, t.id));
    await db.delete(liveSessions).where(eq(liveSessions.trainingId, t.id));
    await db.delete(trainingModules).where(eq(trainingModules.trainingId, t.id));
    await db.delete(trainings).where(eq(trainings.id, t.id));
  }
  const wsIds = [...new Set(tr.map((t) => t.workspaceId))];
  if (wsIds.length) {
    await db.delete(workspaceMembers).where(inArray(workspaceMembers.workspaceId, wsIds));
    await db.delete(workspaces).where(inArray(workspaces.id, wsIds));
  }
  await db.delete(users).where(inArray(users.id, ids));
  return ids.length;
}

async function seed(): Promise<Seed> {
  const run = randomUUID().slice(0, 8);
  const trainerId = randomUUID();
  await db.insert(users).values({ id: trainerId, email: `${EMAIL_PREFIX}${run}-trainer@test.local`, name: "Load Trainer", emailVerified: true });

  const workspaceId = randomUUID();
  await db.insert(workspaces).values({ id: workspaceId, name: `loadtest ${run}`, ownerId: trainerId });
  await db.insert(workspaceMembers).values({ workspaceId, userId: trainerId, role: "owner" });

  const participantIds: string[] = [];
  const participantRows = Array.from({ length: N }, (_, i) => {
    const id = randomUUID();
    participantIds.push(id);
    return { id, email: `${EMAIL_PREFIX}${run}-p${i}@test.local`, name: `Load P${i}`, emailVerified: true };
  });
  // Chunk inserts so a large N doesn't blow the bind-parameter limit.
  for (let i = 0; i < participantRows.length; i += 100) {
    await db.insert(users).values(participantRows.slice(i, i + 100));
  }

  const trainingId = randomUUID();
  await db.insert(trainings).values({
    id: trainingId,
    workspaceId,
    title: `Load Test ${run}`,
    joinToken: `lt-${run}-${randomUUID().slice(0, 8)}`,
    createdBy: trainerId,
    sessionStatus: "live",
  });

  const moduleId = randomUUID();
  await db.insert(trainingModules).values({ id: moduleId, trainingId, title: "Load Poll", moduleType: "poll", position: 0, isUnlocked: true });
  await db.update(trainings).set({ currentActiveModuleId: moduleId }).where(eq(trainings.id, trainingId));

  await db.insert(liveSessions).values({ trainingId, createdBy: trainerId, status: "active" });
  await db.insert(trainingFacilitators).values({ trainingId, userId: trainerId, role: "lead_trainer" });

  return { workspaceId, trainingId, moduleId, trainerId, participantIds };
}

async function cleanup(s: Seed) {
  await db.delete(participantResponses).where(eq(participantResponses.trainingId, s.trainingId));
  await db.delete(trainingParticipants).where(eq(trainingParticipants.trainingId, s.trainingId));
  await db.delete(trainingFacilitators).where(eq(trainingFacilitators.trainingId, s.trainingId));
  await db.delete(liveSessions).where(eq(liveSessions.trainingId, s.trainingId));
  await db.delete(trainingModules).where(eq(trainingModules.trainingId, s.trainingId));
  await db.delete(trainings).where(eq(trainings.id, s.trainingId));
  await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, s.workspaceId));
  await db.delete(workspaces).where(eq(workspaces.id, s.workspaceId));
  await db.delete(users).where(inArray(users.id, [s.trainerId, ...s.participantIds]));
}

function connectClient(token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const s = ioClient(API_URL, { auth: { token }, transports: ["websocket"], reconnection: false, timeout: 10000, forceNew: true });
    const t = setTimeout(() => { s.close(); reject(new Error("connect timeout")); }, 12000);
    s.on("connect", () => { clearTimeout(t); resolve(s); });
    s.on("connect_error", (e) => { clearTimeout(t); reject(e); });
  });
}

function submit(s: Socket, trainingId: string, moduleId: string, i: number): Promise<{ ok: boolean; latency: number }> {
  return new Promise((resolve) => {
    const start = performance.now();
    const t = setTimeout(() => resolve({ ok: false, latency: -1 }), 10000);
    s.emit("response:submit", { trainingId, moduleId, responseData: { answer: "loadtest", i } }, (ack: { ok?: boolean } | undefined) => {
      clearTimeout(t);
      resolve({ ok: ack?.ok !== false, latency: performance.now() - start });
    });
  });
}

function pct(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function main() {
  if (process.argv.includes("--clean")) {
    const n = await purgeByPrefix();
    console.log(`Purged ${n} loadtest user(s) and their data.`);
    return;
  }

  console.log(`Load harness → ${API_URL}  (N=${N})`);
  await purgeByPrefix(); // clear any prior crashed run
  const s = await seed();
  console.log(`Seeded training ${s.trainingId} (module ${s.moduleId}), ${N} participants.`);

  const sockets: Socket[] = [];
  const cleanupAll = async () => {
    for (const sk of sockets) sk.close();
    await cleanup(s);
  };
  process.on("SIGINT", async () => { console.log("\nInterrupted — cleaning up…"); await cleanupAll(); process.exit(1); });

  try {
    // 1 trainer client to validate the trainers-room submission_update routing.
    const trainerToken = await signAccessToken(s.trainerId, "trainer@test.local");
    let submissionUpdates = 0;
    const trainer = await connectClient(trainerToken);
    sockets.push(trainer);
    trainer.on("session:submission_update", () => { submissionUpdates++; });
    trainer.emit("participant:join", { trainingId: s.trainingId, role: "trainer" });

    // Connect all participants — keep socket↔userId↔token paired so the
    // reconnect phase can reopen the exact same identity.
    const tokens = await Promise.all(s.participantIds.map((id, i) => signAccessToken(id, `p${i}@test.local`)));
    const connectStart = performance.now();
    const conns = await Promise.allSettled(
      tokens.map(async (tk, i) => ({ id: s.participantIds[i], token: tk, socket: await connectClient(tk) })),
    );
    const connectMs = performance.now() - connectStart;

    let connectOk = 0;
    const live: { id: string; token: string; socket: Socket }[] = [];
    for (const c of conns) {
      if (c.status === "fulfilled") { connectOk++; live.push(c.value); sockets.push(c.value.socket); }
    }
    console.log(`Connected ${connectOk}/${N} in ${connectMs.toFixed(0)}ms (${(N - connectOk)} failed).`);

    // Join, then submit storm.
    for (const c of live) c.socket.emit("participant:join", { trainingId: s.trainingId, role: "participant" });
    await new Promise((r) => setTimeout(r, 1500));

    const stormStart = performance.now();
    const results = await Promise.all(live.map((c, i) => submit(c, s.trainingId, s.moduleId, i)));
    const stormMs = performance.now() - stormStart;

    const ok = results.filter((r) => r.ok);
    const lat = ok.map((r) => r.latency).sort((a, b) => a - b);
    await new Promise((r) => setTimeout(r, 500)); // let submission_update fan-in settle

    console.log("\n── Results ─────────────────────────────");
    console.log(`Connect:        ${connectOk}/${N}`);
    console.log(`Submit ack ok:  ${ok.length}/${live.length}`);
    console.log(`Storm wall:     ${stormMs.toFixed(0)}ms`);
    console.log(`Ack latency:    p50 ${pct(lat, 50).toFixed(0)}ms · p95 ${pct(lat, 95).toFixed(0)}ms · max ${(lat.at(-1) ?? 0).toFixed(0)}ms`);
    console.log(`Trainer saw:    ${submissionUpdates} session:submission_update events`);

    // DB truth check: did the rows actually persist?
    const persisted = await db.select({ id: participantResponses.id }).from(participantResponses).where(eq(participantResponses.trainingId, s.trainingId));
    console.log(`DB persisted:   ${persisted.length} participantResponses rows`);
    console.log("────────────────────────────────────────");
  } finally {
    await cleanupAll();
    console.log("Cleaned up seeded rows.");
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

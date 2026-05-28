import type { Server as SocketIOServer, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@oruclass/types";
import { eq, and, count, desc } from "drizzle-orm";
import { db } from "../db/client";
import {
  trainingParticipants,
  trainingModules,
  trainings,
  trainingFacilitators,
  participantResponses,
  users,
  liveSessions,
} from "../db/schema";
import { getOrCreateState, removeParticipant, persistState, restoreState } from "./state";
import { logger } from "../utils/logger";
import { DrawUpdateSchema } from "@oruclass/validators";
import { USER_NAME_CACHE_TTL_MS, USER_NAME_CACHE_MAX } from "../config/limits";

// Small in-process cache for socket-join user lookups. Avoids hammering the
// users table on every reconnect; TTL keeps profile edits visible within a minute.
const userCache = new Map<string, { name: string; expiresAt: number }>();

// Per-training liveSessionId cache. response:submit hits this on every
// answer, and the active liveSession only changes on session start/end/reset.
// 15s TTL bounds staleness; explicit busts on lifecycle events would be
// stricter but aren't required for correctness (worst case: one stale
// submission gets a previous liveSessionId).
const liveSessionCache = new Map<string, { id: string | null; expiresAt: number }>();
const LIVE_SESSION_TTL_MS = 15_000;

async function getActiveLiveSessionId(trainingId: string): Promise<string | null> {
  const now = Date.now();
  const hit = liveSessionCache.get(trainingId);
  if (hit && hit.expiresAt > now) return hit.id;
  const session = await db.query.liveSessions.findFirst({
    where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
    orderBy: [desc(liveSessions.startedAt)],
  });
  const id = session?.id ?? null;
  liveSessionCache.set(trainingId, { id, expiresAt: now + LIVE_SESSION_TTL_MS });
  return id;
}

export function bustLiveSessionCache(trainingId: string): void {
  liveSessionCache.delete(trainingId);
}

async function getUserName(userId: string): Promise<string> {
  const now = Date.now();
  const hit = userCache.get(userId);
  if (hit && hit.expiresAt > now) return hit.name;
  const rec = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const name = rec?.name ?? "Unknown User";
  if (userCache.size >= USER_NAME_CACHE_MAX) {
    // Cheap FIFO eviction — Map preserves insertion order.
    const oldest = userCache.keys().next().value;
    if (oldest) userCache.delete(oldest);
  }
  userCache.set(userId, { name, expiresAt: now + USER_NAME_CACHE_TTL_MS });
  return name;
}

type IO = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Per-event rate limits: [maxRequests, windowMs]
const EVENT_LIMITS: Record<string, [number, number]> = {
  "participant:join": [5, 10_000],
  "module:unlock": [20, 1_000],
  "response:submit": [10, 1_000],
  "draw:update": [60, 1_000],
  "note:create": [10, 1_000],
  "note:position": [60, 1_000],
};

function makePerEventRateLimiter() {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (event: string): boolean => {
    const limit = EVENT_LIMITS[event];
    if (!limit) return true;
    const [max, windowMs] = limit;
    const now = Date.now();
    const bucket = buckets.get(event);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(event, { count: 1, resetAt: now + windowMs });
      return true;
    }
    bucket.count++;
    return bucket.count <= max;
  };
}

export function registerSocketHandlers(io: IO): void {
  io.on("connection", (socket: AppSocket) => {
    // userId is set by JWT handshake middleware in index.ts — never trust client payload
    const userId = socket.data.userId!;
    logger.debug({ socketId: socket.id, userId }, "socket connected");

    const isAllowed = makePerEventRateLimiter();

    const guard = (event: string, fn: (...args: any[]) => void) =>
      (...args: any[]) => {
        if (!isAllowed(event)) {
          socket.emit("error", { code: "RATE_LIMIT", message: "rate limit exceeded" });
          return;
        }
        fn(...args);
      };

    socket.on(
      "participant:join",
      guard("participant:join", async ({ trainingId, role }: { trainingId: string; role: "trainer" | "participant" }) => {
        socket.data.trainingId = trainingId;
        socket.data.role = role;

        await socket.join(`training:${trainingId}`);

        // Restore persisted state from Redis if this is the first connection after restart
        await restoreState(trainingId);

        // For trainer role, verify they are actually a facilitator in DB
        if (role === "trainer") {
          const facilitator = await db.query.trainingFacilitators.findFirst({
            where: and(
              eq(trainingFacilitators.trainingId, trainingId),
              eq(trainingFacilitators.userId, userId),
            ),
          });
          if (!facilitator) {
            socket.emit("error", { code: "UNAUTHORIZED", message: "not a facilitator for this training" });
            socket.data.role = "participant"; // downgrade
          }
        }

        const name = await getUserName(userId);

        const state = getOrCreateState(trainingId);
        state.participants.set(userId, {
          userId,
          name,
          role,
          socketId: socket.id,
          joinedAt: new Date(),
        });

        // Upsert — handles both first join and reconnect correctly
        await db
          .insert(trainingParticipants)
          .values({ trainingId, userId, connectionStatus: "online", lastHeartbeat: new Date() })
          .onConflictDoUpdate({
            target: [trainingParticipants.trainingId, trainingParticipants.userId],
            set: { connectionStatus: "online", lastHeartbeat: new Date() },
          });

        socket.to(`training:${trainingId}`).emit("participant:joined", {
          userId,
          name,
          role,
          joinedAt: new Date().toISOString(),
          connectionStatus: "online",
        });

        // Sync existing participants to the joining socket
        for (const [existingUserId, p] of state.participants.entries()) {
          if (existingUserId !== userId) {
            socket.emit("participant:joined", {
              userId: p.userId,
              name: p.name,
              role: p.role,
              joinedAt: new Date(p.joinedAt).toISOString(),
              connectionStatus: "online", // or fetch real status
            });
          }
        }

        // Restore active module only if session is currently live
        const trainingData = await db.query.trainings.findFirst({
          where: eq(trainings.id, trainingId),
        });

        if (!trainingData || trainingData.sessionStatus === "draft" || trainingData.sessionStatus === "completed") {
          socket.emit("error", { code: "SESSION_NOT_OPEN", message: "session is not open yet" });
          return;
        }

        if (trainingData.sessionStatus === "live") {
          if (!state.activeModuleId && trainingData.currentActiveModuleId) {
            state.activeModuleId = trainingData.currentActiveModuleId;
          }

          if (state.activeModuleId) {
            const moduleData = await db.query.trainingModules.findFirst({
              where: eq(trainingModules.id, state.activeModuleId),
            });
            socket.emit("module:unlocked", {
              moduleId: state.activeModuleId,
              module: moduleData as any,
            });
          }
        }
      }),
    );

    socket.on(
      "module:unlock",
      guard("module:unlock", async ({ trainingId, moduleId }: { trainingId: string; moduleId: string }) => {
        // Re-query facilitator role inside the tx — cached socket.data.role
        // can be stale if a trainer was demoted mid-session.
        let moduleData: typeof trainingModules.$inferSelect | undefined;
        let denied = false;
        try {
          await db.transaction(async (tx) => {
            const facilitator = await tx.query.trainingFacilitators.findFirst({
              where: and(
                eq(trainingFacilitators.trainingId, trainingId),
                eq(trainingFacilitators.userId, userId),
              ),
            });
            if (!facilitator) {
              denied = true;
              return;
            }

            // Confirm the module actually belongs to this training before unlocking.
            const mod = await tx.query.trainingModules.findFirst({
              where: and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)),
            });
            if (!mod) {
              denied = true;
              return;
            }

            await tx
              .update(trainingModules)
              .set({ isUnlocked: true, updatedAt: new Date() })
              .where(eq(trainingModules.id, moduleId));

            await tx
              .update(trainings)
              .set({ currentActiveModuleId: moduleId, updatedAt: new Date() })
              .where(eq(trainings.id, trainingId));

            moduleData = { ...mod, isUnlocked: true };
          });
        } catch (err) {
          logger.error(err, "module:unlock tx failed");
          socket.emit("error", { code: "INTERNAL", message: "failed to unlock module" });
          return;
        }

        if (denied || !moduleData) {
          socket.emit("error", { code: "FORBIDDEN", message: "not authorized to unlock this module" });
          return;
        }

        const state = getOrCreateState(trainingId);
        state.activeModuleId = moduleId;

        io.to(`training:${trainingId}`).emit("module:unlocked", {
          moduleId,
          module: moduleData as any,
        });

        // Persist new active module to Redis for restart survivability
        await persistState(trainingId);
      }),
    );

    socket.on(
      "response:submit",
      guard("response:submit", async (
        { trainingId, moduleId, responseData }: { trainingId: string; moduleId: string; responseData: Record<string, unknown> },
        ack?: (result: { ok: boolean; error?: string }) => void,
      ) => {
        try {
          const liveSessionId = await getActiveLiveSessionId(trainingId);

          // Single upsert — requires UNIQUE (training_id, module_id, user_id).
          // Avoids the read-then-write race that lets two near-simultaneous
          // submissions from the same participant create duplicates.
          await db
            .insert(participantResponses)
            .values({ trainingId, moduleId, userId, responseData, liveSessionId })
            .onConflictDoUpdate({
              target: [
                participantResponses.trainingId,
                participantResponses.moduleId,
                participantResponses.userId,
              ],
              set: { responseData, submittedAt: new Date(), liveSessionId },
            });

          // Ack immediately — counts/broadcasts can lag the ack without
          // affecting the participant's UX.
          if (typeof ack === "function") ack({ ok: true });

          // Counts in parallel (single round-trip wall time).
          const [respRow, partRow] = await Promise.all([
            db
              .select({ responseCount: count() })
              .from(participantResponses)
              .where(and(
                eq(participantResponses.trainingId, trainingId),
                eq(participantResponses.moduleId, moduleId),
              )),
            liveSessionId
              ? db
                  .select({ participantCount: count() })
                  .from(trainingParticipants)
                  .where(eq(trainingParticipants.trainingId, trainingId))
              : Promise.resolve([{ participantCount: 0 }] as const),
          ]);
          const responseCount = respRow[0].responseCount;

          io.to(`training:${trainingId}`).emit("data:aggregate", {
            trainingId,
            moduleId,
            responseCount,
          });

          if (liveSessionId) {
            io.to(`training:${trainingId}`).emit("session:submission_update", {
              trainingId,
              moduleId,
              liveSessionId,
              submitted: Number(responseCount),
              totalParticipants: Number(partRow[0].participantCount),
            });
          }
        } catch (err) {
          logger.error(err, "response:submit failed");
          if (typeof ack === "function") ack({ ok: false, error: "Failed to save response" });
        }
      }),
    );

    socket.on(
      "draw:update",
      guard("draw:update", (payload: unknown) => {
        const parsed = DrawUpdateSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid draw:update payload" });
          return;
        }
        const { trainingId, moduleId, stroke } = parsed.data;
        socket.to(`training:${trainingId}`).emit("draw:update", { moduleId, userId, stroke });
      }),
    );

    socket.on(
      "draw:clear",
      guard("draw:clear", ({ trainingId, moduleId }: { trainingId: string; moduleId: string }) => {
        socket.to(`training:${trainingId}`).emit("draw:clear", { moduleId, userId });
      }),
    );

    socket.on(
      "draw:sync",
      guard("draw:sync", ({ trainingId, moduleId, strokes }: { trainingId: string; moduleId: string; strokes: any[] }) => {
        socket.to(`training:${trainingId}`).emit("draw:sync", { moduleId, userId, strokes });
      }),
    );

    socket.on(
      "note:create",
      guard("note:create", ({ trainingId, moduleId, note }: { trainingId: string; moduleId: string; note: any }) => {
        socket.to(`training:${trainingId}`).emit("note:create", { moduleId, note });
      }),
    );

    socket.on(
      "note:position",
      guard("note:position", ({ trainingId, moduleId, noteId, x, y }: { trainingId: string; moduleId: string; noteId: string; x: number; y: number }) => {
        socket.to(`training:${trainingId}`).emit("note:position", { moduleId, noteId, x, y });
      }),
    );

    socket.on("heartbeat", async () => {
      const { trainingId } = socket.data;
      if (!trainingId || !userId) return;
      await db
        .update(trainingParticipants)
        .set({ lastHeartbeat: new Date(), connectionStatus: "online" })
        .where(
          and(
            eq(trainingParticipants.trainingId, trainingId),
            eq(trainingParticipants.userId, userId),
          ),
        );
    });

    socket.on("disconnect", async () => {
      const { trainingId } = socket.data;
      if (!trainingId || !userId) return;

      removeParticipant(trainingId, userId);

      await db
        .update(trainingParticipants)
        .set({ connectionStatus: "offline" })
        .where(
          and(
            eq(trainingParticipants.trainingId, trainingId),
            eq(trainingParticipants.userId, userId),
          ),
        );

      socket.to(`training:${trainingId}`).emit("participant:left", { userId });
      logger.debug({ socketId: socket.id, userId, trainingId }, "socket disconnected");
    });
  });
}

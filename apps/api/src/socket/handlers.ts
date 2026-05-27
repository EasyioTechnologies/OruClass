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

        const userRec = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });
        const name = userRec?.name ?? "Unknown User";

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
        // Only verified trainers may unlock modules
        if (socket.data.role !== "trainer") {
          socket.emit("error", { code: "FORBIDDEN", message: "forbidden: only trainers can unlock modules" });
          return;
        }

        const state = getOrCreateState(trainingId);
        state.activeModuleId = moduleId;

        await db
          .update(trainingModules)
          .set({ isUnlocked: true, updatedAt: new Date() })
          .where(eq(trainingModules.id, moduleId));

        await db
          .update(trainings)
          .set({ currentActiveModuleId: moduleId, updatedAt: new Date() })
          .where(eq(trainings.id, trainingId));

        const moduleData = await db.query.trainingModules.findFirst({
          where: eq(trainingModules.id, moduleId),
        });

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
          // Get current live session
          const currentSession = await db.query.liveSessions.findFirst({
            where: and(
              eq(liveSessions.trainingId, trainingId),
              eq(liveSessions.status, "active"),
            ),
            orderBy: [desc(liveSessions.startedAt)],
          });
          const liveSessionId = currentSession?.id ?? null;

          // Persist response before broadcasting — upsert to avoid duplicates
          const existing = await db.query.participantResponses.findFirst({
            where: and(
              eq(participantResponses.trainingId, trainingId),
              eq(participantResponses.moduleId, moduleId),
              eq(participantResponses.userId, userId),
            ),
          });

          if (existing) {
            await db
              .update(participantResponses)
              .set({ responseData, submittedAt: new Date() })
              .where(eq(participantResponses.id, existing.id));
          } else {
            await db.insert(participantResponses).values({
              trainingId,
              moduleId,
              userId,
              responseData,
              liveSessionId,
            });
          }

          // Acknowledge to participant that response was saved
          if (typeof ack === "function") ack({ ok: true });

          // Emit updated count to all trainers/participants in the room
          const [{ responseCount }] = await db
            .select({ responseCount: count() })
            .from(participantResponses)
            .where(and(
              eq(participantResponses.trainingId, trainingId),
              eq(participantResponses.moduleId, moduleId),
            ));

          io.to(`training:${trainingId}`).emit("data:aggregate", {
            trainingId,
            moduleId,
            responseCount,
          });

          // Emit session submission update
          if (currentSession) {
            const [{ participantCount }] = await db
              .select({ participantCount: count() })
              .from(trainingParticipants)
              .where(eq(trainingParticipants.trainingId, trainingId));

            io.to(`training:${trainingId}`).emit("session:submission_update", {
              trainingId,
              moduleId,
              liveSessionId: currentSession.id,
              submitted: Number(responseCount),
              totalParticipants: Number(participantCount),
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
      guard("draw:update", ({ trainingId, moduleId, stroke }: { trainingId: string; moduleId: string; stroke: any }) => {
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

import { Hono } from "hono";
import { eq, and, count, sql, desc } from "drizzle-orm";
import { db } from "../db/client";
import {
  liveSessions,
  trainingParticipants,
  participantResponses,
  users,
  trainings,
} from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";

export const sessionsRouter = new Hono();

sessionsRouter.use("*", authMiddleware);
sessionsRouter.use("*", workspaceTenantMiddleware);

// GET /trainings/:trainingId/sessions — session history
sessionsRouter.get("/:trainingId/sessions", async (c) => {
  const { trainingId } = c.req.param();
  const sessions = await db.query.liveSessions.findMany({
    where: eq(liveSessions.trainingId, trainingId),
    orderBy: [desc(liveSessions.startedAt)],
  });

  // For each session, get submission count
  const enriched = await Promise.all(
    sessions.map(async (s) => {
      const [{ total }] = await db
        .select({ total: count() })
        .from(participantResponses)
        .where(eq(participantResponses.liveSessionId, s.id));
      const [{ unique }] = await db
        .select({ unique: sql<number>`COUNT(DISTINCT ${participantResponses.userId})` })
        .from(participantResponses)
        .where(eq(participantResponses.liveSessionId, s.id));
      return { ...s, totalResponses: Number(total), uniqueRespondents: Number(unique) };
    }),
  );

  return c.json(enriched);
});

// GET /trainings/:trainingId/sessions/current — current active session + stats
sessionsRouter.get("/:trainingId/sessions/current", async (c) => {
  const { trainingId } = c.req.param();

  const session = await db.query.liveSessions.findFirst({
    where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
    orderBy: [desc(liveSessions.startedAt)],
  });

  if (!session) return c.json({ session: null, stats: null });

  // Get current active module
  const training = await db.query.trainings.findFirst({
    where: eq(trainings.id, trainingId),
    columns: { currentActiveModuleId: true },
  });

  const moduleId = training?.currentActiveModuleId;

  let submitted = 0;
  if (moduleId) {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(participantResponses)
      .where(
        and(
          eq(participantResponses.liveSessionId, session.id),
          eq(participantResponses.moduleId, moduleId),
        ),
      );
    submitted = Number(cnt);
  }

  const [{ totalPx }] = await db
    .select({ totalPx: count() })
    .from(trainingParticipants)
    .where(eq(trainingParticipants.trainingId, trainingId));

  const total = Number(totalPx);

  return c.json({
    session,
    stats: {
      sessionId: session.id,
      submitted,
      totalParticipants: total,
      completionPct: total > 0 ? Math.round((submitted / total) * 100) : 0,
      targetResponses: session.targetResponses,
    },
  });
});

// PATCH /trainings/:trainingId/sessions/current — update target responses
sessionsRouter.patch("/:trainingId/sessions/current", async (c) => {
  const { trainingId } = c.req.param();
  const { targetResponses } = await c.req.json<{ targetResponses: number | null }>();

  const session = await db.query.liveSessions.findFirst({
    where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
  });

  if (!session) return c.json({ error: "No active session" }, 404);

  const [updated] = await db
    .update(liveSessions)
    .set({ targetResponses })
    .where(eq(liveSessions.id, session.id))
    .returning();

  return c.json(updated);
});

// GET /trainings/:trainingId/sessions/:sessionId/participants?moduleId=&page=&limit=
sessionsRouter.get("/:trainingId/sessions/:sessionId/participants", async (c) => {
  const { trainingId, sessionId } = c.req.param();
  const moduleId = c.req.query("moduleId");
  const page = Number(c.req.query("page") ?? 1);
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);
  const offset = (page - 1) * limit;

  // Get all participants for the training
  const participants = await db.query.trainingParticipants.findMany({
    where: eq(trainingParticipants.trainingId, trainingId),
    with: { user: true },
    limit,
    offset,
  });

  // Get submission status for each participant (for this session + module)
  const items = await Promise.all(
    participants.map(async (p) => {
      let response = null;
      if (moduleId) {
        response = await db.query.participantResponses.findFirst({
          where: and(
            eq(participantResponses.liveSessionId, sessionId),
            eq(participantResponses.moduleId, moduleId),
            eq(participantResponses.userId, p.userId),
          ),
          columns: { id: true, submittedAt: true },
        });
      }
      return {
        userId: p.userId,
        name: (p.user as any).name,
        avatarUrl: (p.user as any).avatarUrl ?? null,
        hasSubmitted: !!response,
        submittedAt: response?.submittedAt?.toISOString() ?? null,
        responseId: response?.id ?? null,
      };
    }),
  );

  // Sort: submitted first, then by name
  items.sort((a, b) => {
    if (a.hasSubmitted && !b.hasSubmitted) return -1;
    if (!a.hasSubmitted && b.hasSubmitted) return 1;
    return a.name.localeCompare(b.name);
  });

  const [{ total }] = await db
    .select({ total: count() })
    .from(trainingParticipants)
    .where(eq(trainingParticipants.trainingId, trainingId));

  return c.json({ items, total: Number(total), page, limit });
});

// GET /trainings/:trainingId/sessions/:sessionId/participants/:userId/response?moduleId=
sessionsRouter.get("/:trainingId/sessions/:sessionId/participants/:userId/response", async (c) => {
  const { sessionId, userId } = c.req.param();
  const moduleId = c.req.query("moduleId");

  if (!moduleId) return c.json({ error: "moduleId required" }, 400);

  const response = await db.query.participantResponses.findFirst({
    where: and(
      eq(participantResponses.liveSessionId, sessionId),
      eq(participantResponses.moduleId, moduleId),
      eq(participantResponses.userId, userId),
    ),
    with: { user: true },
  });

  if (!response) return c.json({ error: "Not found" }, 404);
  return c.json(response);
});

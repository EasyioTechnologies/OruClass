import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { participantResponses } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";

export const responsesRouter = new Hono();

responsesRouter.use("*", authMiddleware);
responsesRouter.use("*", workspaceTenantMiddleware);

// POST /trainings/:trainingId/modules/:moduleId/responses
responsesRouter.post("/:trainingId/modules/:moduleId/responses", async (c) => {
  const { trainingId, moduleId } = c.req.param();
  const userId = c.get("userId") as string;
  const body = await c.req.json<{ responseData: Record<string, unknown> }>();

  // Upsert — one response per user per module
  const existing = await db.query.participantResponses.findFirst({
    where: and(
      eq(participantResponses.trainingId, trainingId),
      eq(participantResponses.moduleId, moduleId),
      eq(participantResponses.userId, userId),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(participantResponses)
      .set({ responseData: body.responseData, submittedAt: new Date() })
      .where(eq(participantResponses.id, existing.id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(participantResponses)
    .values({ trainingId, moduleId, userId, responseData: body.responseData })
    .returning();

  return c.json(created, 201);
});

// GET /trainings/:trainingId/modules/:moduleId/responses — aggregated (trainer only)
responsesRouter.get("/:trainingId/modules/:moduleId/responses", async (c) => {
  const { trainingId, moduleId } = c.req.param();

  const responses = await db.query.participantResponses.findMany({
    where: and(
      eq(participantResponses.trainingId, trainingId),
      eq(participantResponses.moduleId, moduleId),
    ),
    with: { user: true },
  });

  return c.json(responses);
});

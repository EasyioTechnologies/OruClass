import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/client";
import { trainingModules, trainings } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { requireTrainingPermission } from "../middleware/roleGuard";
import { getOrCreateState, persistState } from "../socket/state";
import { getIO } from "../socket/io-instance";
import { CreateModuleSchema, UpdateModuleSchema } from "@oruclass/validators";
import { parseBody } from "../utils/validators";

export const modulesRouter = new Hono();

modulesRouter.use("*", authMiddleware);
modulesRouter.use("*", workspaceTenantMiddleware);

// GET /trainings/:trainingId/modules
modulesRouter.get("/:trainingId/modules", async (c) => {
  const { trainingId } = c.req.param();

  const modules = await db.query.trainingModules.findMany({
    where: eq(trainingModules.trainingId, trainingId),
    orderBy: [asc(trainingModules.position)],
  });

  return c.json(modules);
});

// POST /trainings/:trainingId/modules
modulesRouter.post(
  "/:trainingId/modules",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId } = c.req.param();
    const body = await parseBody(c, CreateModuleSchema);

    const [module] = await db
      .insert(trainingModules)
      .values({ trainingId, ...body })
      .returning();

    return c.json(module, 201);
  },
);

// PATCH /trainings/:trainingId/modules/:moduleId
modulesRouter.patch(
  "/:trainingId/modules/:moduleId",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId, moduleId } = c.req.param();
    const body = await parseBody(c, UpdateModuleSchema);

    const [updated] = await db
      .update(trainingModules)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  },
);

// GET /trainings/:trainingId/modules/:moduleId/responses
modulesRouter.get(
  "/:trainingId/modules/:moduleId/responses",
  requireTrainingPermission("view_data"),
  async (c) => {
    const { trainingId, moduleId } = c.req.param();

    const { participantResponses } = await import("../db/schema");

    const responses = await db.query.participantResponses.findMany({
      where: and(
        eq(participantResponses.trainingId, trainingId),
        eq(participantResponses.moduleId, moduleId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: [asc(participantResponses.submittedAt)],
    });

    return c.json(responses);
  },
);

// DELETE /trainings/:trainingId/modules/:moduleId
modulesRouter.delete(
  "/:trainingId/modules/:moduleId",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId, moduleId } = c.req.param();

    await db
      .delete(trainingModules)
      .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)));

    // Clear dangling reference if this was the active module
    await db
      .update(trainings)
      .set({ currentActiveModuleId: null, updatedAt: new Date() })
      .where(and(eq(trainings.id, trainingId), eq(trainings.currentActiveModuleId, moduleId)));

    return c.json({ success: true });
  },
);

// POST /trainings/:trainingId/modules/:moduleId/unlock
modulesRouter.post(
  "/:trainingId/modules/:moduleId/unlock",
  requireTrainingPermission("unlock_modules"),
  async (c) => {
    const { trainingId, moduleId } = c.req.param();

    await db
      .update(trainingModules)
      .set({ isUnlocked: true, updatedAt: new Date() })
      .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)));

    await db
      .update(trainings)
      .set({ currentActiveModuleId: moduleId, updatedAt: new Date() })
      .where(eq(trainings.id, trainingId));

    const moduleData = await db.query.trainingModules.findFirst({
      where: eq(trainingModules.id, moduleId),
    });

    // Update in-memory state and broadcast to all room members
    const state = getOrCreateState(trainingId);
    state.activeModuleId = moduleId;
    await persistState(trainingId);

    getIO().to(`training:${trainingId}`).emit("module:unlocked", {
      moduleId,
      module: moduleData as any,
    });

    return c.json({ success: true, moduleId, module: moduleData });
  },
);

// POST /trainings/:trainingId/modules/reorder — bulk reorder positions
modulesRouter.post(
  "/:trainingId/modules/reorder",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId } = c.req.param();
    const { order } = await c.req.json<{ order: Array<{ id: string; position: number }> }>();

    await Promise.all(
      order.map(({ id, position }) =>
        db
          .update(trainingModules)
          .set({ position, updatedAt: new Date() })
          .where(and(eq(trainingModules.id, id), eq(trainingModules.trainingId, trainingId))),
      ),
    );

    return c.json({ success: true });
  },
);

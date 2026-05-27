import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/client";
import { trainingDays, trainingModules } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { requireTrainingPermission } from "../middleware/roleGuard";
import { CreateDaySchema, UpdateDaySchema, ReorderDaysSchema } from "@oruclass/validators";
import { parseBody } from "../utils/validators";

export const daysRouter = new Hono();

daysRouter.use("*", authMiddleware);
daysRouter.use("*", workspaceTenantMiddleware);

// GET /:trainingId/days — list days with their modules
daysRouter.get("/:trainingId/days", async (c) => {
  const { trainingId } = c.req.param();

  const days = await db.query.trainingDays.findMany({
    where: eq(trainingDays.trainingId, trainingId),
    orderBy: [asc(trainingDays.dayNumber)],
    with: {
      modules: {
        orderBy: [asc(trainingModules.position)],
      },
    },
  });

  return c.json(days);
});

// POST /:trainingId/days — create a new day
daysRouter.post(
  "/:trainingId/days",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId } = c.req.param();
    const body = await parseBody(c, CreateDaySchema);

    const [day] = await db
      .insert(trainingDays)
      .values({ trainingId, ...body, date: body.date ? new Date(body.date) : null })
      .returning();

    return c.json(day, 201);
  },
);

// PATCH /:trainingId/days/:dayId — update title, date, description
daysRouter.patch(
  "/:trainingId/days/:dayId",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId, dayId } = c.req.param();
    const body = await parseBody(c, UpdateDaySchema);

    const patch: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.date !== undefined) patch.date = body.date ? new Date(body.date) : null;

    const [updated] = await db
      .update(trainingDays)
      .set(patch)
      .where(and(eq(trainingDays.id, dayId), eq(trainingDays.trainingId, trainingId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  },
);

// DELETE /:trainingId/days/:dayId — delete day (modules get day_id = null via SET NULL cascade)
daysRouter.delete(
  "/:trainingId/days/:dayId",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId, dayId } = c.req.param();

    const existing = await db.query.trainingDays.findFirst({
      where: and(eq(trainingDays.id, dayId), eq(trainingDays.trainingId, trainingId)),
    });
    if (!existing) return c.json({ error: "Not found" }, 404);

    await db
      .delete(trainingDays)
      .where(and(eq(trainingDays.id, dayId), eq(trainingDays.trainingId, trainingId)));

    // Re-sequence remaining days so dayNumber stays contiguous
    const remaining = await db.query.trainingDays.findMany({
      where: eq(trainingDays.trainingId, trainingId),
      orderBy: [asc(trainingDays.dayNumber)],
    });

    await Promise.all(
      remaining.map((d, i) =>
        db
          .update(trainingDays)
          .set({ dayNumber: i + 1, updatedAt: new Date() })
          .where(eq(trainingDays.id, d.id)),
      ),
    );

    return c.json({ success: true });
  },
);

// POST /:trainingId/days/reorder — bulk reorder day numbers
daysRouter.post(
  "/:trainingId/days/reorder",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId } = c.req.param();
    const { order } = await parseBody(c, ReorderDaysSchema);

    await Promise.all(
      order.map(({ id, dayNumber }) =>
        db
          .update(trainingDays)
          .set({ dayNumber, updatedAt: new Date() })
          .where(and(eq(trainingDays.id, id), eq(trainingDays.trainingId, trainingId))),
      ),
    );

    return c.json({ success: true });
  },
);

// POST /:trainingId/days/:dayId/assign-module — assign an existing module to a day
daysRouter.post(
  "/:trainingId/days/:dayId/assign-module",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId, dayId } = c.req.param();
    const { moduleId } = await c.req.json<{ moduleId: string }>();

    const [updated] = await db
      .update(trainingModules)
      .set({ dayId, updatedAt: new Date() })
      .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)))
      .returning();

    if (!updated) return c.json({ error: "Module not found" }, 404);
    return c.json(updated);
  },
);

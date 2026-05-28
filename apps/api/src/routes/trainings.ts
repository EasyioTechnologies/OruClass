import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/client";
import { trainings, trainingFacilitators, trainingModules, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { requireTrainingPermission, invalidateRoleCache } from "../middleware/roleGuard";
import {
  CreateTrainingSchema,
  UpdateTrainingSchema,
  AssignFacilitatorSchema,
  FacilitatorInviteSchema,
  SessionStatusSchema,
} from "@oruclass/validators";
import { parseBody } from "../utils/validators";
import { randomBytes } from "crypto";
import { getIO } from "../socket/io-instance";

export const trainingsRouter = new Hono();

trainingsRouter.use("*", authMiddleware);
trainingsRouter.use("*", workspaceTenantMiddleware);

function generateJoinToken(): string {
  return randomBytes(12).toString("base64url");
}

// GET /trainings
trainingsRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId") as string;

  const rows = await db.query.trainings.findMany({
    where: eq(trainings.workspaceId, workspaceId),
    with: { 
      creator: true, 
      modules: true,
      days: { orderBy: (d, { asc }) => [asc(d.dayNumber)] }
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return c.json(rows);
});

// POST /trainings
trainingsRouter.post("/", async (c) => {
  const workspaceId = c.get("workspaceId") as string;
  const userId = c.get("userId") as string;
  const body = await parseBody(c, CreateTrainingSchema);

  const [training] = await db
    .insert(trainings)
    .values({
      workspaceId,
      title: body.title,
      category: body.category,
      description: body.description,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      joinToken: generateJoinToken(),
      createdBy: userId,
    })
    .returning();

  // Creator is automatically lead_trainer
  await db.insert(trainingFacilitators).values({
    trainingId: training.id,
    userId,
    role: "lead_trainer",
    assignedModules: [],
  });

  // Every training gets a default Attendance module — editable/deletable
  await db.insert(trainingModules).values({
    trainingId: training.id,
    title: "Attendance",
    moduleType: "attendance",
    position: 0,
    isAlwaysOn: true,
    config: {},
  });

  return c.json(training, 201);
});

// GET /trainings/:id
trainingsRouter.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId") as string;
  const { id } = c.req.param();

  const training = await db.query.trainings.findFirst({
    where: and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)),
    with: {
      modules: { orderBy: (m, { asc }) => [asc(m.position)] },
      facilitators: { with: { user: true } },
      participants: { with: { user: true } },
    },
  });

  if (!training) return c.json({ error: "Not found" }, 404);
  return c.json(training);
});

// PATCH /trainings/:id
trainingsRouter.patch(
  "/:id",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();
    const body = await parseBody(c, UpdateTrainingSchema);

    const [updated] = await db
      .update(trainings)
      .set({
        ...body,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  },
);

// DELETE /trainings/:id
trainingsRouter.delete(
  "/:id",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();

    await db
      .delete(trainings)
      .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)));

    return c.json({ success: true });
  },
);

// POST /trainings/:id/facilitators — assign facilitator role
trainingsRouter.post(
  "/:id/facilitators",
  requireTrainingPermission("assign_roles"),
  async (c) => {
    const { id: trainingId } = c.req.param();
    const body = await parseBody(c, AssignFacilitatorSchema);

    const existing = await db.query.trainingFacilitators.findFirst({
      where: and(
        eq(trainingFacilitators.trainingId, trainingId),
        eq(trainingFacilitators.userId, body.userId),
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(trainingFacilitators)
        .set({ role: body.role, assignedModules: body.assignedModules })
        .where(
          and(
            eq(trainingFacilitators.trainingId, trainingId),
            eq(trainingFacilitators.userId, body.userId),
          ),
        )
        .returning();
      invalidateRoleCache(body.userId, trainingId);
      return c.json(updated);
    }

    const [created] = await db
      .insert(trainingFacilitators)
      .values({ trainingId, ...body })
      .returning();

    invalidateRoleCache(body.userId, trainingId);
    return c.json(created, 201);
  },
);

// POST /trainings/:id/facilitators/invite — invite facilitator by email
trainingsRouter.post(
  "/:id/facilitators/invite",
  requireTrainingPermission("invite_participants"),
  async (c) => {
    const { id: trainingId } = c.req.param();
    const body = await parseBody(c, FacilitatorInviteSchema);

    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (!user) {
      return c.json({ error: "User with this email not found. They must sign up first." }, 404);
    }

    const existing = await db.query.trainingFacilitators.findFirst({
      where: and(
        eq(trainingFacilitators.trainingId, trainingId),
        eq(trainingFacilitators.userId, user.id),
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(trainingFacilitators)
        .set({ role: body.role, assignedModules: [] })
        .where(and(eq(trainingFacilitators.trainingId, trainingId), eq(trainingFacilitators.userId, user.id)))
        .returning();
      invalidateRoleCache(user.id, trainingId);
      return c.json(updated);
    }

    const [created] = await db
      .insert(trainingFacilitators)
      .values({ trainingId, userId: user.id, role: body.role, assignedModules: [] })
      .returning();

    invalidateRoleCache(user.id, trainingId);
    return c.json(created, 201);
  },
);

// PATCH /trainings/:id/status — start/end session
trainingsRouter.patch(
  "/:id/status",
  requireTrainingPermission("pause_room"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();
    const { status } = await parseBody(c, SessionStatusSchema);

    // Atomic check-and-set: lock conflicting rows FOR UPDATE inside the tx
    // so two concurrent activations cannot both pass the "no other active" check.
    const activating = ["connecting", "live", "paused"].includes(status);
    let conflict = false;
    const updated = await db.transaction(async (tx) => {
      if (activating) {
        const locked = await tx.execute(sql`
          SELECT id FROM ${trainings}
          WHERE workspace_id = ${workspaceId}
            AND id <> ${id}
            AND session_status IN ('connecting', 'live', 'paused')
          FOR UPDATE
        `);
        const rows = (locked as unknown as { rows?: unknown[] }).rows ?? (locked as unknown as unknown[]);
        if (Array.isArray(rows) && rows.length > 0) {
          conflict = true;
          return null;
        }
      }
      const [row] = await tx
        .update(trainings)
        .set({ sessionStatus: status, updatedAt: new Date() })
        .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)))
        .returning();
      return row ?? null;
    });

    if (conflict) {
      return c.json(
        { error: "Another session is already active in this workspace. Please stop it first." },
        409,
      );
    }

    if (updated) {
      // Create live session when opening/starting
      const { liveSessions } = await import("../db/schema");
      const userId = c.get("userId") as string;

      const { bustLiveSessionCache } = await import("../socket/handlers");
      if (status === "connecting") {
        // Finalize any lingering active session first
        await db
          .update(liveSessions)
          .set({ status: "completed", endedAt: new Date() })
          .where(and(eq(liveSessions.trainingId, id), eq(liveSessions.status, "active")));
        // Create new session
        await db.insert(liveSessions).values({ trainingId: id, createdBy: userId });
        bustLiveSessionCache(id);
        getIO().to(`training:${id}`).emit("session:resumed");
      } else if (status === "paused") {
        getIO().to(`training:${id}`).emit("session:paused");
      } else if (status === "live") {
        getIO().to(`training:${id}`).emit("session:started");
      } else if (status === "completed") {
        await db
          .update(liveSessions)
          .set({ status: "completed", endedAt: new Date() })
          .where(and(eq(liveSessions.trainingId, id), eq(liveSessions.status, "active")));
        bustLiveSessionCache(id);
        getIO().to(`training:${id}`).emit("session:ended");
      }
    }

    return c.json(updated);
  },
);

// POST /trainings/:id/reset — reset completed session to draft
trainingsRouter.post(
  "/:id/reset",
  requireTrainingPermission("pause_room"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();

    const { trainingModules } = await import("../db/schema");
    const { getOrCreateState, persistState } = await import("../socket/state");

    await db
      .update(trainingModules)
      .set({ isUnlocked: false, updatedAt: new Date() })
      .where(eq(trainingModules.trainingId, id));

    const [updated] = await db
      .update(trainings)
      .set({ sessionStatus: "draft", currentActiveModuleId: null, updatedAt: new Date() })
      .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)))
      .returning();

    if (updated) {
      // Finalize current live session on reset
      const { liveSessions } = await import("../db/schema");
      await db
        .update(liveSessions)
        .set({ status: "completed", endedAt: new Date() })
        .where(and(eq(liveSessions.trainingId, id), eq(liveSessions.status, "active")));

      const { bustLiveSessionCache } = await import("../socket/handlers");
      bustLiveSessionCache(id);

      // Clear socket state
      const state = getOrCreateState(id);
      state.activeModuleId = null;
      await persistState(id);

      getIO().to(`training:${id}`).emit("session:reset");
      getIO().to(`training:${id}`).emit("module:unlocked", { moduleId: null, module: null });
    }

    return c.json(updated);
  },
);

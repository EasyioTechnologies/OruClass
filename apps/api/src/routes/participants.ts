import { Hono } from "hono";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { trainingParticipants, trainings } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { joinTokenToCode } from "@oruclass/utils";

export const participantsRouter = new Hono();

participantsRouter.use("*", authMiddleware);

// GET /trainings/:trainingId/participants
participantsRouter.get("/:trainingId/participants", workspaceTenantMiddleware, async (c) => {
  const { trainingId } = c.req.param();

  const participants = await db.query.trainingParticipants.findMany({
    where: eq(trainingParticipants.trainingId, trainingId),
    with: { user: true },
  });

  return c.json(participants);
});

// GET /participant/sessions — get all trainings the user is participating in
participantsRouter.get("/participant/sessions", async (c) => {
  const userId = c.get("userId") as string;

  const participations = await db.query.trainingParticipants.findMany({
    where: eq(trainingParticipants.userId, userId),
    with: {
      training: {
        with: { creator: true }
      }
    },
    orderBy: (tp, { desc }) => [desc(tp.joinedAt)],
  });

  const trainingsList = participations.map(p => ({
    ...p.training,
    participantJoinedAt: p.joinedAt,
    participantConnectionStatus: p.connectionStatus
  }));

  return c.json(trainingsList);
});

// GET /participant/trainings/:id — get a specific training the user is participating in
participantsRouter.get("/participant/trainings/:id", async (c) => {
  const userId = c.get("userId") as string;
  const { id } = c.req.param();

  const participation = await db.query.trainingParticipants.findFirst({
    where: and(
      eq(trainingParticipants.userId, userId),
      eq(trainingParticipants.trainingId, id)
    ),
    with: {
      training: {
        with: { creator: true, modules: { orderBy: (m, { asc }) => [asc(m.position)] } }
      }
    }
  });

  if (!participation) return c.json({ error: "Not found or not participating" }, 404);

  return c.json(participation.training);
});

// POST /join/code — look up a live training by 6-digit session code
participantsRouter.post("/join/code", async (c) => {
  const { code } = await c.req.json<{ code: string }>();
  if (!code || !/^\d{6}$/.test(code)) {
    return c.json({ error: "Code must be 6 digits" }, 400);
  }

  const liveTrainings = await db.query.trainings.findMany({
    where: inArray(trainings.sessionStatus, ["live", "connecting"]),
  });

  const match = liveTrainings.find((t) => joinTokenToCode(t.joinToken) === code);
  if (!match) return c.json({ error: "No live session found with that code" }, 404);

  return c.json({ joinToken: match.joinToken });
});

// POST /join/:joinToken — public join via token
participantsRouter.post("/join/:joinToken", async (c) => {
  const { joinToken } = c.req.param();
  const userId = c.get("userId") as string;

  const training = await db.query.trainings.findFirst({
    where: eq(trainings.joinToken, joinToken),
  });

  if (!training) return c.json({ error: "Training not found" }, 404);
  if (training.sessionStatus !== "live" && training.sessionStatus !== "connecting") {
    return c.json({ error: "Training is not accepting participants", sessionStatus: training.sessionStatus }, 400);
  }

  const existing = await db.query.trainingParticipants.findFirst({
    where: and(
      eq(trainingParticipants.trainingId, training.id),
      eq(trainingParticipants.userId, userId),
    ),
  });

  if (!existing) {
    await db.insert(trainingParticipants).values({
      trainingId: training.id,
      userId,
      connectionStatus: "online",
    });
  } else {
    await db
      .update(trainingParticipants)
      .set({ connectionStatus: "online", lastHeartbeat: new Date() })
      .where(
        and(
          eq(trainingParticipants.trainingId, training.id),
          eq(trainingParticipants.userId, userId),
        ),
      );
  }

  return c.json({ training });
});

// POST /trainings/:trainingId/participants/heartbeat
participantsRouter.post("/:trainingId/participants/heartbeat", async (c) => {
  const { trainingId } = c.req.param();
  const userId = c.get("userId") as string;

  await db
    .update(trainingParticipants)
    .set({ lastHeartbeat: new Date(), connectionStatus: "online" })
    .where(
      and(
        eq(trainingParticipants.trainingId, trainingId),
        eq(trainingParticipants.userId, userId),
      ),
    );

  return c.json({ success: true });
});
// GET /:trainingId/participants/me/scratchpad
participantsRouter.get("/:trainingId/participants/me/scratchpad", async (c) => {
  const { trainingId } = c.req.param();
  const userId = c.get("userId") as string;

  const participation = await db.query.trainingParticipants.findFirst({
    where: and(
      eq(trainingParticipants.trainingId, trainingId),
      eq(trainingParticipants.userId, userId),
    ),
    columns: {
      personalNotes: true,
      personalWhiteboard: true,
    }
  });

  if (!participation) {
    return c.json({ error: "Not a participant in this training" }, 404);
  }

  return c.json(participation);
});

// PUT /:trainingId/participants/me/scratchpad
participantsRouter.put("/:trainingId/participants/me/scratchpad", async (c) => {
  const { trainingId } = c.req.param();
  const userId = c.get("userId") as string;
  const body = await c.req.json<{ personalNotes?: string; personalWhiteboard?: Record<string, unknown> }>();

  const updateData: Record<string, any> = {};
  if (body.personalNotes !== undefined) updateData.personalNotes = body.personalNotes;
  if (body.personalWhiteboard !== undefined) updateData.personalWhiteboard = body.personalWhiteboard;

  if (Object.keys(updateData).length === 0) {
    return c.json({ success: true });
  }

  await db
    .update(trainingParticipants)
    .set(updateData)
    .where(
      and(
        eq(trainingParticipants.trainingId, trainingId),
        eq(trainingParticipants.userId, userId),
      ),
    );

  return c.json({ success: true });
});

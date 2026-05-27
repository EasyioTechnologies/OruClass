import { db } from "../src/db/client";
import {
  users,
  workspaces,
  workspaceMembers,
  trainings,
  trainingModules,
  trainingParticipants,
  participantResponses,
  trainingFacilitators,
  trainingAnalytics,
} from "../src/db/schema";

export async function seedTestData() {
  const [user] = await db
    .insert(users)
    .values({ name: "Test User", email: "test@example.com" })
    .returning();

  const [workspace] = await db
    .insert(workspaces)
    .values({ name: "Test Workspace", ownerId: user.id })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  });

  const [training] = await db
    .insert(trainings)
    .values({
      workspaceId: workspace.id,
      title: "Test Training",
      category: "Test",
      createdById: user.id,
    })
    .returning();

  const [module] = await db
    .insert(trainingModules)
    .values({ trainingId: training.id, title: "Module 1", moduleType: "quiz", position: 0 })
    .returning();

  return { user, workspace, training, module };
}

export async function clearTestData() {
  await db.delete(trainingAnalytics);
  await db.delete(participantResponses);
  await db.delete(trainingParticipants);
  await db.delete(trainingFacilitators);
  await db.delete(trainingModules);
  await db.delete(trainings);
  await db.delete(workspaceMembers);
  await db.delete(workspaces);
  await db.delete(users);
}

import { db } from "../db/client";
import {
  trainingModules,
  participantResponses,
  trainingParticipants,
  trainingAnalytics,
} from "../db/schema";
import { eq, and } from "drizzle-orm";

export async function getTrainingAnalytics(trainingId: string) {
  const [modules, participants] = await Promise.all([
    db.select().from(trainingModules).where(eq(trainingModules.trainingId, trainingId)),
    db.select().from(trainingParticipants).where(eq(trainingParticipants.trainingId, trainingId)),
  ]);

  const responseRows = await db
    .select()
    .from(participantResponses)
    .where(eq(participantResponses.trainingId, trainingId));

  const moduleStats = modules.map((mod) => {
    const responses = responseRows.filter((r) => r.moduleId === mod.id);
    return {
      moduleId: mod.id,
      title: mod.title,
      moduleType: mod.moduleType,
      responseCount: responses.length,
      participantCount: participants.length,
      completionRate:
        participants.length > 0
          ? Math.round((responses.length / participants.length) * 100)
          : 0,
    };
  });

  return {
    trainingId,
    totalParticipants: participants.length,
    modules: moduleStats,
    generatedAt: new Date().toISOString(),
  };
}

export function generateCSV(data: Awaited<ReturnType<typeof getTrainingAnalytics>>): string {
  const header = "moduleId,title,moduleType,responseCount,participantCount,completionRate\n";
  const rows = data.modules
    .map((m) =>
      [m.moduleId, `"${m.title}"`, m.moduleType, m.responseCount, m.participantCount, m.completionRate].join(",")
    )
    .join("\n");
  return header + rows;
}

export async function saveAnalyticsSnapshot(
  trainingId: string,
  workspaceId: string,
  data: object,
  csvUrl: string | null = null
) {
  const existing = await db
    .select()
    .from(trainingAnalytics)
    .where(eq(trainingAnalytics.trainingId, trainingId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(trainingAnalytics)
      .set({ aggregateData: data as Record<string, unknown>, exportUrl: csvUrl ?? undefined, updatedAt: new Date() })
      .where(eq(trainingAnalytics.trainingId, trainingId));
  } else {
    await db.insert(trainingAnalytics).values({
      trainingId,
      workspaceId,
      aggregateData: data as Record<string, unknown>,
      exportUrl: csvUrl ?? undefined,
    });
  }
}

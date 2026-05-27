import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { seedTestData, clearTestData } from "../setup";
import { getTrainingAnalytics, generateCSV } from "../../src/services/analytics.service";

let testData: Awaited<ReturnType<typeof seedTestData>>;

beforeAll(async () => {
  testData = await seedTestData();
});

afterAll(async () => {
  await clearTestData();
});

describe("analytics.service", () => {
  it("returns zero participants for empty training", async () => {
    const analytics = await getTrainingAnalytics(testData.training.id);
    expect(analytics.trainingId).toBe(testData.training.id);
    expect(analytics.totalParticipants).toBe(0);
    expect(analytics.modules).toHaveLength(1);
  });

  it("module stats include completionRate", async () => {
    const analytics = await getTrainingAnalytics(testData.training.id);
    const mod = analytics.modules[0];
    expect(mod.moduleId).toBe(testData.module.id);
    expect(mod.completionRate).toBe(0);
  });

  it("generateCSV produces valid CSV", () => {
    const analytics = {
      trainingId: "t1",
      totalParticipants: 5,
      modules: [
        {
          moduleId: "m1",
          title: "Quiz 1",
          moduleType: "quiz",
          responseCount: 3,
          participantCount: 5,
          completionRate: 60,
        },
      ],
      generatedAt: new Date().toISOString(),
    };
    const csv = generateCSV(analytics);
    expect(csv).toContain("moduleId,title");
    expect(csv).toContain("m1");
    expect(csv).toContain("60");
  });
});

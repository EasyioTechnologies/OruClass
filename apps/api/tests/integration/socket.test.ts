import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { io as ioc } from "socket.io-client";
import { seedTestData, clearTestData } from "../setup";

const API_URL = "http://localhost:3001";
let testData: Awaited<ReturnType<typeof seedTestData>>;

beforeAll(async () => {
  testData = await seedTestData();
});

afterAll(async () => {
  await clearTestData();
});

function connectClient() {
  return ioc(API_URL, { autoConnect: false, transports: ["websocket"] });
}

describe("Socket.IO join/unlock flow", () => {
  it("participant:join → participant:joined broadcast", (done) => {
    const trainer = connectClient();
    const participant = connectClient();

    trainer.connect();
    trainer.on("connect", () => {
      trainer.emit("participant:join", {
        trainingId: testData.training.id,
        userId: testData.user.id,
        role: "trainer",
      });

      participant.connect();
      participant.on("connect", () => {
        participant.emit("participant:join", {
          trainingId: testData.training.id,
          userId: "participant-123",
          role: "participant",
        });
      });

      trainer.on("participant:joined", (data) => {
        expect(data.userId).toBe("participant-123");
        trainer.disconnect();
        participant.disconnect();
        done();
      });
    });
  });

  it("module:unlock → module:unlocked broadcast to all", (done) => {
    const trainer = connectClient();
    const observer = connectClient();

    trainer.connect();
    trainer.on("connect", () => {
      trainer.emit("participant:join", {
        trainingId: testData.training.id,
        userId: testData.user.id,
        role: "trainer",
      });

      observer.connect();
      observer.on("connect", () => {
        observer.emit("participant:join", {
          trainingId: testData.training.id,
          userId: "obs-456",
          role: "participant",
        });

        trainer.emit("module:unlock", {
          trainingId: testData.training.id,
          moduleId: testData.module.id,
        });
      });

      observer.on("module:unlocked", (data) => {
        expect(data.moduleId).toBe(testData.module.id);
        trainer.disconnect();
        observer.disconnect();
        done();
      });
    });
  });
});

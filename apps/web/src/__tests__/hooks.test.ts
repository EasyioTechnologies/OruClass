import { describe, it, expect, beforeEach } from "bun:test";
import { useAuthStore } from "../store/auth";
import { useLiveSessionStore } from "../store/liveSession";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().setUser(null);
  });

  it("starts with no user", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("sets and reads user", () => {
    const user = { id: "u1", name: "Alice", email: "alice@example.com", authProvider: "google" };
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user?.id).toBe("u1");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("signOut clears user", () => {
    useAuthStore.getState().setUser({ id: "u1", name: "Alice", email: "alice@example.com", authProvider: "google" });
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe("useLiveSessionStore", () => {
  beforeEach(() => {
    useLiveSessionStore.getState().reset();
  });

  it("starts empty", () => {
    const s = useLiveSessionStore.getState();
    expect(s.activeModule).toBeNull();
    expect(s.participants.size).toBe(0);
    expect(s.isPaused).toBe(false);
  });

  it("setActiveModule updates state", () => {
    const mod = { id: "m1", title: "Quiz", moduleType: "quiz" as const, position: 0, isUnlocked: true };
    useLiveSessionStore.getState().setActiveModule(mod as any);
    expect(useLiveSessionStore.getState().activeModule?.id).toBe("m1");
  });

  it("addParticipant adds to map", () => {
    useLiveSessionStore.getState().addParticipant({
      userId: "p1",
      name: "Bob",
      role: "participant",
      joinedAt: new Date().toISOString(),
      connectionStatus: "online",
    });
    expect(useLiveSessionStore.getState().participants.size).toBe(1);
  });
});

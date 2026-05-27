"use client";

import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useLiveSessionStore } from "@/store/liveSession";
import { useQueryClient } from "@tanstack/react-query";
import type { TrainingModule } from "@oruclass/types";

export function useSocketSession(trainingId: string | null) {
  const initialized = useRef(false);
  const setActiveModule = useLiveSessionStore((s) => s.setActiveModule);
  const addParticipant = useLiveSessionStore((s) => s.addParticipant);
  const removeParticipant = useLiveSessionStore((s) => s.removeParticipant);
  const setPaused = useLiveSessionStore((s) => s.setPaused);
  const reset = useLiveSessionStore((s) => s.reset);
  const setResponseCount = useLiveSessionStore((s) => s.setResponseCount);
  const setSocketStatus = useLiveSessionStore((s) => s.setSocketStatus);
  const qc = useQueryClient();

  useEffect(() => {
    if (!trainingId || initialized.current) return;
    initialized.current = true;

    const socket = connectSocket();

    const invalidateAll = () => {
      qc.invalidateQueries({ queryKey: ["training"] });
      qc.invalidateQueries({ queryKey: ["participant-training"] });
    };

    // Connection status
    socket.on("connect", () => setSocketStatus("connected"));
    socket.on("disconnect", () => setSocketStatus("disconnected"));
    socket.on("reconnect_attempt", () => setSocketStatus("reconnecting"));
    socket.on("reconnect", () => setSocketStatus("connected"));

    socket.on("module:unlocked", ({ moduleId, module }) => {
      setActiveModule(module || (moduleId ? ({ id: moduleId } as TrainingModule) : null));
      invalidateAll();
      qc.invalidateQueries({ queryKey: ["modules"] });
    });

    socket.on("participant:joined", (p) => {
      addParticipant({
        userId: p.userId,
        name: p.name,
        role: p.role as "trainer" | "participant",
        joinedAt: p.joinedAt,
        connectionStatus: "online",
      });
    });

    socket.on("participant:left", ({ userId }) => {
      removeParticipant(userId);
    });

    // Live response count — invalidates React Query + updates store so trainer sees immediate count
    socket.on("data:aggregate", ({ moduleId, responseCount }) => {
      setResponseCount(moduleId, responseCount);
      qc.invalidateQueries({ queryKey: ["module-responses", trainingId, moduleId] });
    });

    socket.on("session:paused", () => {
      setPaused(true);
      invalidateAll();
    });
    socket.on("session:resumed", () => {
      setPaused(false);
      invalidateAll();
    });
    socket.on("session:started", () => {
      setPaused(false);
      invalidateAll();
    });
    socket.on("session:ended", () => {
      reset();
      invalidateAll();
    });
    socket.on("session:reset", () => {
      reset();
      invalidateAll();
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("reconnect_attempt");
      socket.off("reconnect");
      socket.off("module:unlocked");
      socket.off("participant:joined");
      socket.off("participant:left");
      socket.off("data:aggregate");
      socket.off("session:paused");
      socket.off("session:resumed");
      socket.off("session:started");
      socket.off("session:ended");
      socket.off("session:reset");
      disconnectSocket();
      reset();
      initialized.current = false;
    };
  }, [trainingId, setActiveModule, addParticipant, removeParticipant, setPaused, reset, setResponseCount, setSocketStatus, qc]);

  return getSocket();
}

export function useSocket() {
  return getSocket();
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { useLiveSessionStore } from "@/store/liveSession";
import { useSocketSession } from "@/hooks/useSocket";
import { useParticipantTraining } from "@/hooks/useTrainings";
import { QUEUE_KEY, loadQueue, saveQueue } from "@/hooks/useResponseSubmit";
import { JoinSlide } from "./JoinSlide";
import { CompletedSlide } from "./CompletedSlide";
import { SelectModuleSlide } from "./SelectModuleSlide";
import { ParticipantModuleRenderer } from "../tools/ParticipantModuleRenderer";
import { ParticipantScratchpad } from "./ParticipantScratchpad";
import { ModuleStopwatch } from "./ModuleStopwatch";
import { cn } from "@oruclass/utils";
import { WifiOff, RefreshCw } from "lucide-react";

function clearQueue(trainingId: string) {
  try {
    localStorage.removeItem(QUEUE_KEY(trainingId));
  } catch {}
}

export function ParticipantLiveRoom({ trainingId }: { trainingId: string }) {
  const user = useAuthStore((s) => s.user);
  const { data: training } = useParticipantTraining(trainingId);
  const socket = useSocketSession(trainingId);
  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const setActiveModule = useLiveSessionStore((s) => s.setActiveModule);
  const addParticipant = useLiveSessionStore((s) => s.addParticipant);
  const socketStatus = useLiveSessionStore((s) => s.socketStatus);
  const flushingRef = useRef(false);

  // Flush any queued offline responses when reconnected
  const flushQueue = useCallback(() => {
    if (!socket || flushingRef.current) return;
    const queue = loadQueue(trainingId);
    if (queue.length === 0) return;

    flushingRef.current = true;
    let remaining = [...queue];

    const sendNext = () => {
      if (remaining.length === 0) {
        clearQueue(trainingId);
        flushingRef.current = false;
        return;
      }
      const item = remaining[0];
      socket.emit(
        "response:submit",
        { trainingId, moduleId: item.moduleId, responseData: item.responseData as Record<string, unknown> },
        (result) => {
          if (result.ok) {
            remaining = remaining.slice(1);
            saveQueue(trainingId, remaining);
          }
          sendNext();
        },
      );
    };
    sendNext();
  }, [socket, trainingId]);

  // Fallback sync: if socket event was missed but DB has an active module, restore state
  useEffect(() => {
    if (training?.sessionStatus !== "live") return;
    if (!training?.currentActiveModuleId) return;

    if (!activeModule || activeModule.id !== training.currentActiveModuleId) {
      const mod = training.modules?.find((m) => m.id === training.currentActiveModuleId);
      if (mod) setActiveModule(mod);
    }
  }, [training?.currentActiveModuleId, training?.sessionStatus, activeModule, training?.modules, setActiveModule]);

  useEffect(() => {
    if (!user || !trainingId || !socket) return;

    addParticipant({
      userId: user.id,
      name: user.name ?? "",
      role: "participant",
      joinedAt: new Date().toISOString(),
      connectionStatus: "online",
    });

    const handleConnect = () => {
      socket.emit("participant:join", { trainingId, role: "participant" });
      flushQueue();
    };

    if (socket.connected && training?.sessionStatus !== "draft" && training?.sessionStatus !== "completed") {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user, trainingId, socket, training?.sessionStatus, flushQueue]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!training) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const renderContent = () => {
    if (training.sessionStatus === "completed") {
      return <CompletedSlide training={training} isTrainer={false} />;
    }
    if (training.sessionStatus === "draft" || training.sessionStatus === "connecting") {
      return <JoinSlide training={training} trainingId={trainingId} isTrainer={false} />;
    }
    if (training.sessionStatus === "paused") {
      return <SelectModuleSlide training={training} isTrainer={false} />;
    }
    if (activeModule) {
      return (
        <ParticipantModuleRenderer
          key={activeModule.id}
          module={activeModule}
          trainingId={trainingId}
        />
      );
    }
    return <SelectModuleSlide training={training} isTrainer={false} />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
        <h2 className="font-semibold text-gray-900 text-[14px] truncate max-w-[200px] sm:max-w-none">
          {training.title}
        </h2>
        <span
          className={cn(
            "text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex-shrink-0",
            training.sessionStatus === "live"
              ? "bg-green-100 text-green-700"
              : training.sessionStatus === "paused"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {training.sessionStatus}
        </span>
      </div>

      {/* Socket status banner */}
      {socketStatus !== "connected" && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-1.5 text-xs font-semibold flex-shrink-0",
          socketStatus === "reconnecting"
            ? "bg-amber-50 text-amber-700 border-b border-amber-200"
            : "bg-red-50 text-red-700 border-b border-red-200",
        )}>
          {socketStatus === "reconnecting" ? (
            <><RefreshCw size={12} className="animate-spin" /> Reconnecting — your responses are saved locally</>
          ) : (
            <><WifiOff size={12} /> You are offline — responses will sync when reconnected</>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-y-auto">
        <ModuleStopwatch />
        {renderContent()}
      </div>

      {/* FAB Scratchpad */}
      {training.sessionStatus !== "completed" && (
        <ParticipantScratchpad trainingId={trainingId} />
      )}
    </div>
  );
}

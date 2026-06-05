"use client";

import { useEffect, useState } from "react";
import { useLiveSessionStore } from "@/store/liveSession";
import { useSocket } from "@/hooks/useSocket";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { cn } from "@oruclass/utils";

export function ModuleStopwatch() {
  const stopwatch = useLiveSessionStore((s) => s.stopwatch);
  const trainingId = useLiveSessionStore((s) => s.trainingId);
  const socket = useSocket();
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const myParticipant = Array.from(useLiveSessionStore((s) => s.participants.values())).find((p) => p.userId);
  const isTrainer = myParticipant?.role === "trainer";

  useEffect(() => {
    if (!stopwatch) {
      setDisplaySeconds(0);
      return;
    }

    if (!stopwatch.isRunning) {
      setDisplaySeconds(stopwatch.accumulatedSeconds);
      return;
    }

    const startTimestamp = new Date(stopwatch.lastStartedAt).getTime();
    const update = () => {
      const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
      setDisplaySeconds(stopwatch.accumulatedSeconds + elapsed);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [stopwatch]);

  if (!stopwatch) return null;

  const handleAction = (action: "pause" | "resume" | "reset") => {
    if (!trainingId || !socket) return;
    socket.emit("stopwatch:action", { trainingId, moduleId: stopwatch.moduleId, action });
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur border border-brand-200/50 shadow-sm px-3 py-1.5 rounded-full text-brand-900 absolute top-4 right-4 z-50">
      <Timer className="w-4 h-4 text-brand-500" />
      <span className="font-mono font-bold text-sm tracking-widest">{formatTime(displaySeconds)}</span>
      
      {isTrainer && (
        <div className="flex items-center gap-1 ml-2 border-l border-brand-200 pl-2">
          {stopwatch.isRunning ? (
            <button
              onClick={() => handleAction("pause")}
              className="p-1 hover:bg-brand-50 text-brand-600 rounded"
              title="Pause Stopwatch"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => handleAction("resume")}
              className="p-1 hover:bg-brand-50 text-brand-600 rounded"
              title="Resume Stopwatch"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => handleAction("reset")}
            className="p-1 hover:bg-red-50 text-red-500 rounded"
            title="Reset Stopwatch"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

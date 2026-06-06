"use client";

import { useEffect, useState } from "react";
import { useLiveSessionStore } from "@/store/liveSession";
import { useSocket } from "@/hooks/useSocket";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { cn } from "@oruclass/utils";

// canControl gates the pause/resume/reset buttons. It must reflect the
// pause_room permission (lead_trainer / full_editor only), NOT the binary
// trainer flag — partial_editor / facilitation_support are "trainers" but the
// server rejects their stopwatch:action, so showing them the buttons is a lie.
export function ModuleStopwatch({ canControl = false }: { canControl?: boolean }) {
  const stopwatch = useLiveSessionStore((s) => s.stopwatch);
  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const trainingId = useLiveSessionStore((s) => s.trainingId);
  const socket = useSocket();
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const timeLimit = activeModule?.config?.timeLimitSeconds ?? 0;
  const isCountdown = timeLimit > 0;

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
    const timeToFormat = isCountdown ? Math.max(0, timeLimit - totalSeconds) : totalSeconds;
    const m = Math.floor(timeToFormat / 60);
    const s = timeToFormat % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const remaining = isCountdown ? Math.max(0, timeLimit - displaySeconds) : null;
  const timeUp = isCountdown && remaining === 0;

  return (
    <div className={cn(
      "flex items-center gap-2 backdrop-blur shadow-sm px-3 py-1.5 rounded-full absolute top-4 right-4 z-50 transition-colors duration-300",
      timeUp ? "bg-red-50/90 border border-red-200 text-red-600" : "bg-white/80 border border-brand-200/50 text-brand-900"
    )}>
      <Timer className={cn("w-4 h-4", timeUp ? "text-red-500" : "text-brand-500")} />
      <span className="font-mono font-bold text-sm tracking-widest">{timeUp ? "Time's up!" : formatTime(displaySeconds)}</span>
      
      {canControl && (
        <div className={cn("flex items-center gap-1 ml-2 border-l pl-2", timeUp ? "border-red-200" : "border-brand-200")}>
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

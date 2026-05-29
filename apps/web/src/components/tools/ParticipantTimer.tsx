"use client";

import { useState, useEffect, useRef } from "react";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantTimer({ module }: Props) {
  const duration = module.config.durationSeconds ?? 300;
  const label = module.config.timerLabel ?? "Time remaining";
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const isFinished = remaining === 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      <p className="text-sm text-gray-500">{label}</p>

      {/* Circular timer */}
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <circle
            cx="50" cy="50" r="45"
            stroke={isFinished ? "#ef4444" : "#6366f1"}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-4xl font-mono font-bold ${isFinished ? "text-red-500" : "text-gray-900"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>

      {isFinished ? (
        <p className="text-red-500 font-semibold text-lg animate-pulse">Time's up!</p>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => setRunning(!running)}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => { setRunning(false); setRemaining(duration); }}
            className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

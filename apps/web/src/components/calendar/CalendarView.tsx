"use client";

import { useState, useMemo } from "react";
import { useWorkspaceStore } from "@/store/workspace";
import { useTrainings } from "@/hooks/useTrainings";
import type { Training } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ExternalLink,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS: Record<string, string> = {
  live: "bg-green-500",
  connecting: "bg-blue-500",
  paused: "bg-amber-500",
  completed: "bg-gray-400",
  draft: "bg-brand-500",
};

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function CalendarView() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const { data: trainings = [], isLoading } = useTrainings(workspaceId);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Training | null>(null);

  // Map date-string → trainings for fast lookup
  const byDay = useMemo(() => {
    const map = new Map<string, Training[]>();
    trainings.forEach((t) => {
      if (!t.scheduledAt) return;
      const d = new Date(t.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    });
    return map;
  }, [trainings]);

  const firstDay = startOfMonth(viewYear, viewMonth).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  // Trainings without a date — shown in sidebar
  const unscheduled = trainings.filter((t) => !t.scheduledAt);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Training schedule overview</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-900 px-2 min-w-[140px] text-center">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
            className="ml-2 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstDay + 1;
              const isCurrentMonth = dayNum >= 1 && dayNum <= totalDays;
              const cellDate = new Date(viewYear, viewMonth, dayNum);
              const isToday = isCurrentMonth && isSameDay(cellDate, today);
              const key = `${viewYear}-${viewMonth}-${dayNum}`;
              const events = byDay.get(key) ?? [];

              return (
                <div
                  key={i}
                  className={cn(
                    "border-b border-r border-gray-100 p-1.5 min-h-[80px] overflow-hidden",
                    !isCurrentMonth && "bg-gray-50/50",
                  )}
                >
                  {isCurrentMonth && (
                    <>
                      <div className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1",
                        isToday
                          ? "bg-brand-600 text-white"
                          : "text-gray-700",
                      )}>
                        {dayNum}
                      </div>
                      <div className="space-y-0.5">
                        {events.slice(0, 3).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelected(t)}
                            className="w-full text-left truncate text-[10px] font-medium rounded px-1.5 py-0.5 flex items-center gap-1 hover:opacity-80 transition-opacity bg-brand-50 text-brand-700 border border-brand-100"
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_COLORS[t.sessionStatus] ?? "bg-gray-400")} />
                            <span className="truncate">{t.title}</span>
                          </button>
                        ))}
                        {events.length > 3 && (
                          <div className="text-[10px] text-gray-400 pl-1">+{events.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar — detail + unscheduled */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          {/* Selected training detail */}
          {selected && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{selected.title}</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xs shrink-0">✕</button>
              </div>
              {selected.scheduledAt && (
                <p className="text-xs text-gray-500">
                  {new Date(selected.scheduledAt).toLocaleString(undefined, {
                    weekday: "short", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              )}
              <div className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", STATUS_COLORS[selected.sessionStatus] ?? "bg-gray-400")} />
                <span className="text-xs font-medium text-gray-700 capitalize">{selected.sessionStatus}</span>
              </div>
              {selected.description && (
                <p className="text-xs text-gray-500 line-clamp-3">{selected.description}</p>
              )}
              <a
                href={`/trainings/${selected.id}/studio`}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Open Studio <ExternalLink size={11} />
              </a>
            </div>
          )}

          {/* Unscheduled trainings */}
          {unscheduled.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex-1 overflow-hidden flex flex-col">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Unscheduled</h3>
              <div className="space-y-1.5 overflow-y-auto flex-1">
                {unscheduled.map((t) => (
                  <a
                    key={t.id}
                    href={`/trainings/${t.id}/studio`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg px-2 py-1.5 transition-colors group"
                  >
                    <Calendar size={13} className="text-gray-400 group-hover:text-brand-500 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-500 border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

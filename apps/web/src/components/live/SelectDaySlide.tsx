"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Layers } from "lucide-react";
import type { TrainingDay } from "@oruclass/types";
import { cn } from "@oruclass/utils";

interface Props {
  days: TrainingDay[];
  moduleCountForDay: (dayId: string | null) => number;
}

/**
 * Trainer-only gate shown before opening a multi-day training for joining.
 * Picking a day sets ?dayId=<id> in the URL — ControlPanel and AgendaPane
 * read that param and only surface modules assigned to the chosen day.
 * "All days" sets ?dayId=all to bypass the filter (run the whole training).
 */
export function SelectDaySlide({ days, moduleCountForDay }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = (dayId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dayId", dayId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-7 px-4 sm:px-8 py-8 select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center border-4 border-brand-100"
      >
        <CalendarDays className="w-10 h-10 text-brand-500" />
      </motion.div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-1.5">Which day are you running?</h3>
        <p className="text-[14px] text-gray-500 max-w-md mx-auto">
          Pick a day to start — only that day&apos;s modules will appear in the session.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-2.5">
        {sorted.map((d) => {
          const count = moduleCountForDay(d.id);
          return (
            <button
              key={d.id}
              onClick={() => select(d.id)}
              className="group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-white border border-gray-200 hover:border-brand-300 hover:shadow-sm active:scale-[.99] transition-all text-left"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex flex-col items-center justify-center leading-none">
                <span className="text-[8px] font-bold uppercase tracking-wider text-brand-400">Day</span>
                <span className="text-[15px] font-extrabold text-brand-700 tabular-nums">{d.dayNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 truncate">{d.title}</p>
                <p className="text-[12px] text-gray-400 font-medium">
                  {count} {count === 1 ? "module" : "modules"}
                  {d.deliveryMode && (
                    <> · {d.deliveryMode === "in_person" ? "In-Person" : d.deliveryMode === "online" ? "Virtual" : "Hybrid"}</>
                  )}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          );
        })}

        {/* All days — run the whole training without day filtering */}
        <button
          onClick={() => select("all")}
          className={cn(
            "group w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100",
            "hover:bg-gray-100 hover:border-gray-200 active:scale-[.99] transition-all text-left mt-1",
          )}
        >
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
            <Layers size={18} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-gray-700">All days</p>
            <p className="text-[12px] text-gray-400 font-medium">Run every module, ungrouped</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}

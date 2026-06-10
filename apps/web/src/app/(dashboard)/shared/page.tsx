"use client";

import Link from "next/link";
import { useSharedTrainings } from "@/hooks/useTrainings";
import { cn } from "@oruclass/utils";
import { SafeHTML } from "@/components/ui/SafeHTML";
import { Users } from "lucide-react";
import type { Training, TrainingRole } from "@oruclass/types";

const ROLE_LABELS: Record<TrainingRole, string> = {
  lead_trainer: "Lead Trainer",
  full_editor: "Full Editor",
  partial_editor: "Partial Editor",
  facilitation_support: "Support",
};

const ROLE_COLORS: Record<TrainingRole, string> = {
  lead_trainer: "bg-brand-50 text-brand-700 border-brand-100",
  full_editor: "bg-emerald-50 text-emerald-700 border-emerald-100",
  partial_editor: "bg-blue-50 text-blue-700 border-blue-100",
  facilitation_support: "bg-gray-100 text-gray-600 border-gray-200",
};

function SharedTrainingCard({ t }: { t: Training & { myRole: TrainingRole } }) {
  const canEdit = t.myRole === "lead_trainer" || t.myRole === "full_editor";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group flex flex-col h-full">
      <div className="p-6 bg-gradient-to-br from-gray-50/80 via-white to-blue-50/30 flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {t.labels?.map((label, idx) => (
              <span key={idx} className="px-3 py-1 bg-white text-gray-600 text-xs font-bold rounded-xl shadow-sm border border-gray-200 tracking-wide">
                {label}
              </span>
            ))}
            <span className="text-xs font-bold text-slate-500 bg-white/60 px-3 py-1 rounded-xl">
              {(t as { days?: unknown[] }).days?.length ?? 0} Days
            </span>
          </div>
          <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-xl border shrink-0", ROLE_COLORS[t.myRole])}>
            {ROLE_LABELS[t.myRole]}
          </span>
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 leading-tight mb-1 group-hover:text-brand-700 transition-colors">{t.title}</h3>
        {t.description && <SafeHTML html={t.description} className="text-sm text-slate-500 line-clamp-2 leading-relaxed" />}
      </div>
      <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-gray-100 mt-auto">
        {canEdit ? (
          <Link
            href={`/trainings/${t.id}/studio`}
            className="text-sm px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-bold shadow-sm shadow-brand-200"
          >
            Open Studio
          </Link>
        ) : (
          <Link
            href={`/trainings/${t.id}/studio`}
            className="text-sm px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-bold shadow-sm"
          >
            View Session
          </Link>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users size={13} />
          <span>Shared with you</span>
        </div>
      </div>
    </div>
  );
}

export default function SharedWithMePage() {
  const { data: trainings, isLoading } = useSharedTrainings();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Users size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shared with me</h1>
          <p className="text-sm text-gray-500 mt-0.5">Trainings where you&apos;ve been invited as a facilitator.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-200 h-56 animate-pulse" />
          ))}
        </div>
      ) : !trainings || trainings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
            <Users size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-700">No shared trainings yet</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            When someone invites you as a facilitator, their training will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {trainings.map((t) => (
            <SharedTrainingCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useTrainings } from "@/hooks/useTrainings";
import { useWorkspaceStore } from "@/store/workspace";
import { formatDate } from "@oruclass/utils";

import { useRouter } from "next/navigation";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Training } from "@oruclass/types";
import { useDeleteTraining } from "@/hooks/useTrainings";

function TrainingCard({ t }: { t: Training }) {
  const [expanded, setExpanded] = useState(false);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const deleteTraining = useDeleteTraining(workspaceId);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this training? This cannot be undone.")) {
      deleteTraining.mutate(t.id);
    }
  };

  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
      <div 
        className="p-5 cursor-pointer space-y-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{t.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{t.category}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.sessionStatus === "live"
                  ? "bg-green-100 text-green-700"
                  : t.sessionStatus === "completed"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {t.sessionStatus}
            </span>
            <button 
              onClick={handleDelete}
              className="text-gray-300 hover:text-red-500 transition-colors"
              title="Delete training"
            >
              <Trash2 size={14} />
            </button>
            {t.days && t.days.length > 0 && (
              expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
            )}
          </div>
        </div>
        {t.description && <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>}
        {t.scheduledAt && (
          <p className="text-xs text-gray-400">{formatDate(new Date(t.scheduledAt))}</p>
        )}
      </div>

      {/* Expanded Days Accordion */}
      {expanded && t.days && t.days.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Day-wise Plan</h4>
          <div className="space-y-3">
            {t.days.map((day) => (
              <div key={day.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-sm text-gray-900">Day {day.dayNumber}: {day.title}</h5>
                  {day.date && (
                    <span className="text-[11px] text-gray-400">{formatDate(new Date(day.date))}</span>
                  )}
                </div>
                {day.description && (
                  <p className="text-[12px] text-gray-500 leading-relaxed">{day.description}</p>
                )}
                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <Link
                    href={`/trainings/${t.id}/studio?dayId=${day.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Studio
                  </Link>
                  <Link
                    href={`/trainings/${t.id}/live?dayId=${day.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] px-3 py-1.5 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors font-medium"
                  >
                    Start Session
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Actions (bottom of card) */}
      <div className="p-4 border-t border-gray-100 flex gap-2 bg-white">
        <Link
          href={`/trainings/${t.id}/studio`}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          Full Studio
        </Link>
        <Link
          href={`/trainings/${t.id}/analytics`}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors ml-auto"
        >
          Analytics
        </Link>
      </div>
    </div>
  );
}

export function WorkspaceDashboard() {
  const router = useRouter();
  const { data: workspaces, isLoading } = useWorkspaces();
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: trainings, isLoading: trainingsLoading } = useTrainings(activeId ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoading && (!workspaces || workspaces.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Welcome to your Admin Dashboard!</h2>
        <p className="text-gray-500 max-w-sm">
          You don't have any workspaces yet. Create your first workspace to start building trainings.
        </p>
        <Link
          href="/workspaces/new"
          className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          Create Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Trainings</h1>
        <Link
          href="/trainings/new"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          New Training
        </Link>
      </div>

      {trainingsLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !trainings?.length ? (
        <p className="text-gray-500 py-12 text-center">No trainings yet. Create your first one.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainings.map((t) => (
            <TrainingCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

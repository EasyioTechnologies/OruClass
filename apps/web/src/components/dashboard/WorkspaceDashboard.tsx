"use client";

import Link from "next/link";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/useWorkspace";
import { useTrainings } from "@/hooks/useTrainings";
import { useWorkspaceStore } from "@/store/workspace";
import { formatDate } from "@oruclass/utils";

import { useRouter } from "next/navigation";

import { ChevronDown, ChevronUp, Trash2, CalendarDays, Play, ArrowRight, LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";
import type { Training } from "@oruclass/types";
import { useDeleteTraining } from "@/hooks/useTrainings";

function DeleteTrainingModal({ isOpen, onClose, training, onDelete }: { isOpen: boolean, onClose: () => void, training: Training, onDelete: () => void }) {
  const [input, setInput] = useState("");
  const isMatch = input === training.title;

  useEffect(() => {
    if (!isOpen) setInput("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Training</h3>
        <p className="text-slate-600 mb-6 text-sm">
          This action cannot be undone. This will permanently delete the <strong>{training.title}</strong> training and all its modules.
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Please type <strong>{training.title}</strong> to confirm.
          </label>
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
            placeholder={training.title}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
            Cancel
          </button>
          <button 
            disabled={!isMatch}
            onClick={() => { if(isMatch) onDelete(); }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Delete Training
          </button>
        </div>
      </div>
    </div>
  );
}

function TrainingCard({ t }: { t: Training }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const deleteTraining = useDeleteTraining(workspaceId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    deleteTraining.mutate(t.id);
    setIsDeleteModalOpen(false);
  };
  
  return (
    <>
    <div className="bg-white rounded-[2rem] border border-brand-100/50 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group flex flex-col h-full">
      {/* Header section with soft colorful gradient */}
      <div className="p-6 bg-gradient-to-br from-brand-50/80 via-white to-blue-50/50 flex-1">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-white text-brand-600 text-xs font-bold rounded-xl shadow-sm border border-brand-100/50 tracking-wide">
              {t.category}
            </span>
            <span className="text-xs font-bold text-slate-500 bg-white/60 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
              {t.sessionStatus}
            </span>
            <span className="text-xs font-bold text-slate-500 bg-white/60 px-3 py-1 rounded-xl">
              {t.days?.length || 0} Days
            </span>
          </div>
          <button 
            onClick={handleDeleteClick}
            className="text-slate-400 hover:text-red-500 hover:bg-white p-2 rounded-full transition-colors bg-white/50"
            title="Delete training"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <h3 className="text-xl font-extrabold text-slate-800 leading-tight mb-2 group-hover:text-brand-700 transition-colors">{t.title}</h3>
        {t.description && <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{t.description}</p>}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-brand-50/50 mt-auto">
        <Link
          href={`/trainings/${t.id}/studio`}
          className="text-sm px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-bold shadow-sm shadow-brand-200"
        >
          Open Studio
        </Link>
        <Link
          href={`/trainings/${t.id}/analytics`}
          className="text-sm text-slate-500 font-bold hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          Analytics <ArrowRight size={14} />
        </Link>
      </div>
    </div>
    
    <DeleteTrainingModal 
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      training={t}
      onDelete={confirmDelete}
    />
    </>
  );
}

export function WorkspaceDashboard() {
  const router = useRouter();
  const { data: workspaces, isLoading } = useWorkspaces();
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: trainings, isLoading: trainingsLoading } = useTrainings(activeId ?? "");
  const { mutate: deleteWorkspace } = useDeleteWorkspace();

  const handleDeleteWorkspace = () => {
    if (!activeId) return;
    if (confirm("Are you sure you want to delete this workspace and ALL its trainings? This cannot be undone!")) {
      deleteWorkspace(activeId, {
        onSuccess: () => {
          // If deleted, they will fall back to the "No Workspaces" screen
        }
      });
    }
  };

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
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Day-wise Trainings</h1>
          <p className="text-sm text-gray-500 mt-1">Select a day's session to start instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteWorkspace}
            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete Workspace
          </button>
          <Link
            href="/trainings/new"
            className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors text-sm font-semibold"
          >
            + New Training
          </Link>
        </div>
      </div>

      {trainingsLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !trainings?.length ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No trainings yet</h3>
          <p className="text-gray-500 mb-6">Create your first training to start building day-wise plans.</p>
          <Link
            href="/trainings/new"
            className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors text-sm font-semibold inline-flex"
          >
            Create Training
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {trainings.map((t) => (
            <TrainingCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

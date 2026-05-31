"use client";

import Link from "next/link";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspace";
import { useTrainings } from "@/hooks/useTrainings";
import { useWorkspaceStore } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { useSubscriptionStore } from "@/store/subscription";
import { formatDate } from "@oruclass/utils";
import { cn } from "@oruclass/utils";

import { useRouter } from "next/navigation";

import { ChevronDown, ChevronUp, Trash2, CalendarDays, Play, ArrowRight, LayoutGrid, Pencil, X, Crown, Sparkles, Zap, Shield, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getPlan } from "@/config/plans";
import type { Training } from "@oruclass/types";
import { useDeleteTraining, useUpdateTraining } from "@/hooks/useTrainings";

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

const CATEGORIES: { value: string; label: string }[] = [
  { value: "atl", label: "ATL" },
  { value: "maker_space", label: "Maker Space" },
  { value: "ict_cal", label: "ICT/CAL" },
];

function EditTrainingModal({ isOpen, onClose, training }: { isOpen: boolean; onClose: () => void; training: Training }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const updateTraining = useUpdateTraining(workspaceId, training.id);
  const [title, setTitle] = useState(training.title);
  const [category, setCategory] = useState(training.category);
  const [description, setDescription] = useState(training.description ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    training.scheduledAt ? new Date(training.scheduledAt).toISOString().slice(0, 16) : ""
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(training.title);
      setCategory(training.category);
      setDescription(training.description ?? "");
      setScheduledAt(training.scheduledAt ? new Date(training.scheduledAt).toISOString().slice(0, 16) : "");
    }
  }, [isOpen, training]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateTraining.mutate(
      { title: title.trim(), category, description: description.trim() || undefined, scheduledAt: scheduledAt || undefined },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Edit Training</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Optional description…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled at</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {updateTraining.isError && (
          <p className="text-sm text-red-500">Failed to update training. Try again.</p>
        )}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateTraining.isPending || !title.trim()}
            className="flex-1 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {updateTraining.isPending ? "Saving…" : "Save Changes"}
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

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
          <div className="flex items-center gap-1">
            <button
              onClick={handleEditClick}
              className="text-slate-400 hover:text-brand-600 hover:bg-white p-2 rounded-full transition-colors bg-white/50"
              title="Edit training"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-slate-400 hover:text-red-500 hover:bg-white p-2 rounded-full transition-colors bg-white/50"
              title="Delete training"
            >
              <Trash2 size={16} />
            </button>
          </div>
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
    <EditTrainingModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      training={t}
    />
    </>
  );
}

export function WorkspaceDashboard() {
  const router = useRouter();
  const { data: workspaces, isLoading } = useWorkspaces();
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: trainings, isLoading: trainingsLoading } = useTrainings(activeId ?? "");
  const { mutate: createWorkspace } = useCreateWorkspace();
  const user = useAuthStore((s) => s.user);
  const autoCreating = useRef(false);

  // Auto-create workspace for new trainers
  useEffect(() => {
    if (!isLoading && (!workspaces || workspaces.length === 0) && user && !autoCreating.current) {
      autoCreating.current = true;
      const firstName = user.name?.split(" ")[0] || "My";
      createWorkspace(`${firstName}'s Workspace`);
    }
  }, [isLoading, workspaces, user, createWorkspace]);



  if (isLoading || (!workspaces?.length && user)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { planId: subPlanId, status: subStatus } = useSubscriptionStore();
  const isPro = subStatus === "active";
  const currentPlan = subPlanId ? getPlan(subPlanId) : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Subscription Banner */}
      {isPro && currentPlan ? (
        /* PRO user welcome — premium feel */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/50 p-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-200/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-16 w-32 h-32 bg-gradient-to-tr from-orange-200/15 to-transparent rounded-full translate-y-1/2" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-300/30">
                <Crown size={20} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-800 text-gray-900">
                    {currentPlan.name} Plan
                  </h2>
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[9px] font-700 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Active
                  </span>
                </div>
                <p className="text-[12.5px] text-amber-700/70 font-500 mt-0.5">
                  All premium features unlocked — you&apos;re getting the full OruClassrooms experience
                </p>
              </div>
            </div>
            <Link
              href="/subscription/billing"
              className="hidden sm:flex items-center gap-1.5 bg-white/80 border border-amber-200 text-amber-700 px-3.5 py-2 rounded-xl text-[12px] font-600 hover:bg-white transition-all flex-shrink-0"
            >
              <Shield size={13} />
              Manage Plan
            </Link>
          </div>
        </div>
      ) : (
        /* Free user — upgrade nudge */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-5">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-8 w-36 h-36 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-800 text-white">
                  Unlock the full potential
                </h2>
                <p className="text-[12.5px] text-white/70 font-400 mt-0.5">
                  Get unlimited participants, advanced analytics, custom branding & more
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-4 text-[11px] text-white/60 mr-2">
                <span className="flex items-center gap-1"><Check size={11} strokeWidth={2.5} /> 7-day trial</span>
                <span className="flex items-center gap-1"><Check size={11} strokeWidth={2.5} /> Cancel anytime</span>
              </div>
              <Link
                href="/subscription"
                className="bg-white text-brand-600 px-4 py-2.5 rounded-xl text-[13px] font-700 hover:bg-white/90 transition-all flex items-center gap-1.5 shadow-sm flex-shrink-0"
              >
                View Plans
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Day-wise Trainings</h1>
          <p className="text-sm text-gray-500 mt-1">Select a day&apos;s session to start instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          {trainings && trainings.length > 0 && (
            <Link
              href="/trainings/new"
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors text-sm font-semibold w-full sm:w-auto text-center"
            >
              + New Training
            </Link>
          )}
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

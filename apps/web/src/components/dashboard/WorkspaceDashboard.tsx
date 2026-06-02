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

import { ChevronDown, ChevronUp, Trash2, CalendarDays, Play, ArrowRight, LayoutGrid, Pencil, X, Check } from "lucide-react";
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



const TYPES: { value: string; label: string }[] = [
  { value: "in_person", label: "In-Person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

function EditTrainingModal({ isOpen, onClose, training }: { isOpen: boolean; onClose: () => void; training: Training }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const updateTraining = useUpdateTraining(workspaceId, training.id);
  const [title, setTitle] = useState(training.title);
  const [labels, setLabels] = useState(training.labels?.join(", ") ?? "");
  const [type, setType] = useState(training.type || "in_person");
  const [description, setDescription] = useState(training.description ?? "");
  const [venue, setVenue] = useState(training.venue ?? "");
  const [meetingLink, setMeetingLink] = useState(training.meetingLink ?? "");
  const [startDate, setStartDate] = useState(
    training.startDate ? new Date(training.startDate).toISOString().split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    training.endDate ? new Date(training.endDate).toISOString().split("T")[0] : ""
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(training.title);
      setLabels(training.labels?.join(", ") ?? "");
      setType(training.type || "in_person");
      setDescription(training.description ?? "");
      setVenue(training.venue ?? "");
      setMeetingLink(training.meetingLink ?? "");
      setStartDate(training.startDate ? new Date(training.startDate).toISOString().split("T")[0] : "");
      setEndDate(training.endDate ? new Date(training.endDate).toISOString().split("T")[0] : "");
    }
  }, [isOpen, training]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateTraining.mutate(
      { 
        title: title.trim(), 
        labels: labels ? labels.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        type: type as "in_person" | "online" | "hybrid",
        description: description.trim() || undefined, 
        venue: venue.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined
      },
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels (comma separated)</label>
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="e.g. tech, leadership"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        {type === "in_person" || type === "hybrid" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Conference Room A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        ) : null}
        {type === "online" || type === "hybrid" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Meeting Link</label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="e.g. https://zoom.us/j/123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        ) : null}
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
            {t.labels?.map((label, idx) => (
              <span key={idx} className="px-3 py-1 bg-white text-brand-600 text-xs font-bold rounded-xl shadow-sm border border-brand-100/50 tracking-wide">
                {label}
              </span>
            ))}
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

  const { planId: subPlanId, status: subStatus } = useSubscriptionStore();
  const isPro = subStatus === "active";
  const currentPlan = subPlanId ? getPlan(subPlanId) : null;

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

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Subscription Banner */}
      {isPro && currentPlan ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-5 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[15px] font-800 text-white">
                    {currentPlan.name} Plan
                  </h2>
                  <span className="bg-white/20 text-white text-[9px] font-700 px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                    Active
                  </span>
                </div>
                <p className="text-[12.5px] text-white/70 font-400 mt-0.5">
                  All premium features unlocked
                </p>
              </div>
            </div>
            <Link
              href="/subscription/billing"
              className="flex items-center justify-center gap-1.5 bg-white/15 border border-white/20 text-white px-4 py-2 rounded-xl text-[12.5px] font-600 hover:bg-white/25 transition-all flex-shrink-0 backdrop-blur-sm sm:w-auto w-full"
            >
              Manage Plan
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.12)_0%,transparent_50%)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-800 text-white">
                  Unlock the full potential
                </h2>
                <p className="text-[12.5px] text-gray-400 font-400 mt-0.5">
                  Unlimited participants, analytics, custom branding & more
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="hidden lg:flex items-center gap-4 text-[11px] text-gray-500 mr-1">
                <span className="flex items-center gap-1"><Check size={11} strokeWidth={2.5} className="text-emerald-500" /> 7-day trial</span>
                <span className="flex items-center gap-1"><Check size={11} strokeWidth={2.5} className="text-emerald-500" /> Cancel anytime</span>
              </div>
              <Link
                href="/subscription"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 rounded-xl text-[13px] font-700 hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-1.5 shadow-[0_2px_12px_-2px_rgba(16,185,129,0.4)] flex-shrink-0"
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

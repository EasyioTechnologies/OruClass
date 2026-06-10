"use client";

import Link from "next/link";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspace";
import { useTrainings, useTrash, useRestoreTraining, useSharedTrainings } from "@/hooks/useTrainings";
import { useWorkspaceStore } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { useSubscriptionStore } from "@/store/subscription";
import { formatDate } from "@oruclass/utils";
import { cn } from "@oruclass/utils";

import { useRouter } from "next/navigation";

import { ChevronDown, ChevronUp, Trash2, CalendarDays, Play, ArrowRight, LayoutGrid, Pencil, X, Check, HelpCircle, Users } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import type { DriveStep } from "driver.js";
import { getPlan } from "@/config/plans";
import type { Training, TrainingRole } from "@oruclass/types";
import { useDeleteTraining, useUpdateTraining } from "@/hooks/useTrainings";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SafeHTML } from "@/components/ui/SafeHTML";

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
          Move <strong>{training.title}</strong> to trash? You can restore it later from the trash folder.
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
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Optional description…"
            minHeight="120px"
          />
          <div className="flex justify-end mt-1">
            <span className={cn("text-xs font-medium", description.replace(new RegExp("<[^>]*>?", "gm"), '').length > 2000 ? "text-red-500" : "text-gray-500")}>
              {description.replace(new RegExp("<[^>]*>?", "gm"), '').length} / 2000 characters
            </span>
          </div>
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
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Moving the start date shifts existing days to match.</p>
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

function RestoreTrainingCard({ t, index }: { t: Training; index: number }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const restoreTraining = useRestoreTraining(workspaceId);

  const handleRestore = () => {
    restoreTraining.mutate(t.id);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group flex flex-col h-full">
      <div className="p-6 bg-gradient-to-br from-gray-50/80 via-white to-gray-100/50 flex-1">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {t.labels?.map((label, idx) => (
              <span key={idx} className="px-3 py-1 bg-white text-gray-600 text-xs font-bold rounded-xl shadow-sm border border-gray-200 tracking-wide">
                {label}
              </span>
            ))}
          </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{t.title}</h3>
        {t.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">{t.description}</p>
        )}
        <div className="text-xs text-slate-500 mb-4">
          {t.days?.length || 0} days · Deleted
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={handleRestore}
          disabled={restoreTraining.isPending}
          className="flex-1 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors text-sm font-semibold"
        >
          {restoreTraining.isPending ? "Restoring…" : "Restore"}
        </button>
      </div>
    </div>
  );
}

function TrainingCard({ t, index }: { t: Training; index: number }) {
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
        {t.description && <SafeHTML html={t.description} className="text-sm text-slate-600 line-clamp-2 leading-relaxed" />}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-brand-50/50 mt-auto">
        <Link
          href={`/trainings/${t.id}/studio`}
          data-tour={index === 0 ? "open-studio" : undefined}
          className="text-sm px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-bold shadow-sm shadow-brand-200"
        >
          Open Studio
        </Link>
        <Link
          href={`/trainings/${t.id}/analytics`}
          data-tour={index === 0 ? "analytics" : undefined}
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
              {t.days?.length || 0} Days
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

export function WorkspaceDashboard() {
  const router = useRouter();
  const { data: workspaces, isLoading } = useWorkspaces();
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: trainings, isLoading: trainingsLoading } = useTrainings(activeId ?? "");
  const { data: sharedTrainings } = useSharedTrainings();
  const { data: trash, isLoading: trashLoading } = useTrash(activeId ?? "");
  const { mutate: createWorkspace } = useCreateWorkspace();
  const user = useAuthStore((s) => s.user);
  const autoCreating = useRef(false);
  const [showTrash, setShowTrash] = useState(false);

  const { planId: subPlanId, status: subStatus } = useSubscriptionStore();
  const isPro = subStatus === "active";
  const currentPlan = subPlanId ? getPlan(subPlanId) : null;

  const hasTrainings = !!trainings?.length;
  const tourSteps = useMemo<DriveStep[]>(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: "Welcome! 👋",
          description: "This is your dashboard. Here you build trainings and run them live. Quick look — takes 20 seconds.",
        },
      },
      {
        element: '[data-tour="new-training"]',
        popover: {
          title: "Make a training",
          description: "Tap here to start. You add your days and activities inside.",
        },
      },
    ];
    if (hasTrainings) {
      steps.push(
        {
          element: '[data-tour="open-studio"]',
          popover: {
            title: "Build your session",
            description: "Open Studio to add quizzes, polls, whiteboards and more. This is where you set everything up.",
          },
        },
        {
          element: '[data-tour="analytics"]',
          popover: {
            title: "See the results",
            description: "After the session, check here to see how everyone did.",
          },
        },
      );
    }
    return steps;
  }, [hasTrainings]);

  const tourReady = !isLoading && !trainingsLoading && !!user;
  const { startTour } = useOnboardingTour("trainer-dashboard-v1", tourSteps, tourReady);

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
        <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Check size={18} className="text-emerald-600" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-700 text-gray-900">
                    {currentPlan.name}
                  </h2>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-600 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  All features unlocked &middot; Renews {currentPlan.period === "month" ? "monthly" : currentPlan.period === "quarter" ? "quarterly" : "yearly"}
                </p>
              </div>
            </div>
            <Link
              href="/subscription/billing"
              className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 px-3.5 py-2 rounded-lg text-xs font-600 hover:bg-gray-50 transition-colors flex-shrink-0 sm:w-auto w-full"
            >
              Manage Billing
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <ArrowRight size={18} className="text-brand-600" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-700 text-gray-900">
                  Upgrade your plan
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Unlock unlimited participants, analytics, and custom branding
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="hidden lg:flex items-center gap-3 text-[11px] text-gray-400 mr-1">
                <span className="flex items-center gap-1"><Check size={11} strokeWidth={2.5} className="text-gray-400" /> 7-day trial</span>
                <span className="flex items-center gap-1"><Check size={11} strokeWidth={2.5} className="text-gray-400" /> Cancel anytime</span>
              </div>
              <Link
                href="/subscription"
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-600 hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                View Plans
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {showTrash ? "Trash" : "Day-wise Trainings"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {showTrash ? "Restore deleted trainings." : "Select a day's session to start instantly."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={startTour}
            className="flex items-center gap-1.5 px-3 py-2.5 text-gray-500 hover:text-brand-600 text-sm font-medium transition-colors"
            title="Show me around"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Take a tour</span>
          </button>
          {!showTrash && trash && trash.length > 0 && (
            <button
              onClick={() => setShowTrash(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors border border-gray-200"
              title="View trash"
            >
              <Trash2 size={16} />
              Trash ({trash.length})
            </button>
          )}
          {showTrash && (
            <button
              onClick={() => setShowTrash(false)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors border border-gray-200"
            >
              Back to Trainings
            </button>
          )}
          {!showTrash && trainings && trainings.length > 0 && (
            <Link
              href="/trainings/new"
              data-tour="new-training"
              className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors text-sm font-semibold w-full sm:w-auto text-center"
            >
              + New Training
            </Link>
          )}
        </div>
      </div>

      {showTrash ? (
        trashLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !trash?.length ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Trash is empty</h3>
            <p className="text-gray-500">Deleted trainings will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {trash.map((t, i) => (
              <RestoreTrainingCard key={t.id} t={t} index={i} />
            ))}
          </div>
        )
      ) : trainingsLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !trainings?.length ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No trainings yet</h3>
          <p className="text-gray-500 mb-6">Create your first training to start building day-wise plans.</p>
          <Link
            href="/trainings/new"
            data-tour="new-training"
            className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors text-sm font-semibold inline-flex"
          >
            Create Training
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {trainings.map((t, i) => (
            <TrainingCard key={t.id} t={t} index={i} />
          ))}
        </div>
      )}

      {sharedTrainings && sharedTrainings.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Shared with me</h2>
              <p className="text-sm text-gray-500">Trainings where you've been invited as a facilitator.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {sharedTrainings.map((t) => (
              <SharedTrainingCard key={t.id} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

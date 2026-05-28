"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useModules, useReorderModules, useUpdateModule, useDuplicateModule, useAssignModuleToDay } from "@/hooks/useModules";
import { useDays, useCreateDay, useDeleteDay, useUpdateDay } from "@/hooks/useDays";
import { useWorkspaceStore } from "@/store/workspace";
import { useWorkspaceMembers } from "@/hooks/useWorkspace";
import { useAssignFacilitator, useTraining, useInviteFacilitator, useTrainings } from "@/hooks/useTrainings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TrainingModule, TrainingRole, ModuleConfig, AttendanceField, TrainingDay } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import {
  GripVertical,
  ListChecks,
  PenLine,
  BookOpen,
  Table2,
  StickyNote,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  X,
  UserPlus,
  Users,
  CheckCircle2,
  Radio,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  Calendar,
  Pencil,
  AlertTriangle,
  Copy,
  MoveRight,
} from "lucide-react";

// ─── Module type config ──────────────────────────────────────────────────────

const MODULE_TYPES = [
  {
    type: "attendance",
    label: "Attendance",
    description: "Collect participant info — always the first module",
    Icon: ClipboardList,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    activeBg: "bg-teal-600",
  },
  {
    type: "quiz",
    label: "Quiz",
    description: "Multiple choice, short answer, or true/false questions",
    Icon: ListChecks,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    activeBg: "bg-violet-600",
  },
  {
    type: "whiteboard",
    label: "Whiteboard",
    description: "Free-draw collaborative canvas",
    Icon: PenLine,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-blue-600",
  },
  {
    type: "reflection",
    label: "Reflection",
    description: "Prompted written response for participants",
    Icon: BookOpen,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-600",
  },
  {
    type: "matrix",
    label: "Matrix",
    description: "Row × column grid for structured input",
    Icon: Table2,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBg: "bg-amber-600",
  },
  {
    type: "custom",
    label: "Sticky Notes",
    description: "Post-it style group brainstorm board",
    Icon: StickyNote,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    activeBg: "bg-pink-600",
  },
] as const;

type ModuleTypeDef = (typeof MODULE_TYPES)[number];

function getModuleDef(type: string): ModuleTypeDef {
  return (MODULE_TYPES.find((m) => m.type === type) ?? MODULE_TYPES[0]) as ModuleTypeDef;
}

const FACILITATOR_ROLES: { value: TrainingRole; label: string; description: string }[] = [
  { value: "lead_trainer", label: "Lead Trainer", description: "Full control over the session" },
  { value: "full_editor", label: "Full Editor", description: "Can edit content and modules" },
  { value: "partial_editor", label: "Partial Editor", description: "Limited editing access" },
  { value: "facilitation_support", label: "Support", description: "Read-only + chat participation" },
];

// ─── Module config editors ───────────────────────────────────────────────────

function ModuleConfigEditor({
  module,
  config,
  onChange,
}: {
  module: TrainingModule;
  config: ModuleConfig;
  onChange: (c: ModuleConfig) => void;
}) {
  if (module.moduleType === "quiz") {
    const questions = config.questions ?? [];
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Questions</p>
          <button
            onClick={() =>
              onChange({
                ...config,
                questions: [
                  ...questions,
                  { id: crypto.randomUUID(), text: "", type: "multiple_choice", options: ["", ""] },
                ],
              })
            }
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
          >
            <Plus size={12} />
            Add question
          </button>
        </div>
        {questions.length === 0 && (
          <div className="py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <ListChecks size={20} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No questions yet. Add one above.</p>
          </div>
        )}
        {questions.map((q, qi) => (
          <div key={q.id} className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">
                Q{qi + 1}
              </span>
              <input
                value={q.text}
                onChange={(e) => {
                  const updated = questions.map((x, i) => (i === qi ? { ...x, text: e.target.value } : x));
                  onChange({ ...config, questions: updated });
                }}
                className="flex-1 px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Question text"
              />
              <button
                onClick={() => onChange({ ...config, questions: questions.filter((_, i) => i !== qi) })}
                className="text-gray-300 hover:text-red-500 mt-0.5 shrink-0 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <select
              value={q.type}
              onChange={(e) => {
                const updated = questions.map((x, i) =>
                  i === qi ? { ...x, type: e.target.value as typeof q.type } : x,
                );
                onChange({ ...config, questions: updated });
              }}
              className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="short_answer">Short Answer</option>
              <option value="true_false">True / False</option>
            </select>
            {q.type === "multiple_choice" && (
              <div className="space-y-1.5 pl-1">
                {(q.options ?? []).map((opt, oi) => {
                  const isCorrect = !!opt && q.correctAnswer === opt;
                  return (
                    <div key={oi} className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        title={isCorrect ? "Correct answer" : "Mark as correct"}
                        onClick={() => {
                          const updated = questions.map((x, i) =>
                            i === qi ? { ...x, correctAnswer: opt } : x,
                          );
                          onChange({ ...config, questions: updated });
                        }}
                        className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                          isCorrect ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-emerald-400"
                        }`}
                      />
                      <input
                        value={opt}
                        onChange={(e) => {
                          const opts = (q.options ?? []).map((o, i) => (i === oi ? e.target.value : o));
                          const updated = questions.map((x, i) =>
                            i === qi
                              ? {
                                  ...x,
                                  options: opts,
                                  correctAnswer: x.correctAnswer === opt ? e.target.value : x.correctAnswer,
                                }
                              : x,
                          );
                          onChange({ ...config, questions: updated });
                        }}
                        className="flex-1 px-2 py-1 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                        placeholder={`Option ${oi + 1}`}
                      />
                      <button
                        onClick={() => {
                          const opts = (q.options ?? []).filter((_, i) => i !== oi);
                          const updated = questions.map((x, i) =>
                            i === qi
                              ? {
                                  ...x,
                                  options: opts,
                                  correctAnswer: x.correctAnswer === opt ? undefined : x.correctAnswer,
                                }
                              : x,
                          );
                          onChange({ ...config, questions: updated });
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => {
                    const opts = [...(q.options ?? []), ""];
                    const updated = questions.map((x, i) => (i === qi ? { ...x, options: opts } : x));
                    onChange({ ...config, questions: updated });
                  }}
                  className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 ml-5"
                >
                  <Plus size={11} /> Add option
                </button>
                <p className="text-[10px] text-gray-400 ml-5 mt-1">
                  Click the circle to mark the correct answer.
                </p>
              </div>
            )}
            {q.type === "true_false" && (
              <div className="flex gap-2 pl-1">
                {["True", "False"].map((opt) => {
                  const isCorrect = q.correctAnswer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const updated = questions.map((x, i) =>
                          i === qi ? { ...x, correctAnswer: opt } : x,
                        );
                        onChange({ ...config, questions: updated });
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isCorrect
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300"
                      }`}
                    >
                      {isCorrect ? `✓ ${opt} (correct)` : opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (module.moduleType === "reflection") {
    return (
      <div className="space-y-3 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Reflection prompt</label>
          <textarea
            value={config.prompt ?? ""}
            onChange={(e) => onChange({ ...config, prompt: e.target.value })}
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            placeholder="What would you like participants to reflect on?"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600 shrink-0">Max characters</label>
          <input
            type="number"
            min={50}
            max={5000}
            value={config.maxLength ?? 500}
            onChange={(e) => onChange({ ...config, maxLength: Number(e.target.value) })}
            className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    );
  }

  if (module.moduleType === "matrix") {
    const rows = config.rows ?? ["Row 1"];
    const cols = config.columns ?? ["Col 1"];
    return (
      <div className="space-y-4 mt-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">Rows</p>
            <button
              onClick={() => onChange({ ...config, rows: [...rows, `Row ${rows.length + 1}`] })}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1"
            >
              <Plus size={11} /> Add row
            </button>
          </div>
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={r}
                  onChange={(e) => {
                    const updated = rows.map((x, j) => (j === i ? e.target.value : x));
                    onChange({ ...config, rows: updated });
                  }}
                  className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={() => onChange({ ...config, rows: rows.filter((_, j) => j !== i) })}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">Columns</p>
            <button
              onClick={() => onChange({ ...config, columns: [...cols, `Col ${cols.length + 1}`] })}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1"
            >
              <Plus size={11} /> Add column
            </button>
          </div>
          <div className="space-y-1.5">
            {cols.map((c, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={c}
                  onChange={(e) => {
                    const updated = cols.map((x, j) => (j === i ? e.target.value : x));
                    onChange({ ...config, columns: updated });
                  }}
                  className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={() => onChange({ ...config, columns: cols.filter((_, j) => j !== i) })}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (module.moduleType === "whiteboard") {
    return (
      <div className="flex gap-3 mt-4">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Canvas width (px)</label>
          <input
            type="number"
            value={config.canvasWidth ?? 1200}
            onChange={(e) => onChange({ ...config, canvasWidth: Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Canvas height (px)</label>
          <input
            type="number"
            value={config.canvasHeight ?? 800}
            onChange={(e) => onChange({ ...config, canvasHeight: Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    );
  }

  if (module.moduleType === "attendance") {
    const fields = (config.attendanceFields as AttendanceField[]) ?? [];
    const addField = () =>
      onChange({
        ...config,
        attendanceFields: [
          ...fields,
          { id: crypto.randomUUID(), label: "", type: "text", required: false },
        ],
      });
    const updateField = (i: number, patch: Partial<AttendanceField>) => {
      const updated = fields.map((f, j) => (j === i ? { ...f, ...patch } : f));
      onChange({ ...config, attendanceFields: updated });
    };
    const removeField = (i: number) =>
      onChange({ ...config, attendanceFields: fields.filter((_, j) => j !== i) });

    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700">Custom fields</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Name is always collected automatically</p>
          </div>
          <button
            onClick={addField}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
          >
            <Plus size={12} /> Add field
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl">
          <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-xs text-teal-700 font-medium flex-1">Full Name</span>
          <span className="text-[10px] text-teal-500 bg-teal-100 rounded-full px-2 py-0.5">built-in · required</span>
        </div>

        {fields.length === 0 && (
          <div className="py-5 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400">No extra fields — only name will be collected.</p>
          </div>
        )}

        {fields.map((field, i) => (
          <div key={field.id} className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                className="flex-1 px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Field label (e.g. Organization)"
              />
              <button
                onClick={() => removeField(i)}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value as "text" | "email" | "tel" | "select" })}
                className="flex-1 px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="select">Dropdown</option>
              </select>
              <button
                onClick={() => updateField(i, { required: !field.required })}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-semibold px-2.5 rounded-lg border transition-colors",
                  field.required
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "bg-white border-gray-200 text-gray-400",
                )}
              >
                {field.required ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                Required
              </button>
            </div>
            {field.type === "select" && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 font-medium">Options (one per line)</p>
                <textarea
                  rows={3}
                  value={(field.options ?? []).join("\n")}
                  onChange={(e) =>
                    updateField(i, { options: e.target.value.split("\n").filter(Boolean) })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder={"Option A\nOption B\nOption C"}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (module.moduleType === "custom") {
    const PRESET_COLORS = ["#fef9c3", "#dcfce7", "#dbeafe", "#fce7f3", "#ede9fe"];
    return (
      <div className="mt-4">
        <label className="text-xs font-semibold text-gray-700 block mb-2">Note background color</label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ ...config, backgroundColor: c })}
              style={{ background: c }}
              className={cn(
                "w-7 h-7 rounded-lg border-2 transition-all",
                config.backgroundColor === c ? "border-gray-700 scale-110 shadow" : "border-gray-200 hover:scale-105",
              )}
            />
          ))}
          <input
            type="color"
            value={config.backgroundColor ?? "#fef9c3"}
            onChange={(e) => onChange({ ...config, backgroundColor: e.target.value })}
            className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer overflow-hidden"
            title="Custom color"
          />
        </div>
      </div>
    );
  }

  return null;
}

// ─── Sortable module card ────────────────────────────────────────────────────

function SortableModuleCard({
  module,
  index,
  workspaceId,
  trainingId,
}: {
  module: TrainingModule;
  index: number;
  workspaceId: string;
  trainingId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<ModuleConfig>(module.config);

  const updateModule = useUpdateModule(workspaceId, trainingId);
  const assignToDay = useAssignModuleToDay(workspaceId, trainingId);
  const duplicateModule = useDuplicateModule(workspaceId, trainingId);
  const { data: daysList = [] } = useDays(workspaceId, trainingId);
  const { data: trainingsList = [] } = useTrainings(workspaceId);
  const [copyTargetTrainingId, setCopyTargetTrainingId] = useState<string>(trainingId);
  const [copyTargetDayId, setCopyTargetDayId] = useState<string>("");
  const deleteModule = useMutation({
    mutationFn: () =>
      apiClient.delete(`/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${module.id}`, {
        headers: { "X-Workspace-ID": workspaceId },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
      qc.invalidateQueries({ queryKey: ["days", trainingId] });
    },
  });

  const saveConfig = () => {
    updateModule.mutate({ moduleId: module.id, data: { config: localConfig } });
    setExpanded(false);
  };

  const toggleAlwaysOn = () => {
    updateModule.mutate({ moduleId: module.id, data: { isAlwaysOn: !module.isAlwaysOn } });
  };

  const def = getModuleDef(module.moduleType);
  const { Icon } = def;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-white rounded-2xl border border-gray-200 overflow-hidden transition-shadow",
        isDragging ? "shadow-xl opacity-80 rotate-1" : "shadow-sm hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0"
        >
          <GripVertical size={16} />
        </div>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", def.bg)}>
            <Icon size={15} className={def.color} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{module.title}</p>
            <p className="text-[11px] text-gray-400">{def.label}</p>
          </div>
        </div>

        {module.moduleType === "attendance" ? (
          <div className="shrink-0 hidden sm:flex items-center gap-1 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
            <ClipboardList size={10} className="text-teal-600" />
            <span className="text-[10px] font-bold text-teal-700">First</span>
          </div>
        ) : (
          <div className="shrink-0 hidden sm:flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
            {index + 1}
          </div>
        )}

        {module.moduleType === "attendance" ? (
          <div className="shrink-0 flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700 font-medium">
            <Eye size={11} />
            <span className="hidden sm:inline">Always visible</span>
          </div>
        ) : (
          <button
            onClick={toggleAlwaysOn}
            title={
              module.isAlwaysOn
                ? "Always visible to participants (click to restrict)"
                : "Participants can only see this when trainer activates it (click to make always visible)"
            }
            className={cn(
              "shrink-0 flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all",
              module.isAlwaysOn
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600",
            )}
          >
            {module.isAlwaysOn ? <Eye size={11} /> : <EyeOff size={11} />}
            <span className="hidden sm:inline">{module.isAlwaysOn ? "Always visible" : "On demand"}</span>
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { setMoveOpen((v) => !v); setCopyOpen(false); setExpanded(false); }}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Move to day"
          >
            <MoveRight size={14} />
          </button>
          <button
            onClick={() => {
              setCopyOpen((v) => !v);
              setMoveOpen(false);
              setExpanded(false);
              setCopyTargetTrainingId(trainingId);
              setCopyTargetDayId("");
            }}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Copy to training or day"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => { setExpanded((v) => !v); setMoveOpen(false); setCopyOpen(false); }}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title={expanded ? "Close config" : "Configure module"}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${module.title}"?`)) deleteModule.mutate();
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete module"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {moveOpen && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/60 space-y-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Move to day</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { assignToDay.mutate({ moduleId: module.id, dayId: null }); setMoveOpen(false); }}
              disabled={assignToDay.isPending || module.dayId == null}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50",
                module.dayId == null
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600",
              )}
            >
              Unassigned
            </button>
            {daysList.map((d) => (
              <button
                key={d.id}
                onClick={() => { assignToDay.mutate({ moduleId: module.id, dayId: d.id }); setMoveOpen(false); }}
                disabled={assignToDay.isPending || module.dayId === d.id}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50",
                  module.dayId === d.id
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600",
                )}
              >
                Day {d.dayNumber} · {d.title}
              </button>
            ))}
            {daysList.length === 0 && (
              <p className="text-xs text-gray-400">No days yet. Create a day first.</p>
            )}
          </div>
        </div>
      )}

      {copyOpen && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/60 space-y-2.5">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Copy module</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-xs text-gray-600 space-y-1">
              <span className="font-medium">Target training</span>
              <select
                value={copyTargetTrainingId}
                onChange={(e) => { setCopyTargetTrainingId(e.target.value); setCopyTargetDayId(""); }}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              >
                {trainingsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id === trainingId ? `${t.title} (current)` : t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-600 space-y-1">
              <span className="font-medium">Target day</span>
              <select
                value={copyTargetDayId}
                onChange={(e) => setCopyTargetDayId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              >
                <option value="">Unassigned</option>
                {(copyTargetTrainingId === trainingId
                  ? daysList
                  : (trainingsList.find((t) => t.id === copyTargetTrainingId) as unknown as { days?: TrainingDay[] })?.days ?? []
                ).map((d) => (
                  <option key={d.id} value={d.id}>
                    Day {d.dayNumber} · {d.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={() => {
              duplicateModule.mutate(
                {
                  moduleId: module.id,
                  targetTrainingId: copyTargetTrainingId,
                  targetDayId: copyTargetDayId || null,
                },
                { onSuccess: () => setCopyOpen(false) },
              );
            }}
            disabled={duplicateModule.isPending}
            className="w-full py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {duplicateModule.isPending ? "Copying…" : "Copy module"}
          </button>
        </div>
      )}

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4">
          <ModuleConfigEditor module={module} config={localConfig} onChange={setLocalConfig} />
          <button
            onClick={saveConfig}
            disabled={updateModule.isPending}
            className="mt-4 w-full py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {updateModule.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add module drawer ───────────────────────────────────────────────────────

function AddModuleDrawer({
  onClose,
  workspaceId,
  trainingId,
  position,
  dayId,
}: {
  onClose: () => void;
  workspaceId: string;
  trainingId: string;
  position: number;
  dayId: string | null;
}) {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("quiz");
  const [title, setTitle] = useState("");

  const def = getModuleDef(selectedType);
  const effectivePosition = selectedType === "attendance" ? 0 : position;

  const addModule = useMutation({
    mutationFn: () =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules`,
        {
          title: title.trim() || def.label,
          moduleType: selectedType,
          position: effectivePosition,
          isAlwaysOn: selectedType === "attendance",
          dayId: dayId,
        },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
      qc.invalidateQueries({ queryKey: ["days", trainingId] });
      onClose();
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Add Module</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MODULE_TYPES.map((t) => {
          const selected = selectedType === t.type;
          return (
            <button
              key={t.type}
              onClick={() => setSelectedType(t.type)}
              className={cn(
                "flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all",
                selected ? `${t.bg} ${t.border}` : "border-gray-100 bg-gray-50 hover:border-gray-200",
              )}
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", selected ? "bg-white/70" : "bg-white border border-gray-200")}>
                <t.Icon size={14} className={selected ? t.color : "text-gray-500"} />
              </div>
              <div>
                <p className={cn("text-xs font-bold", selected ? t.color : "text-gray-700")}>{t.label}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedType === "attendance" && (
        <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2.5">
          <ClipboardList size={14} className="text-teal-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-teal-700 leading-snug">
            Attendance is always the <strong>first module</strong> and always visible to participants.
          </p>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">Module title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder={`e.g. Opening ${def.label}`}
          onKeyDown={(e) => e.key === "Enter" && !addModule.isPending && addModule.mutate()}
          autoFocus
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => addModule.mutate()}
          disabled={addModule.isPending}
          className="flex-1 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {addModule.isPending ? "Adding…" : "Add Module"}
        </button>
      </div>
    </div>
  );
}

// ─── Day header (inline editing) ─────────────────────────────────────────────

function DayTabHeader({
  day,
  workspaceId,
  trainingId,
}: {
  day: TrainingDay;
  workspaceId: string;
  trainingId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(day.title);
  const [dateVal, setDateVal] = useState(
    day.date ? new Date(day.date).toISOString().split("T")[0] : "",
  );
  const updateDay = useUpdateDay(workspaceId, trainingId);
  const deleteDay = useDeleteDay(workspaceId, trainingId);

  const save = () => {
    updateDay.mutate({
      dayId: day.id,
      data: {
        title: title.trim() || day.title,
        date: dateVal ? new Date(dateVal).toISOString() : null,
      },
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-brand-500 shrink-0" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateVal}
            onChange={(e) => setDateVal(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {dateVal && (
            <button onClick={() => setDateVal("")} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setTitle(day.title); setEditing(false); }}
            className="flex-1 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={updateDay.isPending}
            className="flex-1 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-60"
          >
            {updateDay.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <CalendarDays size={16} className="text-brand-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{day.title}</p>
          {day.date ? (
            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
              <Calendar size={10} />
              {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          ) : (
            <p className="text-[11px] text-gray-300 mt-0.5">No date set</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          title="Edit day"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${day.title}" and unassign its modules?`)) {
              deleteDay.mutate(day.id);
            }
          }}
          disabled={deleteDay.isPending}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          title="Delete day"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Day module list (sortable) ───────────────────────────────────────────────

function DayModuleList({
  modules,
  workspaceId,
  trainingId,
  dayId,
}: {
  modules: TrainingModule[];
  workspaceId: string;
  trainingId: string;
  dayId: string | null;
}) {
  const reorderModules = useReorderModules(workspaceId, trainingId);
  const [adding, setAdding] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);
    reorderModules.mutate(reordered.map((m, i) => ({ id: m.id, position: i })));
  };

  return (
    <div className="space-y-3">
      {adding && (
        <AddModuleDrawer
          onClose={() => setAdding(false)}
          workspaceId={workspaceId}
          trainingId={trainingId}
          position={modules.length}
          dayId={dayId}
        />
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {modules.map((m, i) => (
              <SortableModuleCard
                key={m.id}
                module={m}
                index={i}
                workspaceId={workspaceId}
                trainingId={trainingId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modules.length === 0 && !adding && (
        <div
          className="flex flex-col items-center justify-center py-12 bg-brand-50/40 rounded-2xl border-2 border-dashed border-brand-200 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all group"
          onClick={() => setAdding(true)}
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-100 group-hover:bg-brand-200 flex items-center justify-center mb-2.5 transition-colors">
            <Plus size={18} className="text-brand-600 group-hover:text-brand-700 transition-colors" />
          </div>
          <p className="text-sm font-semibold text-brand-700">
            Add first module for this day
          </p>
          <p className="text-xs text-brand-500/80 mt-1">Quiz, whiteboard, reflection, matrix, or sticky notes</p>
        </div>
      )}

      {!adding && modules.length > 0 && (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-brand-300 rounded-xl text-xs font-semibold text-brand-600 bg-brand-50/40 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-all"
        >
          <Plus size={13} /> Add module
        </button>
      )}
    </div>
  );
}

// ─── Facilitator panel ───────────────────────────────────────────────────────

function FacilitatorPanel({ trainingId, workspaceId }: { trainingId: string; workspaceId: string }) {
  const { data: training } = useTraining(workspaceId, trainingId);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);
  const assignFacilitator = useAssignFacilitator(workspaceId, trainingId);
  const inviteFacilitator = useInviteFacilitator(workspaceId, trainingId);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<TrainingRole>("full_editor");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [assignMode, setAssignMode] = useState<"member" | "email">("member");

  const facilitators: Array<{ userId: string; role: TrainingRole; user?: { name: string } }> =
    (training as any)?.facilitators ?? [];

  const unassigned = members.filter((m) => !facilitators.some((f) => f.userId === m.userId));
  const roleLabel = (role: TrainingRole) =>
    FACILITATOR_ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Facilitators</h2>
          {facilitators.length > 0 && (
            <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
              {facilitators.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAssign((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-semibold"
        >
          <UserPlus size={12} />
          Assign
        </button>
      </div>

      <div className="p-4 space-y-3">
        {facilitators.length === 0 && !showAssign && (
          <div className="py-5 text-center">
            <Users size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">No facilitators assigned</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Add workspace members to help run this session</p>
          </div>
        )}

        {facilitators.map((f) => (
          <div key={f.userId} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700">
                {(f.user?.name ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-gray-800 font-medium">{f.user?.name ?? f.userId}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium shrink-0">
              {roleLabel(f.role)}
            </span>
          </div>
        ))}

        {showAssign && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setAssignMode("member")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  assignMode === "member" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                )}
              >
                Workspace Member
              </button>
              <button
                onClick={() => setAssignMode("email")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  assignMode === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                )}
              >
                Invite by Email
              </button>
            </div>

            {assignMode === "member" && (
              <div className="space-y-2.5">
                {unassigned.length > 0 ? (
                  <>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Select member…</option>
                      {unassigned.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name} ({m.user.email})
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as TrainingRole)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {FACILITATOR_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} — {r.description}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAssign(false)}
                        className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!selectedUserId || assignFacilitator.isPending}
                        onClick={() => {
                          assignFacilitator.mutate(
                            { userId: selectedUserId, role: selectedRole },
                            { onSuccess: () => { setSelectedUserId(""); setShowAssign(false); } },
                          );
                        }}
                        className="flex-1 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
                      >
                        {assignFacilitator.isPending ? "Assigning…" : "Assign"}
                      </button>
                    </div>
                    {assignFacilitator.isError && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        {(assignFacilitator.error as any)?.response?.data?.error || "Failed to assign facilitator."}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">No unassigned workspace members.</p>
                )}
              </div>
            )}

            {assignMode === "email" && (
              <div className="space-y-2.5">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as TrainingRole)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {FACILITATOR_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAssign(false)}
                    className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!inviteEmail || !inviteEmail.includes("@") || inviteFacilitator.isPending}
                    onClick={() => {
                      inviteFacilitator.mutate(
                        { email: inviteEmail, role: selectedRole },
                        { onSuccess: () => { setInviteEmail(""); setShowAssign(false); } },
                      );
                    }}
                    className="flex-1 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
                  >
                    {inviteFacilitator.isPending ? "Inviting…" : "Invite"}
                  </button>
                </div>
                {inviteFacilitator.isError && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    {(inviteFacilitator.error as any)?.response?.data?.error || "Failed to invite facilitator."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session checklist panel ─────────────────────────────────────────────────

function SessionChecklist({ dayCount, moduleCount }: { dayCount: number; moduleCount: number }) {
  const tips = [
    {
      done: dayCount >= 1,
      label: "Organise into days",
      hint: "Add Day 1, Day 2… to structure your training curriculum.",
    },
    {
      done: moduleCount >= 1,
      label: "Add at least one module",
      hint: "Modules are the activities participants will do during the live session.",
    },
    {
      done: moduleCount >= 2,
      label: "Create a full flow (2+ modules)",
      hint: "Mix activity types — open with a quiz, close with reflection.",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Session checklist</h2>
      </div>
      <div className="p-4 space-y-3">
        {tips.map((t) => (
          <div key={t.label} className="flex items-start gap-2.5">
            <CheckCircle2
              size={15}
              className={cn("mt-0.5 shrink-0", t.done ? "text-emerald-500" : "text-gray-200")}
            />
            <div>
              <p className={cn("text-xs font-semibold", t.done ? "text-gray-700 line-through" : "text-gray-700")}>
                {t.label}
              </p>
              {!t.done && <p className="text-[10px] text-gray-400 mt-0.5">{t.hint}</p>}
            </div>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            <strong className="text-gray-600">Always visible</strong> modules are open to participants anytime.{" "}
            <strong className="text-gray-600">On demand</strong> modules only show when the trainer activates them.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main StudioPage ─────────────────────────────────────────────────────────

export function StudioPage({ trainingId }: { trainingId: string }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const { data: days = [], isLoading: daysLoading } = useDays(workspaceId, trainingId);
  const { data: allModules = [] } = useModules(workspaceId, trainingId);
  const createDay = useCreateDay(workspaceId, trainingId);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("dayId") ?? "general";

  // Active tab: day id, or "general" for unassigned modules
  const [activeTab, setActiveTab] = useState<string | "general">(initialTab);

  const unassignedModules = allModules.filter((m) => m.dayId == null);
  const showGeneralTab = unassignedModules.length > 0;

  // Resolve active tab — if first day exists and no unassigned, default to first day
  const effectiveTab = (() => {
    if (activeTab === "general") return showGeneralTab ? "general" : (days[0]?.id ?? "general");
    if (days.find((d) => d.id === activeTab)) return activeTab;
    return days[0]?.id ?? (showGeneralTab ? "general" : "new");
  })();

  const activeDay = days.find((d) => d.id === effectiveTab) ?? null;
  const activeDayModules = activeDay
    ? (allModules.filter((m) => m.dayId === activeDay.id).sort((a, b) => a.position - b.position))
    : [];

  const handleAddDay = () => {
    const newDayNumber = days.length + 1;
    createDay.mutate(
      { dayNumber: newDayNumber, title: `Day ${newDayNumber}` },
      {
        onSuccess: (res: any) => {
          const newDay = res.data;
          if (newDay?.id) setActiveTab(newDay.id);
        },
      },
    );
  };

  const totalModules = allModules.length;

  // ── Onboarding empty state ──
  if (!daysLoading && days.length === 0 && unassignedModules.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-1 space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Training Studio</h1>
            <p className="text-sm text-gray-500 mt-0.5">Build and configure activities for your live session</p>
          </div>
          <a
            href={`/trainings/${trainingId}/live`}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200"
          >
            <Radio size={14} />
            Go Live
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div
              className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:border-brand-300 hover:bg-brand-50/20 transition-all group"
              onClick={handleAddDay}
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-100 border border-brand-100 flex items-center justify-center mb-4 transition-colors">
                <CalendarDays size={24} className="text-brand-500" />
              </div>
              <p className="text-base font-bold text-gray-800 group-hover:text-brand-700 transition-colors">
                Start building your curriculum
              </p>
              <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
                Add Day 1 to get started. Each day holds its own set of activities.
              </p>
              <button
                disabled={createDay.isPending}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm shadow-brand-200"
              >
                <Plus size={15} />
                {createDay.isPending ? "Adding…" : "Add Day 1"}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <SessionChecklist dayCount={0} moduleCount={0} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-1 space-y-5 pb-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Training Studio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build and configure activities for your live session</p>
        </div>
        <a
          href={`/trainings/${trainingId}/live`}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200"
        >
          <Radio size={14} />
          Go Live
        </a>
      </div>

      {/* Day tabs row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {days.map((day) => {
          const dayMods = allModules.filter((m) => m.dayId === day.id);
          const isActive = effectiveTab === day.id;
          return (
            <button
              key={day.id}
              onClick={() => setActiveTab(day.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all border",
                isActive
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-200"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-200 hover:text-brand-700 hover:bg-brand-50/50",
              )}
            >
              <CalendarDays size={13} />
              <span>{day.title}</span>
              {dayMods.length > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500",
                  )}
                >
                  {dayMods.length}
                </span>
              )}
            </button>
          );
        })}

        {/* General tab for unassigned modules */}
        {showGeneralTab && (
          <button
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all border",
              effectiveTab === "general"
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50",
            )}
          >
            <AlertTriangle size={13} />
            <span>Unassigned</span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                effectiveTab === "general" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600",
              )}
            >
              {unassignedModules.length}
            </span>
          </button>
        )}

        {/* Add day button */}
        <button
          onClick={handleAddDay}
          disabled={createDay.isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold shrink-0 border border-dashed border-gray-300 text-gray-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-all disabled:opacity-50"
        >
          <Plus size={13} />
          {createDay.isPending ? "Adding…" : "Add Day"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: content area ── */}
        <div className="lg:col-span-2 space-y-4">
          {effectiveTab === "general" ? (
            <>
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Modules not assigned to a day</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    These modules were created before day organisation was set up. Assign them to a day or they will appear as general content.
                  </p>
                </div>
              </div>
              <DayModuleList
                modules={unassignedModules.sort((a, b) => a.position - b.position)}
                workspaceId={workspaceId}
                trainingId={trainingId}
                dayId={null}
              />
            </>
          ) : activeDay ? (
            <>
              <DayTabHeader day={activeDay} workspaceId={workspaceId} trainingId={trainingId} />
              <DayModuleList
                modules={activeDayModules}
                workspaceId={workspaceId}
                trainingId={trainingId}
                dayId={activeDay.id}
              />
            </>
          ) : null}
        </div>

        {/* ── Right: sidebar ── */}
        <div className="space-y-4">
          <SessionChecklist dayCount={days.length} moduleCount={totalModules} />
          <FacilitatorPanel trainingId={trainingId} workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
}

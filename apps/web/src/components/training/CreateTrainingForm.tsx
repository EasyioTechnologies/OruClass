"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTrainingSchema } from "@oruclass/validators";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace";
import { useCreateTraining } from "@/hooks/useTrainings";
import type { z } from "zod";

type FormData = {
  title: string;
  labels?: string;
  type: "in_person" | "online" | "hybrid";
  description?: string;
  venue?: string;
  meetingLink?: string;
  startDate?: string;
  endDate?: string;
};

interface Props {
  onSuccess?: (id: string) => void;
}



const TYPES: { value: string; label: string }[] = [
  { value: "in_person", label: "In-Person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

export function CreateTrainingForm({ onSuccess }: Props = {}) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const createTraining = useCreateTraining(workspaceId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ 
    resolver: zodResolver(CreateTrainingSchema) as any,
    defaultValues: {
      type: "in_person",
    }
  });

  const selectedType = watch("type");

  const onSubmit = async (data: FormData) => {
    console.log("Submitting CreateTraining form data:", data);
    
    // Add date formatting to convert datetime-local (e.g. 2026-06-01T12:00) 
    // to ISO string (e.g. 2026-06-01T12:00:00Z) expected by datetime validator
    const payload = {
      ...data,
      labels: Array.isArray(data.labels) ? data.labels : data.labels ? String(data.labels).split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };
    
    const { data: training } = await createTraining.mutateAsync(payload);
    router.push(`/trainings/${training.id}/studio`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          {...register("title")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="e.g. Classroom Management Strategies"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Labels (comma separated)</label>
          <input
            {...register("labels")}
            placeholder="e.g. leadership, tech, optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.labels && <p className="text-xs text-red-500 mt-1">{errors.labels.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            {...register("type")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          placeholder="Optional description…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            {...register("startDate")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            {...register("endDate")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {selectedType === "in_person" || selectedType === "hybrid" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue Location</label>
          <input
            {...register("venue")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Conference Room A"
          />
        </div>
      ) : null}

      {selectedType === "online" || selectedType === "hybrid" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Meeting Link</label>
          <input
            {...register("meetingLink")}
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. https://zoom.us/j/123456789"
          />
        </div>
      ) : null}

      {createTraining.isError && (
        <p className="text-sm text-red-500">Failed to create training. Try again.</p>
      )}

      <button
        type="submit"
        disabled={createTraining.isPending}
        className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors"
      >
        {createTraining.isPending ? "Creating…" : "Create Training"}
      </button>
    </form>
  );
}


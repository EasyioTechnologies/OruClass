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
  category: "atl" | "maker_space" | "ict_cal";
  description?: string;
  scheduledAt?: string;
};

interface Props {
  onSuccess?: (id: string) => void;
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: "atl", label: "ATL" },
  { value: "maker_space", label: "Maker Space" },
  { value: "ict_cal", label: "ICT/CAL" },
];

export function CreateTrainingForm({ onSuccess }: Props = {}) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const createTraining = useCreateTraining(workspaceId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(CreateTrainingSchema) as any });

  const onSubmit = async (data: FormData) => {
    console.log("Submitting CreateTraining form data:", data);
    const { data: training } = await createTraining.mutateAsync(data);
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          {...register("category")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled at</label>
        <input
          {...register("scheduledAt")}
          type="datetime-local"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

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

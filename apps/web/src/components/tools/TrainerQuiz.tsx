"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import type { TrainingModule, QuizQuestion } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerQuiz({ module, trainingId }: Props) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const questions = (module.config?.questions ?? []) as QuizQuestion[];

  const { data: responses, isLoading } = useQuery({
    queryKey: ["module-responses", trainingId, module.id],
    queryFn: async () => {
      const res = await apiClient.get(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${module.id}/responses`,
        { headers: { "X-Workspace-ID": workspaceId } }
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 0,
    refetchInterval: 5000,
  });

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="text-sm text-gray-500 font-medium">
          {responses?.length ?? 0} Responses
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-6">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading responses...</div>
        ) : responses?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <p>No responses yet.</p>
            <p className="text-sm">Participants are working on the quiz.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {responses?.map((r: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="font-semibold text-sm mb-2 text-brand-600">
                  {r.user?.name ?? "Anonymous Participant"}
                </div>
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.id} className="text-sm">
                      <div className="text-gray-500 text-xs mb-1">{q.text}</div>
                      <div className="font-medium text-gray-800">
                        {(r.responseData as Record<string, string>)[q.id] || "No answer"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

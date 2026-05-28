"use client";

import { useModuleResponses } from "@/hooks/useModuleResponses";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerReflectionJournal({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="text-sm text-gray-500 font-medium">
          {responses?.length ?? 0} Reflections
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading reflections...</div>
        ) : responses?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <p>No reflections yet.</p>
            <p className="text-sm">Participants are working on their journals.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {responses?.map((r) => {
              const text = r.responseData.type === "reflection" ? r.responseData.text : "";
              const when = r.createdAt ?? r.submittedAt;
              return (
                <div key={r.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                  <div className="font-semibold text-sm mb-3 text-brand-600 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
                      {(r.user?.name?.[0] ?? "A").toUpperCase()}
                    </div>
                    {r.user?.name ?? "Anonymous Participant"}
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap flex-1">
                    {text || "No content"}
                  </p>
                  <div className="mt-4 text-xs text-gray-400 text-right">
                    {new Date(when).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

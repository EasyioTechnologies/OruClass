"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerMatrix({ module, trainingId }: Props) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const rows = (module.config?.rows as string[]) ?? ["Row 1", "Row 2"];
  const cols = (module.config?.columns as string[]) ?? ["Column 1", "Column 2"];

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
          <div className="text-center text-gray-400">Loading matrices...</div>
        ) : responses?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <p>No matrices submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {responses?.map((r: any, i: number) => {
              const cells = (r.responseData as any)?.cells || {};
              return (
                <div key={i} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                  <div className="font-semibold text-sm mb-4 text-brand-600">
                    {r.user?.name ?? "Anonymous Participant"}
                  </div>
                  <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 text-left" />
                        {cols.map((c) => (
                          <th key={c} className="border-b border-l border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((rowLabel) => (
                        <tr key={rowLabel}>
                          <td className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                            {rowLabel}
                          </td>
                          {cols.map((colLabel) => (
                            <td key={colLabel} className="border-b border-l border-gray-200 px-4 py-2 text-sm text-gray-800">
                              {cells[`${rowLabel}__${colLabel}`] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface ModuleStat {
  moduleId: string;
  title: string;
  moduleType: string;
  responseCount: number;
  participantCount: number;
  completionRate: number;
}

interface AnalyticsData {
  trainingId: string;
  totalParticipants: number;
  modules: ModuleStat[];
  generatedAt: string;
}

export function AnalyticsDashboard({ trainingId }: { trainingId: string }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const qc = useQueryClient();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics", trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/analytics`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!(workspaceId && trainingId),
  });

  const exportCSV = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ jobId: string; status: string }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/analytics/export`,
        {},
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const modules = analytics?.modules ?? [];
  const avgCompletion =
    modules.length > 0
      ? Math.round(modules.reduce((sum, m) => sum + m.completionRate, 0) / modules.length)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Training Analytics</h1>
        <div className="flex items-center gap-3">
          {exportCSV.data && (
            <span className="text-xs text-green-600">Export queued (job {exportCSV.data.jobId})</span>
          )}
          <button
            onClick={() => exportCSV.mutate()}
            disabled={exportCSV.isPending}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {exportCSV.isPending ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{analytics?.totalParticipants ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{modules.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Completion</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{avgCompletion}%</p>
        </div>
      </div>

      {/* Per-module completion bar chart */}
      {modules.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Completion by Module</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modules} margin={{ top: 4, right: 8, bottom: 32, left: 0 }}>
              <XAxis
                dataKey="title"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
                {modules.map((_: ModuleStat, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Module breakdown table */}
      {modules.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Module Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responses
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m: ModuleStat, i: number) => (
                <tr key={m.moduleId} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <td className="px-5 py-3 font-medium text-gray-900">{m.title}</td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{m.moduleType}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {m.responseCount} / {m.participantCount}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.completionRate >= 75
                          ? "bg-green-100 text-green-700"
                          : m.completionRate >= 40
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!analytics && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No analytics data yet. Run a live session first.</p>
        </div>
      )}
    </div>
  );
}

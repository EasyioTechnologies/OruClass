"use client";

import React, { useState } from "react";
import { useWorkspaceResponses } from "@/hooks/useWorkspaceResponses";
import { format } from "date-fns";
import { Search, Loader2, ChevronLeft, Calendar, Users, ChevronDown, ChevronRight, Download } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";

export default function DataPage() {
  const { data: responses, isLoading, isError } = useWorkspaceResponses();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTrainingId, setActiveTrainingId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const [exportJobId, setExportJobId] = React.useState<string | null>(null);

  const exportExcel = useMutation({
    mutationFn: async (trainingId: string) => {
      const { data } = await apiClient.post<{ jobId: string; status: string }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/analytics/export`,
        {},
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    onSuccess: (data) => {
      setExportJobId(data.jobId);
    }
  });

  const { data: jobStatus } = useQuery({
    queryKey: ["analytics-export-job", exportJobId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ jobId: string; status: string; excelUrl: string | null }>(
        `/api/workspaces/${workspaceId}/trainings/${activeTrainingId}/analytics/export/${exportJobId}`,
        { headers: { "X-Workspace-ID": workspaceId } }
      );
      return data;
    },
    enabled: !!exportJobId && !!activeTrainingId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 1500;
    }
  });

  React.useEffect(() => {
    if (jobStatus?.status === "completed" && jobStatus.excelUrl) {
      window.open(jobStatus.excelUrl, "_blank");
      setExportJobId(null);
    }
  }, [jobStatus]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <p>Failed to load responses data.</p>
      </div>
    );
  }

  const filteredResponses = responses?.filter((res) => {
    const term = searchTerm.toLowerCase();
    return (
      res.user?.name?.toLowerCase().includes(term) ||
      res.user?.email?.toLowerCase().includes(term) ||
      res.training?.title?.toLowerCase().includes(term) ||
      res.module?.title?.toLowerCase().includes(term)
    );
  }) ?? [];

  const groupedByTraining = filteredResponses.reduce((acc, response) => {
    const trainingId = response.trainingId || "unknown";
    if (!acc[trainingId]) {
      acc[trainingId] = {
        training: response.training,
        responses: [],
      };
    }
    acc[trainingId].responses.push(response);
    return acc;
  }, {} as Record<string, { training: any; responses: typeof filteredResponses }>);

  // If a training is selected, show details
  if (activeTrainingId && groupedByTraining[activeTrainingId]) {
    const activeGroup = groupedByTraining[activeTrainingId];
    
    // Group responses by date
    const groupedByDate = activeGroup.responses.reduce((acc, response) => {
      const dateStr = format(new Date(response.submittedAt), "MMM d, yyyy");
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(response);
      return acc;
    }, {} as Record<string, typeof filteredResponses>);

    // Sort dates (descending)
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
      <div className="flex flex-col h-full space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTrainingId(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeGroup.training?.title || "Unknown Training"}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Users className="w-4 h-4" /> 
              {activeGroup.responses.length} Total Responses
            </p>
          </div>
          <div className="flex items-center gap-3">
            {exportJobId && jobStatus?.status !== "completed" && (
              <span className="text-xs text-brand-600 animate-pulse font-medium">Generating Excel...</span>
            )}
            <button
              onClick={() => exportExcel.mutate(activeTrainingId)}
              disabled={exportExcel.isPending || !!exportJobId}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-sm"
            >
              {exportExcel.isPending || !!exportJobId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exportExcel.isPending || !!exportJobId ? "Exporting…" : "Export Excel"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-4 pb-6 pr-2">
          {sortedDates.map((dateStr) => {
            const dateResponses = groupedByDate[dateStr];
            const isExpanded = expandedDates[dateStr];

            return (
              <div key={dateStr} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <button 
                  onClick={() => toggleDate(dateStr)}
                  className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between hover:bg-gray-100 transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{dateStr}</h3>
                    <span className="inline-flex items-center justify-center bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full text-xs font-medium ml-2">
                      {dateResponses.length} {dateResponses.length === 1 ? "Response" : "Responses"}
                    </span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </button>
                
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Participant
                          </th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Module
                          </th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Response Data
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {dateResponses.map((response) => (
                          <tr key={response.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">
                                  {response.user?.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{response.user?.name}</p>
                                  <p className="text-xs text-gray-500">{response.user?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {response.module?.title}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(response.submittedAt), "h:mm a")}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                              <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-100 text-xs text-gray-600 max-h-24 overflow-y-auto">
                                {JSON.stringify(response.responseData, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data & Responses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and view all participant responses across your trainings.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by participant, training..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6 pb-6 pr-2">
        {Object.values(groupedByTraining).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-gray-500">
            No responses found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(groupedByTraining).map((group) => (
              <div 
                key={group.training?.id || "unknown"} 
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveTrainingId(group.training?.id || "unknown")}
              >
                <div className="p-6 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {group.training?.title || "Unknown Training"}
                  </h2>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{group.responses.length} {group.responses.length === 1 ? 'Response' : 'Responses'}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-brand-600 font-medium hover:text-brand-700">View Data →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

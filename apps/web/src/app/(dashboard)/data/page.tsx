"use client";

import React, { useState } from "react";
import { useWorkspaceResponses } from "@/hooks/useWorkspaceResponses";
import { format } from "date-fns";
import { Search, Loader2 } from "lucide-react";

export default function DataPage() {
  const { data: responses, isLoading, isError } = useWorkspaceResponses();
  const [searchTerm, setSearchTerm] = useState("");

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

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Training
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Submitted At
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Response Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResponses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No responses found.
                  </td>
                </tr>
              ) : (
                filteredResponses.map((response) => (
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
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 font-medium">
                        {response.training?.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {response.module?.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(response.submittedAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                      <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-100 text-xs text-gray-600 max-h-24 overflow-y-auto">
                        {JSON.stringify(response.responseData, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

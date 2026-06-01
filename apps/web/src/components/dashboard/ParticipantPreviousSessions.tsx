"use client";

import Link from "next/link";
import { useParticipatingSessions } from "@/hooks/useParticipant";
import { formatDate, cn } from "@oruclass/utils";

export function ParticipantPreviousSessions() {
  const { data: allSessions, isLoading } = useParticipatingSessions();
  const sessions = allSessions?.filter(t => t.sessionStatus === "completed") || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Previous Sessions</h2>
        <p className="text-gray-500 text-sm mt-1">
          Review information and resources from your completed trainings.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !sessions.length ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-500">You don't have any previous sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sessions.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-3 hover:shadow-sm transition-shadow flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate" title={t.title}>{t.title}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 bg-gray-100 text-gray-600">
                    Ended
                  </span>
                </div>
                {t.creator?.name && (
                  <p className="text-xs text-gray-500 mt-1">Trainer: {t.creator.name}</p>
                )}
                {t.participantJoinedAt && (
                  <p className="text-xs text-gray-400 mt-1">Joined: {formatDate(new Date(t.participantJoinedAt))}</p>
                )}
              
                <div className="mt-auto pt-3">
                  <Link
                    href={`/participant/training/${t.id}`}
                    className="block w-full text-center py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    View Session
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

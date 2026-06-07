"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { useParticipatingSessions } from "@/hooks/useParticipant";
import { ParticipantJoin } from "./ParticipantJoin";
import { formatDate, cn } from "@oruclass/utils";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import type { DriveStep } from "driver.js";

const PARTICIPANT_TOUR: DriveStep[] = [
  {
    popover: {
      title: "Welcome! 👋",
      description: "This is where you join your trainer's live sessions. Just two things to know.",
    },
  },
  {
    element: '[data-tour="join-code"]',
    popover: {
      title: "Join with a code",
      description: "Your trainer gives you a 6-digit code. Type it here to join the session.",
    },
  },
  {
    element: '[data-tour="active-sessions"]',
    popover: {
      title: "Your sessions",
      description: "Sessions you already joined show up here. Tap one to go back in anytime.",
    },
  },
];

export function ParticipantDashboard() {
  const { data: allSessions, isLoading } = useParticipatingSessions();
  const sessions = allSessions?.filter(t => t.sessionStatus === "live" || t.sessionStatus === "paused") || [];
  const { startTour } = useOnboardingTour("participant-dashboard-v1", PARTICIPANT_TOUR, !isLoading);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner / Join Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row gap-4 sm:gap-6 items-center justify-between">
        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl font-bold text-gray-900">Welcome to your Participant Dashboard</h2>
            <button
              onClick={startTour}
              className="flex items-center gap-1 text-gray-400 hover:text-brand-600 text-xs font-medium transition-colors"
              title="Show me around"
            >
              <HelpCircle size={15} />
              <span className="hidden sm:inline">Take a tour</span>
            </button>
          </div>
          <p className="text-gray-500 text-sm max-w-lg">
            This is your dedicated space for attending trainings. You can join a live session using the 6-digit code provided by your trainer, or rejoin an active session from your recent trainings below.
          </p>
        </div>
        <div data-tour="join-code" className="w-full md:w-auto md:min-w-[320px]">
          <ParticipantJoin />
        </div>
      </div>

      {/* Sessions Grid */}
      <div data-tour="active-sessions" className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Active Sessions</h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !sessions.length ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-500">You don't have any active sessions right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {sessions.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 space-y-3 hover:shadow-sm transition-shadow flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate" title={t.title}>{t.title}</h3>
                  </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0",
                        t.sessionStatus === "live"
                          ? "bg-green-100 text-green-700"
                          : t.sessionStatus === "paused"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {t.sessionStatus === "live" ? "Live" : t.sessionStatus === "paused" ? "Paused" : "Ended"}
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
                    href={`/join/${t.joinToken}`}
                    className={cn(
                      "block w-full text-center py-2 rounded-lg text-sm font-medium transition-colors",
                      t.sessionStatus === "live" || t.sessionStatus === "paused"
                        ? "bg-brand-600 text-white hover:bg-brand-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {t.sessionStatus === "live" || t.sessionStatus === "paused" ? "Rejoin Session" : "View Session"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Want to host your own trainings?{" "}
          <Link href="/login/trainer" className="text-brand-600 font-medium hover:underline">
            Switch to Trainer
          </Link>
        </p>
      </div>
    </div>
  );
}

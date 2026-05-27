"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Training } from "@oruclass/types";

export type ParticipatingTraining = Training & {
  participantJoinedAt: string;
  participantConnectionStatus: string;
  creator?: { name: string; email: string };
};

export function useParticipatingSessions() {
  return useQuery({
    queryKey: ["participant_sessions"],
    queryFn: async () => {
      const { data } = await apiClient.get<ParticipatingTraining[]>("/api/participant/sessions");
      return data;
    },
  });
}

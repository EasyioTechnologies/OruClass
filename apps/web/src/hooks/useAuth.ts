"use client";

import { useAuthStore } from "@/store/auth";
import { apiClient } from "@/lib/api-client";
import { useCallback } from "react";

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();

  const signOut = useCallback(async () => {
    await apiClient.post("/api/auth/logout").catch(() => null);
    clearUser();
    window.location.href = "/login";
  }, [clearUser]);

  return { user, isAuthenticated: !!user, signOut };
}

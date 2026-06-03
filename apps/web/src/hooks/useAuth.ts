"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { apiClient } from "@/lib/api-client";
import { getAccessToken, getRefreshToken, clearTokens, isTokenExpired, setTokens } from "@/lib/token-storage";

export function useAuth() {
  const { user, isAuthenticated, isSessionExpired, emailVerified, setUser, setEmailVerified, clearUser, setSessionExpired } = useAuthStore();
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      if (isAuthenticated) setSessionExpired(true);
      setIsPending(false);
      return;
    }

    if (isTokenExpired(token)) {
      // Try refreshing
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearUser();
        clearTokens();
        setIsPending(false);
        return;
      }

      apiClient.post("/api/auth/refresh", { refreshToken })
        .then(({ data }) => {
          setTokens(data.accessToken, data.refreshToken);
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl ?? data.user.image,
            authProvider: data.user.isAnonymous ? "guest" : "email",
          } as any);
          setEmailVerified(data.user.emailVerified ?? false);
        })
        .catch(() => {
          clearUser();
          clearTokens();
        })
        .finally(() => setIsPending(false));
      return;
    }

    // Token exists and is valid — verify with server if no user in store
    if (!user) {
      apiClient.get("/api/auth/me")
        .then(({ data }) => {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl ?? data.user.image,
            authProvider: data.user.isAnonymous ? "guest" : "email",
          } as any);
          setEmailVerified(data.user.emailVerified ?? false);
        })
        .catch(() => {
          clearUser();
          clearTokens();
        })
        .finally(() => setIsPending(false));
    } else {
      setIsPending(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      await apiClient.post("/api/auth/logout", { refreshToken });
    } catch { /* ignore */ }
    clearUser();
    clearTokens();
    window.location.href = "/login";
  }, [clearUser]);

  return { user, isAuthenticated, isSessionExpired, emailVerified, signOut: handleSignOut, isPending };
}

"use client";

import React, { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  const { user: persistedUser, isAuthenticated: isPersistedAuth, setUser, clearUser, setSessionExpired, isSessionExpired } = useAuthStore();

  // Derive user synchronously from session when available,
  // fall back to Zustand persisted store (survives refreshes/navigation).
  // This eliminates the race where Zustand hasn't updated yet but session resolved.
  const sessionUser = React.useMemo(() => {
    return session?.user
      ? ({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          avatarUrl: session.user.image,
          authProvider: (session.user as any).isAnonymous ? "guest" : "email",
        } as any)
      : null;
  }, [session?.user]);

  // If we have a persisted user but are NOT authenticated locally, we should only expose the user if we specifically need to "continue as" 
  // However, for typical usage, if the session is expired, we might want `user` to remain accessible for the login UI, 
  // but `isAuthenticated` should be false.
  const user = sessionUser ?? persistedUser;
  
  // We are authenticated if the server session exists OR if we have a valid persisted auth state (before server check completes)
  const isAuthenticated = sessionUser !== null || isPersistedAuth;

  useEffect(() => {
    if (isPending) return;
    if (sessionUser) {
      // Sync to Zustand for persistence across navigations/refreshes
      // Only sync if they differ to avoid unnecessary updates
      if (persistedUser?.id !== sessionUser.id || !isPersistedAuth) {
        setUser(sessionUser, true);
      }
    } else if (persistedUser && !isSessionExpired) {
      // The session has expired on the server but we have a persisted user
      setSessionExpired(true);
    }
  }, [sessionUser, isPending, setUser, setSessionExpired, persistedUser?.id, isPersistedAuth, isSessionExpired]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    clearUser();
    window.location.href = "/login";
  }, [clearUser]);

  return { user, isAuthenticated, isSessionExpired, signOut: handleSignOut, isPending };
}

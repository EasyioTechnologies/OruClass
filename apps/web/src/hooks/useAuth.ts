"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  const { user: persistedUser, setUser, clearUser } = useAuthStore();

  // Derive user synchronously from session when available,
  // fall back to Zustand persisted store (survives refreshes/navigation).
  // This eliminates the race where Zustand hasn't updated yet but session resolved.
  const sessionUser = session?.user
    ? ({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatarUrl: session.user.image,
        authProvider: (session.user as any).isAnonymous ? "guest" : "email",
      } as any)
    : null;

  const user = sessionUser ?? persistedUser;

  useEffect(() => {
    if (isPending) return;
    if (sessionUser) {
      // Sync to Zustand for persistence across navigations/refreshes
      setUser(sessionUser);
    }
    // Never auto-clear. Only explicit signOut clears the store.
  }, [session, isPending, setUser]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    clearUser();
    window.location.href = "/login";
  }, [clearUser]);

  return { user, isAuthenticated: !!user, signOut: handleSignOut, isPending };
}

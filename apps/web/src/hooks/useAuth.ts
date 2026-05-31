"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  const { user, setUser, clearUser } = useAuthStore();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isPending) return;

    if (session?.user) {
      // Session confirmed — sync latest data to store
      hasSynced.current = true;
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        avatarUrl: session.user.image,
        authProvider: (session.user as any).isAnonymous ? "guest" : "email"
      } as any);
    }
    // IMPORTANT: We intentionally do NOT clear the user when session is null.
    // Session can transiently return null on page refocus, navigation,
    // network blips, or cookie race conditions. The persisted Zustand store
    // is the source of truth. User is only cleared on explicit signOut().
  }, [session, isPending, setUser]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    clearUser();
    window.location.href = "/login";
  }, [clearUser]);

  return { user, isAuthenticated: !!user, signOut: handleSignOut, isPending };
}

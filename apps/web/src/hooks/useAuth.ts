"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending, error } = authClient.useSession();
  const { user, setUser, clearUser } = useAuthStore();
  const hasResolved = useRef(false);

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        hasResolved.current = true;
        setUser({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          avatarUrl: session.user.image,
          authProvider: (session.user as any).isAnonymous ? "guest" : "google"
        } as any);
      } else if (session === null || error) {
        // Server explicitly returned no session or an error occurred
        hasResolved.current = true;
        clearUser();
      }
    }
  }, [session, isPending, error, setUser, clearUser]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    clearUser();
    window.location.href = "/login";
  }, [clearUser]);

  // isPending from better-auth is the source of truth, not Zustand
  return { user, isAuthenticated: !!user, signOut: handleSignOut, isPending };
}

"use client";

import { useSession, signOut as betterSignOut } from "@/lib/auth-client";
import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export function useAuth() {
  const { data: session, isPending } = useSession();
  const { user, setUser, clearUser } = useAuthStore();

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          avatarUrl: session.user.image,
          authProvider: (session.user as any).isAnonymous ? "guest" : "google"
        } as any);
      } else {
        clearUser();
      }
    }
  }, [session, isPending, setUser, clearUser]);

  const signOut = useCallback(async () => {
    await betterSignOut();
    clearUser();
    window.location.href = "/login";
  }, [clearUser]);

  return { user, isAuthenticated: !!user, signOut, isPending };
}

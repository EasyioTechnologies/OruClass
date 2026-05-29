"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
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

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    clearUser();
    window.location.href = "/login";
  }, [clearUser]);

  return { user, isAuthenticated: !!user, signOut: handleSignOut, isPending };
}

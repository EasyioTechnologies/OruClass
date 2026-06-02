"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isPending, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect when:
    // 1. Component is mounted (hydrated)
    // 2. Session check is complete (not pending)
    // 3. User is not authenticated (either no user or session expired)
    if (mounted && !isPending && !isAuthenticated) {
      const loginPath = pathname.startsWith("/participant") ? "/login/participant" : "/login/trainer";
      router.replace(`${loginPath}?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isPending, isAuthenticated, router, pathname]);

  // Show children immediately if we are authenticated (from Zustand localStorage or active session)
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Still loading or no user — show spinner (redirect will fire from effect above)
  if (!mounted || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No user, not pending — redirect is firing, show spinner while it happens
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

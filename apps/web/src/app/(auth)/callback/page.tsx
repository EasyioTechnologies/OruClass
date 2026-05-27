"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import type { PublicUser } from "@oruclass/types";

export default function CallbackPage() {
  const router = useRouter();
  const handled = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // better-auth already exchanged the code on the API side and set its own
    // session cookie — we just need to mint our JWT from that session.
    apiClient
      .post<{ user: PublicUser }>("/api/auth/token")
      .then(({ data }) => {
        setUser(data.user);
        router.replace("/dashboard");
      })
      .catch(() => {
        router.replace("/login?error=auth_failed");
      });
  }, [router, setUser]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Signing you in…</p>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import type { Training } from "@oruclass/types";

export default function JoinTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { user, isPending } = useAuth();
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  async function joinWithToken() {
    try {
      const { data } = await apiClient.post<{ training: Training }>(`/api/join/${unwrappedParams.token}`);
      router.replace(`/trainings/${data.training.id}/live?role=participant`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setNeedsAuth(true);
        return;
      }
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to join training",
      );
    }
  }

  useEffect(() => {
    if (handled.current || isPending) return;
    handled.current = true;
    if (!user) {
      setNeedsAuth(true);
      return;
    }
    joinWithToken();
  }, [user, isPending]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Unable to join</h2>
          <p className="text-gray-600">{error}</p>
          <a href="/join" className="text-brand-600 hover:underline text-sm">Try with a code instead</a>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">OruClass</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to join this session</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <GoogleSignInButton returnTo={`/join/${unwrappedParams.token}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Joining training session…</p>
      </div>
    </div>
  );
}

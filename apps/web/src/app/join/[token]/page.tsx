"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import type { Training, PublicUser } from "@oruclass/types";
import { Loader2, LogIn, User } from "lucide-react";

export default function JoinTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
    if (handled.current) return;
    handled.current = true;
    if (!user) {
      setNeedsAuth(true);
      return;
    }
    joinWithToken();
  }, []);

  async function handleMockLogin() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data } = await apiClient.post<{ user: PublicUser }>("/api/auth/mock-signin", { index: 1 });
      setUser(data.user);
      setNeedsAuth(false);
      await joinWithToken();
    } catch {
      setAuthError("Login failed. Try again.");
    } finally {
      setAuthLoading(false);
    }
  }

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
            <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Dev Participant</p>
                <p className="text-[11px] text-gray-400">dev.participant@oruclass.test</p>
              </div>
            </div>
            {authError && <p className="text-sm text-red-500">{authError}</p>}
            <button
              onClick={handleMockLogin}
              disabled={authLoading}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              {authLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Continue & Join
            </button>
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

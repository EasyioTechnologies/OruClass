"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import { Loader2, LogIn, User } from "lucide-react";
import type { PublicUser } from "@oruclass/types";

type Step = "auth" | "code";

export default function JoinPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState<Step>("auth");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // If already logged in skip to code entry
  useEffect(() => {
    if (user) setStep("code");
  }, [user]);

  async function handleMockLogin() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data } = await apiClient.post<{ user: PublicUser }>("/api/auth/mock-signin", { index: 1 });
      setUser(data.user);
      setStep("code");
    } catch {
      setAuthError("Login failed. Try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function updateDigit(index: number, value: string) {
    const d = [...digits];
    d[index] = value.replace(/\D/g, "").slice(-1);
    setDigits(d);
    setCodeError(null);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const d = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) d[i] = pasted[i];
    setDigits(d);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleJoin() {
    const code = digits.join("");
    if (code.length < 6) { setCodeError("Enter all 6 digits"); return; }
    setCodeLoading(true);
    setCodeError(null);
    try {
      const { data: { joinToken } } = await apiClient.post<{ joinToken: string }>("/api/join/code", { code });
      const { data: { training } } = await apiClient.post<{ training: { id: string } }>(`/api/join/${joinToken}`);
      router.replace(`/trainings/${training.id}/live?role=participant`);
    } catch (err: unknown) {
      setCodeError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "No live session found with that code",
      );
    } finally {
      setCodeLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">OruClass</h1>
          <p className="text-sm text-gray-500 mt-1">Join your live session</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          {step === "auth" ? (
            <>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Welcome</h2>
                <p className="text-sm text-gray-500 mt-0.5">Sign in to join a session</p>
              </div>

              {/* Mock user card */}
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
                Continue
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5">Signed in as {user?.name ?? "Participant"}</p>
                <h2 className="text-[15px] font-semibold text-gray-900">Enter session code</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Enter the 6-digit code shown on the screen
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    autoFocus={i === 0}
                    onChange={(e) => updateDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={[
                      "w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-colors bg-white",
                      codeError
                        ? "border-red-300 text-red-600 focus:border-red-400"
                        : d
                        ? "border-brand-400 text-brand-700"
                        : "border-gray-200 text-gray-900 focus:border-brand-400",
                    ].join(" ")}
                  />
                ))}
              </div>

              {codeError && <p className="text-sm text-red-500 text-center">{codeError}</p>}

              <button
                onClick={handleJoin}
                disabled={digits.some((d) => !d) || codeLoading}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                {codeLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                Join Session
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Loader2, LogIn } from "lucide-react";

export function ParticipantJoin() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string) {
    const d = [...digits];
    d[index] = value.replace(/\D/g, "").slice(-1);
    setDigits(d);
    setError(null);
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
    const nextEmpty = Math.min(pasted.length, 5);
    inputs.current[nextEmpty]?.focus();
  }

  async function handleSubmit() {
    const code = digits.join("");
    if (code.length < 6) {
      setError("Enter all 6 digits");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<{ joinToken: string }>("/api/join/code", { code });
      router.push(`/join/${data.joinToken}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No live session found with that code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const isFull = digits.every((d) => d !== "");

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
      <div>
        <h2 className="text-[15px] font-bold text-gray-900">Join a Live Session</h2>
        <p className="text-[12px] text-gray-500 mt-0.5">
          Enter the 6-digit code shown in your live room
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5 sm:gap-2 justify-center sm:justify-start">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => updateDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={[
                "w-10 sm:w-11 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 outline-none transition-colors bg-white",
                error
                  ? "border-red-300 text-red-600 focus:border-red-400"
                  : d
                  ? "border-brand-400 text-brand-700"
                  : "border-gray-200 text-gray-900 focus:border-brand-400",
              ].join(" ")}
            />
          ))}
        </div>

        {error && <p className="text-[12px] text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!isFull || loading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-600 text-white text-[13px] font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <LogIn size={15} />
          )}
          Join Session
        </button>
      </div>
    </div>
  );
}

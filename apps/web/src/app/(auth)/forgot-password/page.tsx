"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-[400px] mx-auto p-6 sm:p-10 space-y-6 my-4 sm:my-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Mail className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            We sent a password reset link to <strong className="text-gray-700">{email}</strong>.
            Click the link in the email to set a new password.
          </p>
          <p className="text-xs text-gray-400">
            Didn't receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-brand-600 font-medium hover:text-brand-700"
            >
              try again
            </button>
          </p>
        </div>
        <div className="pt-4 border-t border-gray-100 text-center">
          <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 font-medium">
            <ArrowLeft className="inline w-4 h-4 mr-1" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] mx-auto p-6 sm:p-10 space-y-6 my-4 sm:my-8">
      <div className="text-center space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Forgot password?</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-5 py-4 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-gray-200 transition-all"
          required
        />

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl text-base font-semibold hover:bg-brand-700 transition-all disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="pt-4 border-t border-gray-100 text-center">
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 font-medium">
          <ArrowLeft className="inline w-4 h-4 mr-1" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { ArrowLeft, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[400px] mx-auto p-10 text-center text-gray-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  const allValid = Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!allValid) {
      setError("Password doesn't meet requirements.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (error) {
        if (error.message?.includes("expired") || error.message?.includes("invalid")) {
          setError("This reset link has expired. Please request a new one.");
        } else {
          setError(error.message || "Failed to reset password.");
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-[400px] mx-auto p-6 sm:p-10 space-y-6 my-4 sm:my-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Password reset</h1>
          <p className="text-sm text-gray-500">Your password has been successfully reset. You can now sign in with your new password.</p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl text-base font-semibold hover:bg-brand-700 transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] mx-auto p-6 sm:p-10 space-y-6 my-4 sm:my-8">
      <div className="text-center space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Set new password</h1>
        <p className="text-xs sm:text-sm text-gray-500">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 pr-12 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-gray-200 transition-all"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-5 py-4 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-gray-200 transition-all"
          required
          minLength={8}
        />

        {password && (
          <div className="grid grid-cols-2 gap-2 px-1">
            {([
              ["length", "8+ characters"],
              ["uppercase", "Uppercase"],
              ["lowercase", "Lowercase"],
              ["number", "Number"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                {passwordChecks[key] ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-gray-300" />
                )}
                <span className={`text-xs ${passwordChecks[key] ? "text-emerald-600" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl text-base font-semibold hover:bg-brand-700 transition-all disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
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

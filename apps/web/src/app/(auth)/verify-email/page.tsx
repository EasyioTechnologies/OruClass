"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { CheckCircle2, Mail, RefreshCw } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const isVerified = session?.user?.emailVerified;
  const email = session?.user?.email || searchParams.get("email");

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError("");
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });
      if (error) {
        setError(error.message || "Failed to resend.");
      } else {
        setResent(true);
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="w-full max-w-[400px] mx-auto p-6 sm:p-10 space-y-6 my-4 sm:my-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Email verified!</h1>
          <p className="text-sm text-gray-500">Your email has been successfully verified. You're all set.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl text-base font-semibold hover:bg-brand-700 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] mx-auto p-6 sm:p-10 space-y-6 my-4 sm:my-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
          <Mail className="w-7 h-7 text-brand-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Verify your email</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          We sent a verification link to{" "}
          {email ? <strong className="text-gray-700">{email}</strong> : "your email"}.
          Click the link to activate your account.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-xs text-gray-500 text-center">Didn't receive the email?</p>
        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {resending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : resent ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Email sent!
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Resend verification email
            </>
          )}
        </button>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Check your spam folder. The link expires in 24 hours.
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

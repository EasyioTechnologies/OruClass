"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import { setTokens } from "@/lib/token-storage";
import { CheckCircle2, Mail, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";
  const { setEmailVerified, setUser } = useAuthStore();

  const [verifying, setVerifying] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiClient.post("/api/auth/verify-email", { token })
      .then(({ data }) => {
        if (data.accessToken && data.refreshToken) {
          setTokens(data.accessToken, data.refreshToken);
        }
        if (data.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl ?? data.user.image,
            authProvider: data.user.isAnonymous ? "guest" : "email",
          } as any);
        }
        setVerified(true);
        setEmailVerified(true);
      })
      .catch((err) => setError(err.response?.data?.error || "Verification failed. The link may have expired."))
      .finally(() => setVerifying(false));
  }, [token, setEmailVerified]);

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await apiClient.post("/api/auth/resend-verification", { returnTo });
      setResent(true);
    } catch {
      setError("Failed to resend. Please try logging in again.");
    } finally {
      setResending(false);
    }
  };

  if (verifying) {
    return (
      <div className="w-full max-w-[400px] mx-auto p-6 sm:p-10 space-y-6 my-4 sm:my-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
        <p className="text-sm text-gray-500">Verifying your email...</p>
      </div>
    );
  }

  if (verified) {
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
          onClick={() => router.push(returnTo)}
          className="w-full py-4 bg-brand-600 text-white rounded-2xl text-base font-semibold hover:bg-brand-700 transition-all"
        >
          Continue
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

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

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
        
        <div className="pt-2 border-t border-gray-200 mt-2">
           <Link 
             href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
             className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
           >
             Go to Login
           </Link>
        </div>
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

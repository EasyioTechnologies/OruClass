"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GithubSignInButton } from "./GithubSignInButton";
import { EmailAuthForm } from "./EmailAuthForm";

export function AuthPanel({
  title,
  subtitle,
  returnTo,
}: {
  title: string;
  subtitle: string;
  returnTo: string;
}) {
  const [emailMode, setEmailMode] = useState<"login" | "signup" | null>(null);

  return (
    <div className="w-full max-w-[400px] mx-auto bg-white/80 backdrop-blur-xl border border-white shadow-2xl shadow-emerald-900/5 rounded-3xl p-8 sm:p-10 space-y-7 my-8 relative z-10">
      <div className="text-center space-y-2 mb-2">
        <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      {emailMode ? (
        <EmailAuthForm
          returnTo={returnTo}
          initialMode={emailMode}
          onBack={() => setEmailMode(null)}
        />
      ) : (
        <>
          <div className="space-y-3.5">
            <GoogleSignInButton returnTo={returnTo} />
            <GithubSignInButton returnTo={returnTo} />
            <button
              type="button"
              onClick={() => setEmailMode("login")}
              className="group w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <Mail className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" strokeWidth={2} />
              Continue with Email
            </button>
          </div>

          <p className="text-sm text-center text-gray-500 pt-3">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setEmailMode("signup")}
              className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-colors"
            >
              Sign up
            </button>
          </p>
        </>
      )}

      <div className="pt-4 mt-4 border-t border-gray-100/60 text-center">
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
          ← Choose a different role
        </Link>
      </div>
    </div>
  );
}

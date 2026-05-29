"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6 my-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
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
          {/* Line 1 — Google */}
          <GoogleSignInButton returnTo={returnTo} />

          {/* Line 2 — GitHub + Email */}
          <div className="grid grid-cols-2 gap-3">
            <GithubSignInButton returnTo={returnTo} compact />
            <button
              type="button"
              onClick={() => setEmailMode("login")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              Email
            </button>
          </div>

          <p className="text-sm text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setEmailMode("signup")}
              className="text-brand-600 font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </>
      )}

      <div className="pt-2 text-center">
        <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
          ← Choose a different role
        </Link>
      </div>
    </div>
  );
}

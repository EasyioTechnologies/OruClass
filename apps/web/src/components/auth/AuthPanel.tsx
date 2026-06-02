"use client";

import Link from "next/link";
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
  return (
    <div className="w-full max-w-[400px] mx-auto p-6 sm:p-10 space-y-6 sm:space-y-7 my-4 sm:my-8 relative z-10">
      <div className="text-center space-y-1.5 sm:space-y-2 mb-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">{title}</h1>
        <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
      </div>

      <EmailAuthForm returnTo={returnTo} />

      <div className="pt-4 mt-4 border-t border-gray-100/60 text-center">
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
          ← Choose a different role
        </Link>
      </div>
    </div>
  );
}

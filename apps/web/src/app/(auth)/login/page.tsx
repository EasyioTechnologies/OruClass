import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign In | oruClassrooms" };

const ROLES = [
  {
    href: "/login/trainer",
    title: "I'm a Trainer",
    desc: "Create, host, and run live training sessions for your participants.",
    accent: "border-brand-200 hover:border-brand-500",
    icon: (
      <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 5h18v11H3z" />
        <path d="M8 21h8M12 16v5" />
      </svg>
    ),
  },
  {
    href: "/login/participant",
    title: "I'm a Participant",
    desc: "Join a training with an invite link or 6-digit code and start learning.",
    accent: "border-gray-200 hover:border-gray-400",
    icon: (
      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
] as const;

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-6 my-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to oruClassrooms</h1>
        <p className="text-sm text-gray-500">How would you like to continue?</p>
      </div>

      <div className="space-y-4">
        {ROLES.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className={`flex items-center gap-4 bg-white rounded-2xl shadow-sm border-2 ${r.accent} p-5 transition-colors`}
          >
            <span className="shrink-0 grid place-items-center w-12 h-12 rounded-xl bg-gray-50">
              {r.icon}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-gray-900">{r.title}</span>
              <span className="block text-sm text-gray-500">{r.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

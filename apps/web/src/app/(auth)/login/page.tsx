import type { Metadata } from "next";
import Link from "next/link";
import { Presentation, GraduationCap, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Sign In | OruClassrooms" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white/80 backdrop-blur-xl border border-white shadow-2xl shadow-emerald-900/5 rounded-3xl p-8 sm:p-12 relative z-10">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Welcome to <span className="text-emerald-600">OruClassrooms</span>
        </h1>
        <p className="text-base text-gray-500">How would you like to continue?</p>
      </div>

      <div className="space-y-4">
        <Link
          href="/login/trainer"
          className="group relative flex items-start gap-4 p-5 sm:p-6 bg-white rounded-2xl border-2 border-emerald-50 hover:border-emerald-500 hover:shadow-lg transition-all duration-300"
        >
          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100/50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <Presentation size={24} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">I'm a Trainer</h2>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2 pr-6">Create, host, and run live training sessions for your participants.</p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <ChevronRight className="text-emerald-500" size={20} />
          </div>
        </Link>

        <Link
          href="/login/participant"
          className="group relative flex items-start gap-4 p-5 sm:p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-400 hover:shadow-lg transition-all duration-300"
        >
          <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-600 group-hover:text-white transition-colors duration-300">
            <GraduationCap size={24} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-slate-800 transition-colors">I'm a Participant</h2>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2 pr-6">Join a training with an invite link or 6-digit code and start learning.</p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <ChevronRight className="text-slate-500" size={20} />
          </div>
        </Link>
      </div>
    </div>
  );
}

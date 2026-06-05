"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, emailVerified, user, isPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && isAuthenticated && (emailVerified || user?.authProvider === "guest")) {
      let dest = "/participant";
      try { dest = localStorage.getItem("oru_return") ?? dest; } catch {}
      router.replace(dest);
    }
  }, [isPending, isAuthenticated, emailVerified, user, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50/50">
      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 z-20 group">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 hover:bg-white border border-transparent hover:border-gray-200 transition-all shadow-sm backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-sm font-bold tracking-tight text-gray-700 group-hover:text-brand-700">
            Home
          </span>
        </div>
      </Link>
      
      {/* Floating Brand Gradient Background */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-brand-300/20 blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-brand-200/30 blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="relative z-10 p-4 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}

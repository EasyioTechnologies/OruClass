"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors z-20 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:shadow-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
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

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isPending, isAuthenticated, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50/50">
      {/* Floating Brand Gradient Background */}
      <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-brand-300/20 blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-brand-200/30 blur-[100px] pointer-events-none mix-blend-multiply" />

      <div className="relative z-10 p-4 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}

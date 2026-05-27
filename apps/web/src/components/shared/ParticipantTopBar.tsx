"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function ParticipantTopBar() {
  const { user, signOut } = useAuth();

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
      <span className="text-[14px] font-bold text-brand-600 tracking-tight">OruClass</span>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-gray-500 hidden sm:block">{user.name}</span>
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-[11px] font-bold text-brand-600">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </header>
  );
}

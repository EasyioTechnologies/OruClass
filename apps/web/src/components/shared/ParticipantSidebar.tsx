"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LogOut,
  PlayCircle,
  History
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLayoutStore } from "@/store/layout";
import { cn } from "@oruclass/utils";

const participantNavItems = [
  { href: "/participant", label: "Current Session", icon: PlayCircle, exact: true },
  { href: "/participant/previous", label: "Previous Sessions", icon: History, exact: false },
];

export function ParticipantSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const { isMobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "bg-[#fafafa] border-r border-gray-150 flex flex-col h-screen flex-shrink-0 transition-transform duration-300 md:w-[232px] md:relative md:translate-x-0 w-[280px] fixed z-50 left-0 top-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >

        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-brand-500 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={16} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-[14px] font-700 text-gray-900 tracking-[-0.01em]">
              OruLabs
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10.5px] font-600 text-gray-400 uppercase tracking-[0.08em] mb-2 px-2">
            Menu
          </p>
          {participantNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-[13.5px] font-500 transition-all duration-150",
                  active
                    ? "bg-white shadow-sm border border-gray-200 text-gray-900"
                    : "text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm hover:border hover:border-gray-200 border border-transparent",
                )}
              >
                <Icon
                  size={16}
                  className={active ? "text-brand-500" : "text-gray-400"}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div className="border-t border-gray-100 px-3 py-3">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 border border-transparent transition-all duration-150 group cursor-default">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[11px] font-700 text-brand-600 flex-shrink-0">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-600 text-gray-800 truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                  {user.email}
                </p>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 flex-shrink-0"
              >
                <LogOut size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

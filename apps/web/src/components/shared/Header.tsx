"use client";

import { useWorkspaceStore } from "@/store/workspace";
import { useLayoutStore } from "@/store/layout";
import { useSubscriptionStore } from "@/store/subscription";
import { useAuth } from "@/hooks/useAuth";
import { Menu, User, LogOut, Crown, CreditCard, Sparkles } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { getPlan } from "@/config/plans";
import { cn } from "@oruclass/utils";

export function Header() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = workspaces.find((w) => w.id === activeId);

  const { user, signOut } = useAuth();
  const toggleMobileSidebar = useLayoutStore((s) => s.toggleMobileSidebar);

  const { planId, status } = useSubscriptionStore();
  const isPro = status === "active";
  const currentPlan = planId ? getPlan(planId) : null;

  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
      <div className="flex items-center">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden mr-3 p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-semibold text-gray-800">
          {active?.name ?? "OruLabs"}
        </h1>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          {/* PRO Badge — visible at all times in header */}
          {isPro && (
            <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <Crown size={12} className="text-amber-500" strokeWidth={2.5} />
              <span className="text-[11px] font-700 text-amber-700 tracking-wide">PRO</span>
            </div>
          )}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  "outline-none flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0",
                  isPro
                    ? "bg-gradient-to-br from-amber-100 to-orange-100 ring-2 ring-amber-300/50 hover:ring-amber-400/70"
                    : "bg-brand-100 hover:ring-2 hover:ring-brand-500/20"
                )}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      "text-[12px] font-bold select-none",
                      isPro ? "text-amber-700" : "text-brand-600"
                    )}
                  >
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              >
                {/* User info + plan badge */}
                <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.name}
                    </p>
                    {isPro && currentPlan && (
                      <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-700 px-2 py-0.5 rounded-full shadow-sm">
                        <Sparkles size={9} />
                        {currentPlan.name.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {user.email}
                  </p>
                  {!isPro && (
                    <Link
                      href="/subscription"
                      className="mt-2 flex items-center gap-1.5 text-[11.5px] font-600 text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <Crown size={12} />
                      Upgrade to Pro
                    </Link>
                  )}
                </div>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors"
                  >
                    <User size={15} className="text-gray-400" />
                    My Profile
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href={isPro ? "/subscription/billing" : "/subscription"}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors"
                  >
                    <CreditCard size={15} className="text-gray-400" />
                    {isPro ? "Manage Plan" : "View Plans"}
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-[1px] bg-gray-100 my-1" />

                <DropdownMenu.Item
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
    </header>
  );
}

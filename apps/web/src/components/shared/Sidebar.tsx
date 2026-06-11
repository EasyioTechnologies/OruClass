"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  GraduationCap,
  Users,
  CalendarDays,
  Database,
  CreditCard,
  Crown,
  Sparkles,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { useLayoutStore } from "@/store/layout";
import { useSubscriptionStore } from "@/store/subscription";
import { cn } from "@oruclass/utils";
import { getPlan } from "@/config/plans";

const trainerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, exact: false },
  { href: "/data", label: "Data", icon: Database, exact: false },
  { href: "/trainings/new", label: "New Training", icon: PlusCircle, exact: false },
  { href: "/shared", label: "Shared with Me", icon: Users, exact: false },
];

const participantNavItems = [
  { href: "/participant", label: "My Sessions", icon: Users, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: workspaces } = useWorkspaces();
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();
  const { planId, status } = useSubscriptionStore();
  const isPro = status === "active";
  const currentPlan = planId ? getPlan(planId) : null;

  useEffect(() => {
    if (workspaces?.length && !activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspace]);

  const isParticipant = pathname.startsWith("/participant");
  const navItems = isParticipant ? participantNavItems : trainerNavItems;
  const hasWorkspace = !!(workspaces && workspaces.length > 0);

  return (
    <>
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "bg-white border-r border-gray-100 flex flex-col h-screen flex-shrink-0 transition-transform duration-300 md:w-[220px] md:relative md:translate-x-0 w-[260px] fixed z-50 left-0 top-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo — same height as header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={16} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-[15px] font-semibold text-gray-900 tracking-tight">OruLabs</span>
            {isPro && currentPlan && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">
                Pro
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {(hasWorkspace || isParticipant) && navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors duration-150",
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon
                  size={17}
                  className={active ? "text-brand-600" : "text-gray-400"}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}

          {hasWorkspace && !isParticipant && (
            <Link
              href={isPro ? "/subscription/billing" : "/subscription"}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors duration-150",
                pathname.startsWith("/subscription")
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isPro ? (
                <Crown
                  size={17}
                  className={pathname.startsWith("/subscription") ? "text-amber-500" : "text-amber-400"}
                  strokeWidth={pathname.startsWith("/subscription") ? 2.5 : 2}
                />
              ) : (
                <CreditCard
                  size={17}
                  className={pathname.startsWith("/subscription") ? "text-brand-600" : "text-gray-400"}
                  strokeWidth={pathname.startsWith("/subscription") ? 2.5 : 2}
                />
              )}
              {isPro ? "My Plan" : "Plans"}
            </Link>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          {!isPro && hasWorkspace && !isParticipant && (
            <Link
              href="/subscription"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium"
            >
              <Sparkles size={15} />
              Upgrade to Pro
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

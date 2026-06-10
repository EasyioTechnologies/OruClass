"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Check,
  GraduationCap,
  Users,
  CalendarDays,
  Trash2,
  Database,
  User,
  CreditCard,
  Crown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { useLayoutStore } from "@/store/layout";
import { useSubscriptionStore } from "@/store/subscription";
import { cn } from "@oruclass/utils";
import { getPlan } from "@/config/plans";

const trainerNavItems = [
  { href: "/dashboard", label: "Training Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/data", label: "Data", icon: Database },
  { href: "/trainings/new", label: "New Training", icon: PlusCircle },
  { href: "/shared", label: "Shared with me", icon: Users },
];

const participantNavItems = [
  { href: "/participant", label: "Participant Area", icon: Users },
];

function WorkspaceInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-brand-100 text-brand-600 text-[11px] font-bold flex-shrink-0 select-none">
      {initials}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: workspaces } = useWorkspaces();
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const { user, signOut } = useAuth();

  const { isMobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();
  const { planId, status } = useSubscriptionStore();
  const isPro = status === "active";
  const currentPlan = planId ? getPlan(planId) : null;

  useEffect(() => {
    if (workspaces?.length && !activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspace]);

  function handleSelectWorkspace(id: string) {
    setActiveWorkspace(id);
    router.push("/dashboard");
    setMobileSidebarOpen(false);
  }

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
            <div className={cn(
              "w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0",
              isPro
                ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_2px_8px_rgba(245,158,11,0.3)]"
                : "bg-brand-500"
            )}>
              {isPro ? (
                <Crown size={15} className="text-white" strokeWidth={2.5} />
              ) : (
                <GraduationCap size={16} className="text-white" strokeWidth={2} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-700 text-gray-900 tracking-[-0.01em] leading-tight">
                OruLabs
              </span>
              {isPro && currentPlan && (
                <span className="text-[9.5px] font-700 text-amber-600 uppercase tracking-[0.1em] leading-tight">
                  {currentPlan.name} Plan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10.5px] font-600 text-gray-400 uppercase tracking-[0.08em] mb-2 px-2">
            Menu
          </p>
          {pathname.startsWith("/participant") &&
            participantNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
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

          {workspaces && workspaces.length > 0 && !pathname.startsWith("/participant") && trainerNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
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

          {/* Subscription link — changes based on status */}
          {workspaces && workspaces.length > 0 && !pathname.startsWith("/participant") && (
            <Link
              href={isPro ? "/subscription/billing" : "/subscription"}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-[13.5px] font-500 transition-all duration-150",
                pathname.startsWith("/subscription")
                  ? "bg-white shadow-sm border border-gray-200 text-gray-900"
                  : "text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm hover:border hover:border-gray-200 border border-transparent",
              )}
            >
              {isPro ? (
                <Crown
                  size={16}
                  className={pathname.startsWith("/subscription") ? "text-amber-500" : "text-amber-400"}
                  strokeWidth={pathname.startsWith("/subscription") ? 2.5 : 2}
                />
              ) : (
                <CreditCard
                  size={16}
                  className={pathname.startsWith("/subscription") ? "text-brand-500" : "text-gray-400"}
                  strokeWidth={pathname.startsWith("/subscription") ? 2.5 : 2}
                />
              )}
              {isPro ? "My Plan" : "Subscription"}
            </Link>
          )}
        </nav>

        {/* Bottom CTA — different for free vs pro */}
        <div className="px-3 pb-4">
          {isPro ? (
            /* Pro user: subtle plan badge */
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Crown size={13} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11.5px] font-700 text-amber-800 leading-tight">
                    {currentPlan?.name} Plan
                  </p>
                  <p className="text-[10px] text-amber-600/70 font-500">Active subscription</p>
                </div>
              </div>
            </div>
          ) : (
            /* Free user: eye-catching upgrade CTA */
            <Link
              href="/subscription"
              className="block bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl px-3.5 py-3 group hover:shadow-md hover:shadow-brand-500/20 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-700 text-white leading-tight">
                    Upgrade to Pro
                  </p>
                  <p className="text-[10.5px] text-white/70 font-400">
                    Unlock all features
                  </p>
                </div>
                <ArrowRight size={14} className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

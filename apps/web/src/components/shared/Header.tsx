"use client";

import { useWorkspaceStore } from "@/store/workspace";
import { useLayoutStore } from "@/store/layout";
import { useAuth } from "@/hooks/useAuth";
import { Menu, User, LogOut } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";

export function Header() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = workspaces.find((w) => w.id === activeId);

  const { user, signOut } = useAuth();
  const toggleMobileSidebar = useLayoutStore((s) => s.toggleMobileSidebar);

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
          {active?.name ?? "OruClassrooms"}
        </h1>
      </div>

      {user && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="outline-none flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 hover:ring-2 hover:ring-brand-500/20 transition-all flex-shrink-0">
              {user.avatarUrl || user.image ? (
                <img
                  src={user.avatarUrl || user.image!}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-[12px] font-bold text-brand-600 select-none">
                  {user.name?.[0]?.toUpperCase()}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
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
      )}
    </header>
  );
}

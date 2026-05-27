"use client";

import { useWorkspaceStore } from "@/store/workspace";
import { useLayoutStore } from "@/store/layout";
import { Menu } from "lucide-react";

export function Header() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = workspaces.find((w) => w.id === activeId);

  const toggleMobileSidebar = useLayoutStore((s) => s.toggleMobileSidebar);

  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center px-4 md:px-6 flex-shrink-0 z-10">
      <button 
        onClick={toggleMobileSidebar}
        className="md:hidden mr-3 p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Menu size={20} />
      </button>
      <h1 className="text-sm font-semibold text-gray-800">
        {active?.name ?? "oruClassrooms"}
      </h1>
    </header>
  );
}

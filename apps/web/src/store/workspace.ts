import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace, WorkspaceRole } from "@oruclass/types";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  userRoles: Record<string, WorkspaceRole>;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  setActiveWorkspace: (id: string) => void;
  setUserRole: (workspaceId: string, role: WorkspaceRole) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspaceId: null,
      userRoles: {},
      setWorkspaces: (workspaces) =>
        set((s) => {
          if (!s.activeWorkspaceId && workspaces.length > 0) {
            return { workspaces, activeWorkspaceId: workspaces[0].id };
          }
          return { workspaces };
        }),
      addWorkspace: (workspace) =>
        set((s) => {
          const newWorkspaces = [...s.workspaces, workspace];
          return {
            workspaces: newWorkspaces,
            activeWorkspaceId: s.activeWorkspaceId || workspace.id,
          };
        }),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setUserRole: (workspaceId, role) =>
        set((s) => ({ userRoles: { ...s.userRoles, [workspaceId]: role } })),
    }),
    { name: "oruclass-workspace" },
  ),
);

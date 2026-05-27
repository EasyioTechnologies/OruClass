import type { TrainingRole } from "@oruclass/types";

export type Permission =
  | "unlock_modules"
  | "edit_agenda"
  | "pause_room"
  | "export_data"
  | "assign_roles"
  | "view_assigned_modules"
  | "view_data"
  | "invite_participants";

export const ROLE_PERMISSIONS: Record<TrainingRole, Permission[]> = {
  lead_trainer: [
    "unlock_modules",
    "edit_agenda",
    "pause_room",
    "export_data",
    "assign_roles",
    "view_data",
    "invite_participants",
  ],
  full_editor: ["unlock_modules", "pause_room", "edit_agenda", "view_data", "invite_participants"],
  partial_editor: ["view_assigned_modules", "view_data"],
  facilitation_support: ["unlock_modules", "pause_room", "view_data"],
};

export function hasPermission(role: TrainingRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: TrainingRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

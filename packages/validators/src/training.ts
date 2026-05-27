import { z } from "zod";

export const TrainingCategorySchema = z.enum(["atl", "maker_space", "ict_cal"]);
export const ModuleTypeSchema = z.enum(["quiz", "whiteboard", "reflection", "matrix", "custom", "attendance"]);
export const TrainingRoleSchema = z.enum([
  "lead_trainer",
  "full_editor",
  "partial_editor",
  "facilitation_support",
]);

export const CreateTrainingSchema = z.object({
  title: z.string().min(3).max(200),
  category: TrainingCategorySchema,
  description: z.string().max(1000).optional(),
  scheduledAt: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
});

export const UpdateTrainingSchema = CreateTrainingSchema.partial();

export const CreateDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().min(1).max(200),
  date: z.preprocess((v) => (v === "" ? undefined : v), z.string().datetime({ offset: true }).optional()),
  description: z.string().max(1000).optional(),
});

export const UpdateDaySchema = CreateDaySchema.partial();

export const ReorderDaysSchema = z.object({
  order: z.array(z.object({ id: z.string().uuid(), dayNumber: z.number().int().min(1) })),
});

export const CreateModuleSchema = z.object({
  title: z.string().min(1).max(200),
  moduleType: ModuleTypeSchema,
  position: z.number().int().min(0),
  dayId: z.string().uuid().nullable().optional(),
  isAlwaysOn: z.boolean().default(false),
  config: z.record(z.unknown()).default({}),
});

export const UpdateModuleSchema = CreateModuleSchema.partial();

export const UnlockModuleSchema = z.object({
  moduleId: z.string().uuid(),
});

export const AssignFacilitatorSchema = z.object({
  userId: z.string(),
  role: TrainingRoleSchema,
  assignedModules: z.array(z.string().uuid()).default([]),
});

export type CreateTrainingInput = z.infer<typeof CreateTrainingSchema>;
export type UpdateTrainingInput = z.infer<typeof UpdateTrainingSchema>;
export type CreateDayInput = z.infer<typeof CreateDaySchema>;
export type UpdateDayInput = z.infer<typeof UpdateDaySchema>;
export type ReorderDaysInput = z.infer<typeof ReorderDaysSchema>;
export type CreateModuleInput = z.infer<typeof CreateModuleSchema>;
export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>;
export type UnlockModuleInput = z.infer<typeof UnlockModuleSchema>;
export type AssignFacilitatorInput = z.infer<typeof AssignFacilitatorSchema>;

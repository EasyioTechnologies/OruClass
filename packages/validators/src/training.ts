import { z } from "zod";

export const TrainingCategorySchema = z.enum(["atl", "maker_space", "ict_cal"]);
export const ModuleTypeSchema = z.enum(["quiz", "whiteboard", "reflection", "matrix", "custom", "attendance", "poll", "wordcloud", "qna", "timer", "pulse", "mapping", "form", "embed"]);
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

export const ReorderModulesSchema = z.object({
  order: z
    .array(z.object({ id: z.string().uuid(), position: z.number().int().min(0) }))
    .min(1)
    .max(500),
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

// Whiteboard stroke payload — caps point count and numeric range so a
// misbehaving client can't pump arbitrarily large payloads to the room.
export const StrokeSchema = z.object({
  id: z.string().max(64),
  color: z.string().max(32),
  width: z.number().finite().min(0).max(64),
  points: z
    .array(z.object({ x: z.number().finite().min(-10_000).max(10_000), y: z.number().finite().min(-10_000).max(10_000) }))
    .min(1)
    .max(2_000),
});

export const DrawUpdateSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  stroke: StrokeSchema,
});

export const ScratchpadUpdateSchema = z
  .object({
    personalNotes: z.string().max(50_000).optional(),
    personalWhiteboard: z.record(z.unknown()).optional(),
  })
  .refine((v) => v.personalNotes !== undefined || v.personalWhiteboard !== undefined, {
    message: "At least one of personalNotes or personalWhiteboard is required",
  });

export const JoinCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export const FacilitatorInviteSchema = z.object({
  email: z.string().email(),
  role: TrainingRoleSchema,
});

export const SessionStatusSchema = z.object({
  status: z.enum(["draft", "connecting", "live", "paused", "completed"]),
});

export const AssignModuleToDaySchema = z.object({
  moduleId: z.string().uuid(),
});

export const DuplicateModuleSchema = z.object({
  targetTrainingId: z.string().uuid().optional(),
  targetDayId: z.string().uuid().nullable().optional(),
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
export type ReorderModulesInput = z.infer<typeof ReorderModulesSchema>;
export type CreateModuleInput = z.infer<typeof CreateModuleSchema>;
export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>;
export type UnlockModuleInput = z.infer<typeof UnlockModuleSchema>;
export type AssignFacilitatorInput = z.infer<typeof AssignFacilitatorSchema>;
export type ScratchpadUpdateInput = z.infer<typeof ScratchpadUpdateSchema>;
export type JoinCodeInput = z.infer<typeof JoinCodeSchema>;
export type FacilitatorInviteInput = z.infer<typeof FacilitatorInviteSchema>;
export type SessionStatusInput = z.infer<typeof SessionStatusSchema>;
export type AssignModuleToDayInput = z.infer<typeof AssignModuleToDaySchema>;
export type DuplicateModuleInput = z.infer<typeof DuplicateModuleSchema>;
export type StrokeInput = z.infer<typeof StrokeSchema>;
export type DrawUpdateInput = z.infer<typeof DrawUpdateSchema>;

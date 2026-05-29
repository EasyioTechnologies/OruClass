import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
  unique,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  image: text("image"),
  emailVerified: boolean("email_verified").notNull().default(false),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workspaces ───────────────────────────────────────────────────────────────
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── WorkspaceMembers ─────────────────────────────────────────────────────────
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<"owner" | "member">().notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
);

// ─── Trainings ────────────────────────────────────────────────────────────────
export const trainings = pgTable(
  "trainings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").$type<"atl" | "maker_space" | "ict_cal">().notNull(),
    description: text("description"),
    scheduledAt: timestamp("scheduled_at"),
    currentActiveModuleId: uuid("current_active_module_id"),
    sessionStatus: text("session_status")
      .$type<"draft" | "connecting" | "live" | "paused" | "completed">()
      .notNull()
      .default("draft"),
    joinToken: text("join_token").notNull().unique(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("trainings_workspace_idx").on(t.workspaceId)],
);

// ─── TrainingDays ─────────────────────────────────────────────────────────────
export const trainingDays = pgTable(
  "training_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    title: text("title").notNull(),
    date: timestamp("date"),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("days_training_idx").on(t.trainingId),
    unique("days_training_number_unique").on(t.trainingId, t.dayNumber),
  ],
);

// ─── TrainingModules ──────────────────────────────────────────────────────────
export const trainingModules = pgTable(
  "training_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    dayId: uuid("day_id").references(() => trainingDays.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    moduleType: text("module_type")
      .$type<"quiz" | "whiteboard" | "reflection" | "matrix" | "custom" | "attendance">()
      .notNull(),
    position: integer("position").notNull().default(0),
    isUnlocked: boolean("is_unlocked").notNull().default(false),
    isAlwaysOn: boolean("is_always_on").notNull().default(false),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("modules_training_idx").on(t.trainingId)],
);

// ─── TrainingFacilitators ─────────────────────────────────────────────────────
export const trainingFacilitators = pgTable(
  "training_facilitators",
  {
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role")
      .$type<"lead_trainer" | "full_editor" | "partial_editor" | "facilitation_support">()
      .notNull(),
    assignedModules: text("assigned_modules").array().notNull().default([]),
  },
  (t) => [primaryKey({ columns: [t.trainingId, t.userId] })],
);

// ─── TrainingParticipants ─────────────────────────────────────────────────────
export const trainingParticipants = pgTable(
  "training_participants",
  {
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    connectionStatus: text("connection_status")
      .$type<"online" | "offline">()
      .notNull()
      .default("online"),
    lastHeartbeat: timestamp("last_heartbeat"),
    personalNotes: text("personal_notes").notNull().default(""),
    personalWhiteboard: jsonb("personal_whiteboard").$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [
    primaryKey({ columns: [t.trainingId, t.userId] }),
    index("participants_training_idx").on(t.trainingId),
  ],
);

// ─── LiveSessions ─────────────────────────────────────────────────────────────
export const liveSessions = pgTable(
  "live_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
    status: text("status").$type<"active" | "completed">().notNull().default("active"),
    targetResponses: integer("target_responses"),
    createdBy: uuid("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("live_sessions_training_idx").on(t.trainingId)],
);

// ─── ParticipantResponses ─────────────────────────────────────────────────────
export const participantResponses = pgTable(
  "participant_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    responseData: jsonb("response_data").$type<Record<string, unknown>>().notNull(),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    liveSessionId: uuid("live_session_id").references(() => liveSessions.id, { onDelete: "set null" }),
  },
  (t) => [
    index("responses_training_module_idx").on(t.trainingId, t.moduleId),
    uniqueIndex("responses_user_unique_idx").on(t.trainingId, t.moduleId, t.userId),
    index("responses_session_module_idx").on(t.liveSessionId, t.moduleId),
  ],
);

// ─── TrainingAnalytics ────────────────────────────────────────────────────────
export const trainingAnalytics = pgTable("training_analytics", {
  trainingId: uuid("training_id")
    .primaryKey()
    .references(() => trainings.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  aggregateData: jsonb("aggregate_data").$type<Record<string, unknown>>().notNull().default({}),
  exportUrl: text("export_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  workspaceMembers: many(workspaceMembers),
  ownedWorkspaces: many(workspaces),
  facilitatorRoles: many(trainingFacilitators),
  participantRoles: many(trainingParticipants),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  trainings: many(trainings),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const trainingsRelations = relations(trainings, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [trainings.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, { fields: [trainings.createdBy], references: [users.id] }),
  days: many(trainingDays),
  modules: many(trainingModules),
  facilitators: many(trainingFacilitators),
  participants: many(trainingParticipants),
  liveSessions: many(liveSessions),
  analytics: one(trainingAnalytics, {
    fields: [trainings.id],
    references: [trainingAnalytics.trainingId],
  }),
}));

export const trainingDaysRelations = relations(trainingDays, ({ one, many }) => ({
  training: one(trainings, { fields: [trainingDays.trainingId], references: [trainings.id] }),
  modules: many(trainingModules),
}));

export const trainingModulesRelations = relations(trainingModules, ({ one, many }) => ({
  training: one(trainings, { fields: [trainingModules.trainingId], references: [trainings.id] }),
  day: one(trainingDays, { fields: [trainingModules.dayId], references: [trainingDays.id] }),
  responses: many(participantResponses),
}));

export const trainingFacilitatorsRelations = relations(trainingFacilitators, ({ one }) => ({
  training: one(trainings, {
    fields: [trainingFacilitators.trainingId],
    references: [trainings.id],
  }),
  user: one(users, { fields: [trainingFacilitators.userId], references: [users.id] }),
}));

export const trainingParticipantsRelations = relations(trainingParticipants, ({ one }) => ({
  training: one(trainings, {
    fields: [trainingParticipants.trainingId],
    references: [trainings.id],
  }),
  user: one(users, { fields: [trainingParticipants.userId], references: [users.id] }),
}));

export const participantResponsesRelations = relations(participantResponses, ({ one }) => ({
  training: one(trainings, {
    fields: [participantResponses.trainingId],
    references: [trainings.id],
  }),
  module: one(trainingModules, {
    fields: [participantResponses.moduleId],
    references: [trainingModules.id],
  }),
  user: one(users, { fields: [participantResponses.userId], references: [users.id] }),
  liveSession: one(liveSessions, {
    fields: [participantResponses.liveSessionId],
    references: [liveSessions.id],
  }),
}));

export const liveSessionsRelations = relations(liveSessions, ({ one, many }) => ({
  training: one(trainings, { fields: [liveSessions.trainingId], references: [trainings.id] }),
  creator: one(users, { fields: [liveSessions.createdBy], references: [users.id] }),
  responses: many(participantResponses),
}));

// ─── Better Auth Tables ───────────────────────────────────────────────────────
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: "cascade" })
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

-- Migrate training_analytics to new schema (aggregateData-based)
ALTER TABLE "training_analytics"
  DROP COLUMN IF EXISTS "total_participants",
  DROP COLUMN IF EXISTS "avg_completion_time",
  DROP COLUMN IF EXISTS "attendance_log",
  DROP COLUMN IF EXISTS "quiz_aggregates";
--> statement-breakpoint
ALTER TABLE "training_analytics"
  ADD COLUMN IF NOT EXISTS "workspace_id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN IF NOT EXISTS "aggregate_data" jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "export_url" text,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();
--> statement-breakpoint
ALTER TABLE "training_analytics"
  ADD CONSTRAINT "training_analytics_workspace_id_workspaces_id_fk"
  FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;

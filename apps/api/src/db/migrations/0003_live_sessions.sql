CREATE TABLE IF NOT EXISTS "live_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "training_id" uuid NOT NULL,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "ended_at" timestamp,
  "status" text NOT NULL DEFAULT 'active',
  "target_responses" integer,
  "created_by" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "participant_responses" ADD COLUMN IF NOT EXISTS "live_session_id" uuid;
--> statement-breakpoint
ALTER TABLE "live_sessions" DROP CONSTRAINT IF EXISTS "live_sessions_training_id_trainings_id_fk";
--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_training_id_trainings_id_fk"
  FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "live_sessions" DROP CONSTRAINT IF EXISTS "live_sessions_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "participant_responses" DROP CONSTRAINT IF EXISTS "participant_responses_live_session_id_live_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "participant_responses" ADD CONSTRAINT "participant_responses_live_session_id_live_sessions_id_fk"
  FOREIGN KEY ("live_session_id") REFERENCES "public"."live_sessions"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "live_sessions_training_idx" ON "live_sessions" ("training_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_session_module_idx" ON "participant_responses" ("live_session_id", "module_id");

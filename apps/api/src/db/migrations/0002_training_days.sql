CREATE TABLE "training_days" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "training_id" uuid NOT NULL,
  "day_number" integer NOT NULL,
  "title" text NOT NULL,
  "date" timestamp,
  "description" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "training_modules" ADD COLUMN "day_id" uuid;
--> statement-breakpoint
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_training_id_trainings_id_fk"
  FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training_modules" ADD CONSTRAINT "training_modules_day_id_training_days_id_fk"
  FOREIGN KEY ("day_id") REFERENCES "public"."training_days"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "days_training_idx" ON "training_days" ("training_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "days_training_number_unique" ON "training_days" ("training_id", "day_number");

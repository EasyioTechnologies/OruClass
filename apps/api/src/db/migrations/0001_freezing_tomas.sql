
ALTER TABLE "trainings" ADD COLUMN "labels" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "type" text DEFAULT 'in_person' NOT NULL;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "venue" text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "meeting_link" text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "end_date" timestamp;
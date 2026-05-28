-- Dedupe any pre-existing duplicate (training_id, module_id, user_id) rows,
-- keeping the most recent submission. Required before promoting the index
-- to UNIQUE, otherwise the constraint creation fails.
DELETE FROM "participant_responses" a
USING "participant_responses" b
WHERE a."training_id" = b."training_id"
  AND a."module_id" = b."module_id"
  AND a."user_id" = b."user_id"
  AND a."submitted_at" < b."submitted_at";
--> statement-breakpoint
DROP INDEX IF EXISTS "responses_user_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "responses_user_unique_idx"
  ON "participant_responses" ("training_id", "module_id", "user_id");

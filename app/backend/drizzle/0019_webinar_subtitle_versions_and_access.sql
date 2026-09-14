-- Additive only: existing webinar rows, imports, and R2 references stay untouched.
-- Subtitle versions are registered lazily from the existing R2 tracks the first
-- time a webinar is opened (or eagerly with scripts/migrate-webinar-subtitle-versions.ts).
ALTER TABLE "ibpa"."webinars" ADD COLUMN IF NOT EXISTS "publication_status" varchar(24) DEFAULT 'DRAFT' NOT NULL;
--> statement-breakpoint
ALTER TABLE "ibpa"."webinars" ADD COLUMN IF NOT EXISTS "published_at" timestamp;
--> statement-breakpoint
ALTER TABLE "ibpa"."webinars" ADD COLUMN IF NOT EXISTS "subtitle_versions" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "ibpa"."webinars" ADD COLUMN IF NOT EXISTS "access_settings" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE "ibpa"."webinars"
    ADD CONSTRAINT "ibpa_webinars_publication_status_check"
    CHECK ("publication_status" IN ('DRAFT', 'PUBLISHED'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ibpa_webinars_publication_status_idx" ON "ibpa"."webinars" USING btree ("publication_status", "recorded_at");

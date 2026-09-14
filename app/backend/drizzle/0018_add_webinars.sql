CREATE TABLE IF NOT EXISTS "ibpa"."webinars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"zoom_meeting_id" varchar(80) NOT NULL,
	"zoom_meeting_uuid" text NOT NULL,
	"zoom_recording_file_id" varchar(255),
	"recorded_at" timestamp NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"video_r2_key" text,
	"status" varchar(24) DEFAULT 'AVAILABLE' NOT NULL,
	"transcript_status" varchar(32) DEFAULT 'NOT_AVAILABLE' NOT NULL,
	"zoom_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ibpa_webinars_status_check" CHECK ("status" IN ('AVAILABLE', 'IMPORTING', 'IMPORTED', 'FAILED')),
	CONSTRAINT "ibpa_webinars_transcript_status_check" CHECK ("transcript_status" IN ('AVAILABLE', 'IMPORTED', 'NOT_AVAILABLE', 'FAILED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ibpa_webinars_zoom_meeting_uuid_uidx" ON "ibpa"."webinars" USING btree ("zoom_meeting_uuid");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ibpa_webinars_zoom_recording_file_id_uidx" ON "ibpa"."webinars" USING btree ("zoom_recording_file_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ibpa_webinars_recorded_at_idx" ON "ibpa"."webinars" USING btree ("recorded_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ibpa_webinars_status_idx" ON "ibpa"."webinars" USING btree ("status");

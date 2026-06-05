CREATE TABLE IF NOT EXISTS "ibpa"."partners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "cover_image" text,
  "cta_url" text,
  "cta_label" varchar(120),
  "is_pinned" boolean DEFAULT false NOT NULL,
  "publish_to_site" boolean DEFAULT true NOT NULL,
  "publish_to_dashboard" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ibpa_partners_created_at_idx" ON "ibpa"."partners" USING btree ("created_at");
--> statement-breakpoint
DROP TABLE IF EXISTS "application_additional_files" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "dashboard_notifications" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "email_logs" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "team_seat_extensions" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "team_members" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "partner_applications" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "certificates" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "orders" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "content_items" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "stripe_webhook_events" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "card_requests" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "users" CASCADE;

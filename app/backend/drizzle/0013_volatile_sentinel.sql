ALTER TYPE "public"."ibpa_file_type" ADD VALUE 'certificate';--> statement-breakpoint
ALTER TYPE "public"."ibpa_file_type" ADD VALUE 'external_certificate';--> statement-breakpoint
CREATE TABLE "ibpa"."partners" (
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
ALTER TABLE "application_additional_files" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "card_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certificates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "content_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dashboard_notifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "partner_applications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stripe_webhook_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team_seat_extensions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "application_additional_files" CASCADE;--> statement-breakpoint
DROP TABLE "card_requests" CASCADE;--> statement-breakpoint
DROP TABLE "certificates" CASCADE;--> statement-breakpoint
DROP TABLE "content_items" CASCADE;--> statement-breakpoint
DROP TABLE "dashboard_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "email_logs" CASCADE;--> statement-breakpoint
DROP TABLE "orders" CASCADE;--> statement-breakpoint
DROP TABLE "partner_applications" CASCADE;--> statement-breakpoint
DROP TABLE "stripe_webhook_events" CASCADE;--> statement-breakpoint
DROP TABLE "team_members" CASCADE;--> statement-breakpoint
DROP TABLE "team_seat_extensions" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "ibpa"."team_members" DROP CONSTRAINT "team_members_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "ibpa"."ibpa_articles_slug_uidx";--> statement-breakpoint
DROP INDEX "ibpa"."ibpa_events_slug_uidx";--> statement-breakpoint
DROP INDEX "ibpa"."ibpa_team_members_user_id_idx";--> statement-breakpoint
ALTER TABLE "ibpa"."events" ALTER COLUMN "price" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ibpa"."events" ALTER COLUMN "price" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ibpa"."events" ALTER COLUMN "price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ibpa"."profiles" ALTER COLUMN "services" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "ibpa"."profiles" ALTER COLUMN "services" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "ibpa"."profiles" ALTER COLUMN "services" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ibpa"."event_registrations" ADD COLUMN "email" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ibpa"."event_registrations" ADD COLUMN "source" varchar(80) DEFAULT 'dashboard' NOT NULL;--> statement-breakpoint
ALTER TABLE "ibpa"."event_registrations" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "ibpa"."event_registrations" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ibpa"."event_registrations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ibpa"."profiles" ADD COLUMN "phone" varchar(80);--> statement-breakpoint
ALTER TABLE "ibpa"."profiles" ADD COLUMN "achievements" text;--> statement-breakpoint
ALTER TABLE "ibpa"."profiles" ADD COLUMN "industry_contribution" text;--> statement-breakpoint
CREATE INDEX "ibpa_partners_created_at_idx" ON "ibpa"."partners" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "ibpa"."articles" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "ibpa"."articles" DROP COLUMN "excerpt";--> statement-breakpoint
ALTER TABLE "ibpa"."events" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "ibpa"."team_members" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "ibpa"."users" DROP COLUMN "updated_at";
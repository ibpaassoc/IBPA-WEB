CREATE SCHEMA IF NOT EXISTS "ibpa";
--> statement-breakpoint
CREATE TYPE "public"."ibpa_application_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAYMENT_SENT', 'PAID');
--> statement-breakpoint
CREATE TYPE "public"."ibpa_application_type" AS ENUM('MEMBER', 'PARTNER', 'TEAM_MEMBER');
--> statement-breakpoint
CREATE TYPE "public"."ibpa_event_registration_status" AS ENUM('REGISTERED', 'WAITLISTED', 'CANCELLED', 'ATTENDED');
--> statement-breakpoint
CREATE TYPE "public"."ibpa_file_type" AS ENUM('PROFILE', 'APPLICATION', 'EVENT');
--> statement-breakpoint
CREATE TYPE "public"."ibpa_membership_status" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "public"."ibpa_payment_status" AS ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED');
--> statement-breakpoint
CREATE TYPE "public"."ibpa_user_role" AS ENUM('ADMIN', 'MEMBER', 'PARTNER', 'TEAM_MEMBER');
--> statement-breakpoint
CREATE TABLE "ibpa"."users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clerk_id" varchar(255),
  "email" varchar(255) NOT NULL,
  "role" "ibpa_user_role" DEFAULT 'MEMBER' NOT NULL,
  "status" varchar(40) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "first_name" varchar(255),
  "last_name" varchar(255),
  "avatar_url" text,
  "bio" text,
  "credentials" text,
  "services" text,
  "work_gallery_photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "specializations" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "city" varchar(120),
  "state" varchar(120),
  "country" varchar(120),
  "website" text,
  "instagram" text,
  "years_experience" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "type" "ibpa_application_type" NOT NULL,
  "package" varchar(80),
  "status" "ibpa_application_status" DEFAULT 'SUBMITTED' NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(80),
  "payment_link" text,
  "application_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "application_files" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "approved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "type" varchar(80) NOT NULL,
  "status" "ibpa_membership_status" DEFAULT 'ACTIVE' NOT NULL,
  "started_at" timestamp,
  "expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ibpa"."payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "type" varchar(80) NOT NULL,
  "stripe_session_id" text,
  "amount" integer DEFAULT 0 NOT NULL,
  "status" "ibpa_payment_status" DEFAULT 'PENDING' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ibpa"."certificates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "membership_id" uuid NOT NULL,
  "certificate_number" varchar(80) NOT NULL,
  "certificate_url" text,
  "issued_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ibpa"."events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "cover_image" jsonb,
  "location" text,
  "visibility" varchar(40) DEFAULT 'PRIVATE' NOT NULL,
  "price" integer DEFAULT 0 NOT NULL,
  "capacity" integer,
  "event_link" text,
  "event_all_day" boolean DEFAULT false NOT NULL,
  "cta_label" varchar(120),
  "is_pinned" boolean DEFAULT false NOT NULL,
  "publish_to_site" boolean DEFAULT false NOT NULL,
  "publish_to_dashboard" boolean DEFAULT false NOT NULL,
  "start_date" timestamp,
  "end_date" timestamp,
  "status" varchar(40) DEFAULT 'DRAFT' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."event_registrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "status" "ibpa_event_registration_status" DEFAULT 'REGISTERED' NOT NULL,
  "registered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."articles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "cover_image" text,
  "cta_url" text,
  "cta_label" varchar(120),
  "is_pinned" boolean DEFAULT false NOT NULL,
  "publish_to_site" boolean DEFAULT false NOT NULL,
  "publish_to_dashboard" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "type" varchar(60) NOT NULL,
  "visibility" varchar(40) DEFAULT 'TARGETED' NOT NULL,
  "recipients" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "seat_count" integer DEFAULT 5 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "email" varchar(255) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "role" varchar(120),
  "status" varchar(40) DEFAULT 'INVITED' NOT NULL,
  "joined_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ibpa"."files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid,
  "related_id" uuid,
  "type" "ibpa_file_type" NOT NULL,
  "file_url" text NOT NULL,
  "file_name" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibpa"."stripe_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "stripe_event_id" text NOT NULL,
  "event_type" varchar(120) NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "processed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ibpa"."profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ibpa"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ibpa"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ibpa"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ibpa"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."certificates" ADD CONSTRAINT "certificates_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "ibpa"."memberships"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "ibpa"."events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."event_registrations" ADD CONSTRAINT "event_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ibpa"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."teams" ADD CONSTRAINT "teams_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "ibpa"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ibpa"."teams"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ibpa"."files" ADD CONSTRAINT "files_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "ibpa"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "ibpa_users_clerk_id_uidx" ON "ibpa"."users" USING btree ("clerk_id");
--> statement-breakpoint
CREATE INDEX "ibpa_users_email_idx" ON "ibpa"."users" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "ibpa_users_role_idx" ON "ibpa"."users" USING btree ("role");
--> statement-breakpoint
CREATE UNIQUE INDEX "ibpa_profiles_user_id_uidx" ON "ibpa"."profiles" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "ibpa_profiles_location_idx" ON "ibpa"."profiles" USING btree ("country","state","city");
--> statement-breakpoint
CREATE INDEX "ibpa_applications_user_id_idx" ON "ibpa"."applications" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "ibpa_applications_status_idx" ON "ibpa"."applications" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "ibpa_applications_type_idx" ON "ibpa"."applications" USING btree ("type");
--> statement-breakpoint
CREATE INDEX "ibpa_applications_email_idx" ON "ibpa"."applications" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "ibpa_applications_created_at_idx" ON "ibpa"."applications" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "ibpa_applications_open_idx" ON "ibpa"."applications" USING btree ("status","created_at") WHERE "status" IN ('SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_SENT');
--> statement-breakpoint
CREATE INDEX "ibpa_memberships_user_id_idx" ON "ibpa"."memberships" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "ibpa_memberships_status_idx" ON "ibpa"."memberships" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "ibpa_memberships_active_user_idx" ON "ibpa"."memberships" USING btree ("user_id") WHERE "status" = 'ACTIVE';
--> statement-breakpoint
CREATE INDEX "ibpa_payments_user_id_idx" ON "ibpa"."payments" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "ibpa_payments_status_idx" ON "ibpa"."payments" USING btree ("status");
--> statement-breakpoint
CREATE UNIQUE INDEX "ibpa_payments_stripe_session_uidx" ON "ibpa"."payments" USING btree ("stripe_session_id");
--> statement-breakpoint
CREATE INDEX "ibpa_payments_paid_user_idx" ON "ibpa"."payments" USING btree ("user_id","created_at") WHERE "status" = 'PAID';
--> statement-breakpoint
CREATE UNIQUE INDEX "ibpa_certificates_membership_uidx" ON "ibpa"."certificates" USING btree ("membership_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "ibpa_certificates_number_uidx" ON "ibpa"."certificates" USING btree ("certificate_number");
--> statement-breakpoint
CREATE INDEX "ibpa_events_status_start_idx" ON "ibpa"."events" USING btree ("status","start_date");
--> statement-breakpoint
CREATE INDEX "ibpa_events_created_at_idx" ON "ibpa"."events" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "ibpa_event_registrations_event_id_idx" ON "ibpa"."event_registrations" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX "ibpa_event_registrations_user_id_idx" ON "ibpa"."event_registrations" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "ibpa_event_registrations_event_user_uidx" ON "ibpa"."event_registrations" USING btree ("event_id","user_id");
--> statement-breakpoint
CREATE INDEX "ibpa_articles_created_at_idx" ON "ibpa"."articles" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "ibpa_notifications_type_idx" ON "ibpa"."notifications" USING btree ("type");
--> statement-breakpoint
CREATE INDEX "ibpa_notifications_created_at_idx" ON "ibpa"."notifications" USING btree ("created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "ibpa_teams_owner_uidx" ON "ibpa"."teams" USING btree ("owner_user_id");
--> statement-breakpoint
CREATE INDEX "ibpa_team_members_team_id_idx" ON "ibpa"."team_members" USING btree ("team_id");
--> statement-breakpoint
CREATE INDEX "ibpa_team_members_email_idx" ON "ibpa"."team_members" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "ibpa_files_owner_user_id_idx" ON "ibpa"."files" USING btree ("owner_user_id");
--> statement-breakpoint
CREATE INDEX "ibpa_files_related_id_idx" ON "ibpa"."files" USING btree ("related_id");
--> statement-breakpoint
CREATE INDEX "ibpa_files_type_idx" ON "ibpa"."files" USING btree ("type");
--> statement-breakpoint
CREATE UNIQUE INDEX "ibpa_stripe_webhook_events_event_id_uidx" ON "ibpa"."stripe_webhook_events" USING btree ("stripe_event_id");
--> statement-breakpoint
CREATE INDEX "ibpa_stripe_webhook_events_type_idx" ON "ibpa"."stripe_webhook_events" USING btree ("event_type");

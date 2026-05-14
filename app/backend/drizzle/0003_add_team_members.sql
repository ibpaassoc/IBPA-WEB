CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_order_id" uuid NOT NULL,
  "owner_clerk_user_id" varchar(255) NOT NULL,
  "owner_member_id" varchar(40) NOT NULL,
  "team_member_id" varchar(60) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "email_normalized" varchar(255) NOT NULL,
  "role" varchar(120) NOT NULL,
  "portfolio_link" text,
  "license" varchar(120) NOT NULL,
  "affiliation_confirmed" boolean DEFAULT false NOT NULL,
  "seat_number" integer NOT NULL,
  "seat_kind" varchar(30) DEFAULT 'included' NOT NULL,
  "billing_status" varchar(30) DEFAULT 'included' NOT NULL,
  "access_status" varchar(30) DEFAULT 'active' NOT NULL,
  "registration_status" varchar(30) DEFAULT 'not_registered' NOT NULL,
  "ticket_code" varchar(120),
  "attendance_status" varchar(30) DEFAULT 'not_marked' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "team_members" ADD CONSTRAINT "team_members_owner_order_id_orders_id_fk" FOREIGN KEY ("owner_order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "team_members_owner_order_id_idx" ON "team_members" USING btree ("owner_order_id");
CREATE INDEX IF NOT EXISTS "team_members_owner_clerk_user_id_idx" ON "team_members" USING btree ("owner_clerk_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_member_id_uidx" ON "team_members" USING btree ("team_member_id");
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_owner_order_email_uidx" ON "team_members" USING btree ("owner_order_id", "email_normalized");

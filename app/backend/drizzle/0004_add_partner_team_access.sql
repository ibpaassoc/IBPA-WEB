ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "account_type" varchar(30) DEFAULT 'member' NOT NULL;

ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "status" varchar(30) DEFAULT 'invited' NOT NULL;
UPDATE "team_members" SET "status" = 'active' WHERE "status" = 'invited';

DROP INDEX IF EXISTS "team_members_owner_order_email_uidx";
CREATE INDEX IF NOT EXISTS "team_members_owner_order_email_idx" ON "team_members" USING btree ("owner_order_id", "email_normalized");

CREATE TABLE IF NOT EXISTS "team_seat_extensions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_order_id" uuid NOT NULL,
  "owner_clerk_user_id" varchar(255) NOT NULL,
  "seats_requested" integer DEFAULT 1 NOT NULL,
  "status" varchar(30) DEFAULT 'payment_required' NOT NULL,
  "payment_session_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "team_seat_extensions" ADD CONSTRAINT "team_seat_extensions_partner_order_id_orders_id_fk" FOREIGN KEY ("partner_order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "team_seat_extensions_partner_order_id_idx" ON "team_seat_extensions" USING btree ("partner_order_id");
CREATE INDEX IF NOT EXISTS "team_seat_extensions_owner_clerk_user_id_idx" ON "team_seat_extensions" USING btree ("owner_clerk_user_id");
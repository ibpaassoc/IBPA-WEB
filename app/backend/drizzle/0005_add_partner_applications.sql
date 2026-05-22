CREATE TABLE IF NOT EXISTS "partner_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(50),
  "message" text NOT NULL,
  "requested_tier" varchar(50),
  "status" varchar(30) DEFAULT 'PENDING' NOT NULL,
  "payment_status" varchar(30) DEFAULT 'UNPAID' NOT NULL,
  "stripe_checkout_session_id" text,
  "stripe_payment_intent_id" text,
  "stripe_invoice_id" text,
  "partner_order_id" uuid,
  "approved_at" timestamp,
  "paid_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_partner_order_id_orders_id_fk" FOREIGN KEY ("partner_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "partner_applications_email_idx" ON "partner_applications" USING btree ("email");
CREATE INDEX IF NOT EXISTS "partner_applications_status_idx" ON "partner_applications" USING btree ("status");
CREATE INDEX IF NOT EXISTS "partner_applications_payment_status_idx" ON "partner_applications" USING btree ("payment_status");
CREATE INDEX IF NOT EXISTS "partner_applications_created_at_idx" ON "partner_applications" USING btree ("created_at");

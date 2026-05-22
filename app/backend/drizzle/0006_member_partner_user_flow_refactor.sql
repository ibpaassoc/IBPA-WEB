-- 0006_member_partner_user_flow_refactor.sql
-- Safe migration/backfill for separating member applications, partner applications, and dashboard users.
--
-- Optional manual backups before running:
--   CREATE TABLE public.orders_manual_backup_20260522 AS TABLE public.orders WITH DATA;
--   CREATE TABLE public.partner_applications_manual_backup_20260522 AS TABLE public.partner_applications WITH DATA;

DO $$
BEGIN
  IF to_regclass('public.orders_backup_20260522') IS NULL THEN
    EXECUTE 'CREATE TABLE public.orders_backup_20260522 AS TABLE public.orders WITH DATA';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.partner_applications_backup_20260522') IS NULL THEN
    EXECUTE 'CREATE TABLE public.partner_applications_backup_20260522 AS TABLE public.partner_applications WITH DATA';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "member_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "first_name" varchar(120),
  "last_name" varchar(120),
  "email" varchar(255) NOT NULL,
  "email_normalized" varchar(255) NOT NULL,
  "phone" varchar(50),
  "membership_category" varchar(50),
  "applicant_type" varchar(50),
  "status" varchar(30) NOT NULL DEFAULT 'submitted',
  "payment_status" varchar(30) NOT NULL DEFAULT 'not_required',
  "secure_token" varchar(255) NOT NULL,
  "stripe_checkout_session_id" text,
  "stripe_customer_id" text,
  "stripe_payment_intent_id" text,
  "stripe_invoice_id" text,
  "legacy_order_id" uuid,
  "raw_data" jsonb,
  "approved_at" timestamp,
  "rejected_at" timestamp,
  "paid_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "member_applications" ADD CONSTRAINT "member_applications_legacy_order_id_orders_id_fk" FOREIGN KEY ("legacy_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "member_applications_secure_token_uidx" ON "member_applications" USING btree ("secure_token");
CREATE INDEX IF NOT EXISTS "member_applications_email_normalized_idx" ON "member_applications" USING btree ("email_normalized");
CREATE INDEX IF NOT EXISTS "member_applications_status_idx" ON "member_applications" USING btree ("status");
CREATE INDEX IF NOT EXISTS "member_applications_payment_status_idx" ON "member_applications" USING btree ("payment_status");
CREATE INDEX IF NOT EXISTS "member_applications_created_at_idx" ON "member_applications" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "member_applications_legacy_order_id_idx" ON "member_applications" USING btree ("legacy_order_id");

CREATE TABLE IF NOT EXISTS "member_application_additional_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "member_application_id" uuid NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "file_url" text NOT NULL,
  "file_key" text,
  "file_type" varchar(120) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "member_application_additional_files" ADD CONSTRAINT "member_application_additional_files_member_application_id_member_applications_id_fk" FOREIGN KEY ("member_application_id") REFERENCES "public"."member_applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "member_application_additional_files_member_application_id_idx" ON "member_application_additional_files" USING btree ("member_application_id");

ALTER TABLE "partner_applications" ADD COLUMN IF NOT EXISTS "email_normalized" varchar(255);
ALTER TABLE "partner_applications" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "partner_applications" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;
ALTER TABLE "partner_applications" ADD COLUMN IF NOT EXISTS "raw_data" jsonb;

UPDATE "partner_applications"
SET "email_normalized" = lower(trim("email"))
WHERE coalesce("email_normalized", '') = '';

ALTER TABLE "partner_applications" ALTER COLUMN "email_normalized" SET DEFAULT '';
ALTER TABLE "partner_applications" ALTER COLUMN "status" SET DEFAULT 'submitted';
ALTER TABLE "partner_applications" ALTER COLUMN "payment_status" SET DEFAULT 'not_required';

UPDATE "partner_applications"
SET "status" = CASE
  WHEN lower("status") = 'pending' THEN 'submitted'
  WHEN lower("status") = 'review' THEN 'under_review'
  WHEN lower("status") = 'approved' THEN 'approved'
  WHEN lower("status") = 'rejected' THEN 'rejected'
  WHEN lower("status") = 'paid' THEN 'approved'
  ELSE coalesce(lower("status"), 'submitted')
END;

UPDATE "partner_applications"
SET "payment_status" = CASE
  WHEN lower("payment_status") = 'unpaid' THEN 'pending'
  WHEN lower("payment_status") = 'pending' THEN 'pending'
  WHEN lower("payment_status") = 'paid' THEN 'paid'
  WHEN lower("payment_status") = 'failed' THEN 'failed'
  WHEN lower("payment_status") = 'refunded' THEN 'refunded'
  WHEN lower("payment_status") = 'not_required' THEN 'not_required'
  ELSE coalesce(lower("payment_status"), 'not_required')
END;

CREATE INDEX IF NOT EXISTS "partner_applications_email_normalized_idx" ON "partner_applications" USING btree ("email_normalized");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id" uuid;
UPDATE "users" SET "id" = gen_random_uuid() WHERE "id" IS NULL;
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL;

DO $$
DECLARE users_pk_name text;
BEGIN
  SELECT c.conname
  INTO users_pk_name
  FROM pg_constraint c
  INNER JOIN pg_class t ON c.conrelid = t.oid
  INNER JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'users'
    AND c.contype = 'p'
  LIMIT 1;

  IF users_pk_name IS NOT NULL AND users_pk_name <> 'users_id_pkey' THEN
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', users_pk_name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_id_pkey'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_id_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "clerk_id" DROP NOT NULL;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_normalized" varchar(255);
UPDATE "users" SET "email_normalized" = lower(trim("email")) WHERE coalesce("email_normalized", '') = '';
ALTER TABLE "users" ALTER COLUMN "email_normalized" SET DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "email_normalized" SET NOT NULL;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "user_type" varchar(20) NOT NULL DEFAULT 'member';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_status" varchar(20) NOT NULL DEFAULT 'active';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "member_application_id" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "partner_application_id" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "member_order_id" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "partner_order_id" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activated_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_payment_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "raw_data" jsonb;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_member_application_id_member_applications_id_fk" FOREIGN KEY ("member_application_id") REFERENCES "public"."member_applications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_partner_application_id_partner_applications_id_fk" FOREIGN KEY ("partner_application_id") REFERENCES "public"."partner_applications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_member_order_id_orders_id_fk" FOREIGN KEY ("member_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_partner_order_id_orders_id_fk" FOREIGN KEY ("partner_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_id_unique_idx" ON "users" USING btree ("clerk_id");
CREATE INDEX IF NOT EXISTS "users_email_normalized_idx" ON "users" USING btree ("email_normalized");
CREATE INDEX IF NOT EXISTS "users_user_type_idx" ON "users" USING btree ("user_type");
CREATE INDEX IF NOT EXISTS "users_account_status_idx" ON "users" USING btree ("account_status");
CREATE INDEX IF NOT EXISTS "users_member_application_id_idx" ON "users" USING btree ("member_application_id");
CREATE INDEX IF NOT EXISTS "users_partner_application_id_idx" ON "users" USING btree ("partner_application_id");

INSERT INTO "member_applications" (
  "full_name",
  "first_name",
  "last_name",
  "email",
  "email_normalized",
  "phone",
  "membership_category",
  "applicant_type",
  "status",
  "payment_status",
  "secure_token",
  "stripe_checkout_session_id",
  "legacy_order_id",
  "raw_data",
  "approved_at",
  "rejected_at",
  "paid_at",
  "created_at",
  "updated_at"
)
SELECT
  coalesce(o.name, 'Unknown Applicant') as full_name,
  split_part(coalesce(o.name, ''), ' ', 1) as first_name,
  nullif(trim(regexp_replace(coalesce(o.name, ''), '^\\S+\\s*', '')), '') as last_name,
  lower(trim(o.email)) as email,
  lower(trim(o.email)) as email_normalized,
  o.phone,
  o.membership_category,
  o.applicant_type,
  CASE
    WHEN lower(o.status) = 'pending' THEN 'submitted'
    WHEN lower(o.status) = 'review' THEN 'under_review'
    WHEN lower(o.status) = 'approved' THEN 'approved'
    WHEN lower(o.status) = 'rejected' THEN 'rejected'
    WHEN lower(o.status) = 'paid' THEN 'approved'
    ELSE 'submitted'
  END as status,
  CASE
    WHEN lower(o.status) = 'paid' THEN 'paid'
    WHEN lower(o.status) = 'approved' THEN 'pending'
    WHEN lower(o.status) = 'rejected' THEN 'not_required'
    ELSE 'not_required'
  END as payment_status,
  coalesce(nullif(o.secure_token, ''), gen_random_uuid()::text) as secure_token,
  o.stripe_session_id,
  o.id as legacy_order_id,
  coalesce(o.application_payload, '{}'::jsonb) as raw_data,
  CASE WHEN lower(o.status) IN ('approved', 'paid') THEN o.created_at ELSE null END as approved_at,
  CASE WHEN lower(o.status) = 'rejected' THEN o.created_at ELSE null END as rejected_at,
  CASE WHEN lower(o.status) = 'paid' THEN o.created_at ELSE null END as paid_at,
  o.created_at,
  now() as updated_at
FROM "orders" o
WHERE
  coalesce(lower(o.account_type), 'member') <> 'partner'
  AND coalesce(lower(o.membership_category), '') <> 'partner'
  AND coalesce(lower(o.applicant_type), '') <> 'partner'
  AND coalesce(lower(o.application_payload ->> 'type'), '') <> 'partner'
  AND NOT EXISTS (
    SELECT 1
    FROM "member_applications" ma
    WHERE ma.legacy_order_id = o.id
  );

INSERT INTO "member_application_additional_files" (
  "member_application_id",
  "file_name",
  "file_url",
  "file_key",
  "file_type",
  "created_at"
)
SELECT
  ma.id,
  af.file_name,
  af.file_url,
  af.file_key,
  af.file_type,
  af.created_at
FROM "application_additional_files" af
INNER JOIN "member_applications" ma ON ma.legacy_order_id = af.application_id
WHERE NOT EXISTS (
  SELECT 1
  FROM "member_application_additional_files" mf
  WHERE mf.member_application_id = ma.id
    AND mf.file_url = af.file_url
    AND mf.file_name = af.file_name
);

UPDATE "users"
SET "full_name" = trim(concat_ws(' ', "first_name", "last_name"))
WHERE coalesce("full_name", '') = '';

UPDATE "users"
SET
  "user_type" = CASE
    WHEN lower(coalesce("user_type", '')) = 'admin' THEN 'admin'
    WHEN lower(coalesce("user_type", '')) = 'partner' THEN 'partner'
    ELSE 'member'
  END,
  "account_status" = CASE
    WHEN lower(coalesce("account_status", '')) IN ('active', 'suspended', 'inactive') THEN lower("account_status")
    ELSE 'active'
  END
WHERE true;

CREATE TABLE IF NOT EXISTS "ibpa"."admin_certificates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "clerk_user_id" varchar(255),
  "title" varchar(255) NOT NULL,
  "file_url" text NOT NULL,
  "file_key" varchar(255),
  "file_name" varchar(255),
  "file_type" varchar(120),
  "issued_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "ibpa"."admin_certificates"
    ADD CONSTRAINT "ibpa_admin_certificates_order_id_memberships_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "ibpa"."memberships"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ibpa_admin_certificates_order_id_idx"
  ON "ibpa"."admin_certificates" USING btree ("order_id");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ibpa_admin_certificates_clerk_user_id_idx"
  ON "ibpa"."admin_certificates" USING btree ("clerk_user_id");

--> statement-breakpoint

COMMENT ON TABLE "ibpa"."admin_certificates" IS
  'Admin-uploaded additional certificates for an applicant, associated by order_id (= membership.id). Separate from the primary certificates table and from application_additional_files.';

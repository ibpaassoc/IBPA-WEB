CREATE TABLE IF NOT EXISTS "application_additional_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "file_url" text NOT NULL,
  "file_key" text,
  "file_type" varchar(120) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "application_additional_files" ADD CONSTRAINT "application_additional_files_application_id_orders_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "application_additional_files_application_id_idx" ON "application_additional_files" USING btree ("application_id");

ALTER TABLE "ibpa"."events"
  ALTER COLUMN "price" TYPE text USING "price"::text,
  ALTER COLUMN "price" DROP DEFAULT,
  ALTER COLUMN "price" DROP NOT NULL;

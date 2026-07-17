ALTER TABLE "ibpa"."events"
  ADD COLUMN IF NOT EXISTS "image_presentation" jsonb;

ALTER TABLE "ibpa"."articles"
  ADD COLUMN IF NOT EXISTS "image_presentation" jsonb;

COMMENT ON COLUMN "ibpa"."events"."image_presentation" IS
  'Content image metadata; crop and focal-point coordinates are normalized to the original source image (0..1).';

COMMENT ON COLUMN "ibpa"."articles"."image_presentation" IS
  'Content image metadata; crop and focal-point coordinates are normalized to the original source image (0..1).';

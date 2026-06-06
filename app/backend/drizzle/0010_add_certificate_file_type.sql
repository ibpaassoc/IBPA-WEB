ALTER TYPE "ibpa_file_type" ADD VALUE IF NOT EXISTS 'certificate';

UPDATE "ibpa"."files"
SET "type" = 'certificate'
WHERE "type" = 'external_certificate';

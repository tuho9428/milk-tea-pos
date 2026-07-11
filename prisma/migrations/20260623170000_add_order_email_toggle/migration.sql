ALTER TABLE "StoreSettings"
ADD COLUMN IF NOT EXISTS "orderEmailsEnabled" BOOLEAN NOT NULL DEFAULT true;

UPDATE "StoreSettings"
SET "orderEmailsEnabled" = true
WHERE "orderEmailsEnabled" IS NULL;

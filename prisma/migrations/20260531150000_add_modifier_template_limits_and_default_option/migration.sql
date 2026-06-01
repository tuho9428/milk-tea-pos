ALTER TABLE "ModifierTemplate"
ADD COLUMN "maxSelections" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "defaultOptionId" TEXT;

ALTER TABLE "ModifierTemplate"
ADD CONSTRAINT "ModifierTemplate_defaultOptionId_fkey"
FOREIGN KEY ("defaultOptionId")
REFERENCES "ModifierTemplateOption"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

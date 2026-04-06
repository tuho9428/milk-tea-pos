CREATE TABLE "ModifierTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "ModifierType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "multiSelect" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ModifierTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModifierTemplateOption" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "modifierTemplateId" TEXT NOT NULL,

  CONSTRAINT "ModifierTemplateOption_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ModifierGroup"
ADD COLUMN "templateId" TEXT;

ALTER TABLE "ModifierTemplateOption"
ADD CONSTRAINT "ModifierTemplateOption_modifierTemplateId_fkey"
FOREIGN KEY ("modifierTemplateId")
REFERENCES "ModifierTemplate"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ModifierGroup"
ADD CONSTRAINT "ModifierGroup_templateId_fkey"
FOREIGN KEY ("templateId")
REFERENCES "ModifierTemplate"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

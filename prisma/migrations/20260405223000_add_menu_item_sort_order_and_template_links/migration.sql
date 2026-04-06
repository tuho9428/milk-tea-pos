ALTER TABLE "MenuItem"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered_menu_items AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) - 1 AS position
  FROM "MenuItem"
)
UPDATE "MenuItem" AS m
SET "sortOrder" = ordered_menu_items.position
FROM ordered_menu_items
WHERE m."id" = ordered_menu_items."id";

CREATE TABLE "MenuItemModifierTemplate" (
  "menuItemId" TEXT NOT NULL,
  "modifierTemplateId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "MenuItemModifierTemplate_pkey" PRIMARY KEY ("menuItemId","modifierTemplateId")
);

ALTER TABLE "MenuItemModifierTemplate"
ADD CONSTRAINT "MenuItemModifierTemplate_menuItemId_fkey"
FOREIGN KEY ("menuItemId")
REFERENCES "MenuItem"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "MenuItemModifierTemplate"
ADD CONSTRAINT "MenuItemModifierTemplate_modifierTemplateId_fkey"
FOREIGN KEY ("modifierTemplateId")
REFERENCES "ModifierTemplate"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE INDEX "MenuItemModifierTemplate_menuItemId_sortOrder_idx"
ON "MenuItemModifierTemplate"("menuItemId", "sortOrder");

WITH distinct_template_groups AS (
  SELECT DISTINCT
    "menuItemId",
    "templateId"
  FROM "ModifierGroup"
  WHERE "templateId" IS NOT NULL
),
ordered_template_groups AS (
  SELECT
    "menuItemId",
    "templateId",
    ROW_NUMBER() OVER (
      PARTITION BY "menuItemId"
      ORDER BY "templateId" ASC
    ) - 1 AS position
  FROM distinct_template_groups
)
INSERT INTO "MenuItemModifierTemplate" ("menuItemId", "modifierTemplateId", "sortOrder")
SELECT
  "menuItemId",
  "templateId",
  position
FROM ordered_template_groups;

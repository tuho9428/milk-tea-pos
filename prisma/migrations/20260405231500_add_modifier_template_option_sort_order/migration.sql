ALTER TABLE "ModifierTemplateOption"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered_template_options AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "modifierTemplateId"
      ORDER BY "id" ASC
    ) - 1 AS position
  FROM "ModifierTemplateOption"
)
UPDATE "ModifierTemplateOption" AS option_row
SET "sortOrder" = ordered_template_options.position
FROM ordered_template_options
WHERE option_row."id" = ordered_template_options."id";

CREATE INDEX "ModifierTemplateOption_modifierTemplateId_sortOrder_idx"
ON "ModifierTemplateOption"("modifierTemplateId", "sortOrder");

ALTER TABLE "Order"
ADD COLUMN "displayOrderNumber" TEXT,
ADD COLUMN "displayOrderDateKey" TEXT;

WITH ordered_orders AS (
  SELECT
    "id",
    TO_CHAR("createdAt", 'YYYYMMDD') AS date_key,
    ROW_NUMBER() OVER (
      PARTITION BY TO_CHAR("createdAt", 'YYYYMMDD')
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS sequence_number
  FROM "Order"
)
UPDATE "Order" AS order_row
SET
  "displayOrderDateKey" = ordered_orders.date_key,
  "displayOrderNumber" = LPAD(ordered_orders.sequence_number::text, 3, '0')
FROM ordered_orders
WHERE order_row."id" = ordered_orders."id";

ALTER TABLE "Order"
ALTER COLUMN "displayOrderNumber" SET NOT NULL,
ALTER COLUMN "displayOrderDateKey" SET NOT NULL;

CREATE UNIQUE INDEX "Order_displayOrderDateKey_displayOrderNumber_key"
ON "Order"("displayOrderDateKey", "displayOrderNumber");

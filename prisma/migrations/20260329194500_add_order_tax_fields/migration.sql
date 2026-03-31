ALTER TABLE "Order"
ADD COLUMN "tax" DECIMAL(10,2),
ADD COLUMN "taxRateApplied" DECIMAL(5,4);

UPDATE "Order"
SET
  "tax" = ROUND(("total" - "subtotal")::numeric, 2),
  "taxRateApplied" = CASE
    WHEN "subtotal" = 0 THEN 0
    ELSE ROUND((("total" - "subtotal") / "subtotal")::numeric, 4)
  END;

ALTER TABLE "Order"
ALTER COLUMN "tax" SET NOT NULL,
ALTER COLUMN "taxRateApplied" SET NOT NULL;

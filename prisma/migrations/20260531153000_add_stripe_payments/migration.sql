DO $$
BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING'::"PaymentStatus",
ADD COLUMN IF NOT EXISTS "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE'::"PaymentProvider",
ADD COLUMN IF NOT EXISTS "stripeCheckoutSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "paymentCurrency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

UPDATE "Order"
SET
  "paymentStatus" = CASE
    WHEN "status" = 'CANCELED' THEN 'CANCELLED'::"PaymentStatus"
    ELSE 'PAID'::"PaymentStatus"
  END,
  "paymentProvider" = 'STRIPE'::"PaymentProvider",
  "paymentAmount" = "total",
  "paymentCurrency" = 'usd',
  "paidAt" = CASE
    WHEN "status" = 'CANCELED' THEN NULL
    ELSE "createdAt"
  END;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeCheckoutSessionId_key"
ON "Order"("stripeCheckoutSessionId");

CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripePaymentIntentId_key"
ON "Order"("stripePaymentIntentId");

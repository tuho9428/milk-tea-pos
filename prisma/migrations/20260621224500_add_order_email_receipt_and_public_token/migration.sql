ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "customer_email" TEXT,
ADD COLUMN IF NOT EXISTS "public_token" TEXT,
ADD COLUMN IF NOT EXISTS "receipt_url" TEXT,
ADD COLUMN IF NOT EXISTS "order_email_sent_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_public_token_key"
ON "Order"("public_token");

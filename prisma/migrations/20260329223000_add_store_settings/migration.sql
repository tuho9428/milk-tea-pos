CREATE TABLE "StoreSettings" (
  "id" TEXT NOT NULL,
  "storeName" TEXT,
  "taxRate" DECIMAL(5,4) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "StoreSettings" ("id", "storeName", "taxRate", "updatedAt")
VALUES ('default', NULL, 0.0825, CURRENT_TIMESTAMP);

import { prisma } from "@/lib/prisma";

export const DEFAULT_STORE_SETTINGS_ID = "default";
export const DEFAULT_STORE_TAX_RATE = 0.0825;
export const DEFAULT_STORE_ORDER_EMAILS_ENABLED = true;

export type StoreSettingsRecord = {
  createdAt: Date;
  id: string;
  orderEmailsEnabled: boolean;
  storeName: string | null;
  taxRate: { toString(): string } | number;
  updatedAt: Date;
};

function parseOrderEmailsEnabledOverride() {
  const rawValue = process.env.ORDER_EMAILS_ENABLED?.trim().toLowerCase();

  if (!rawValue) {
    return null;
  }

  if (["1", "true", "yes", "on"].includes(rawValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(rawValue)) {
    return false;
  }

  return null;
}

let ensureOrderEmailsColumnPromise: Promise<void> | null = null;

export async function ensureStoreSettingsOrderEmailsColumn() {
  ensureOrderEmailsColumnPromise ??= prisma.$executeRaw`
    ALTER TABLE "StoreSettings"
    ADD COLUMN IF NOT EXISTS "orderEmailsEnabled" BOOLEAN NOT NULL DEFAULT true
  `.then(() => undefined);

  await ensureOrderEmailsColumnPromise;
}

export async function getStoreSettings() {
  await ensureStoreSettingsOrderEmailsColumn();

  await prisma.$executeRaw`
    INSERT INTO "StoreSettings" (
      "id",
      "storeName",
      "taxRate",
      "orderEmailsEnabled",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${DEFAULT_STORE_SETTINGS_ID},
      NULL,
      ${DEFAULT_STORE_TAX_RATE},
      ${DEFAULT_STORE_ORDER_EMAILS_ENABLED},
      NOW(),
      NOW()
    )
    ON CONFLICT ("id") DO NOTHING
  `;

  const rows = await prisma.$queryRaw<StoreSettingsRecord[]>`
    SELECT
      "id",
      "storeName",
      "taxRate",
      "orderEmailsEnabled",
      "createdAt",
      "updatedAt"
    FROM "StoreSettings"
    WHERE "id" = ${DEFAULT_STORE_SETTINGS_ID}
    LIMIT 1
  `;

  const settings = rows[0];

  if (!settings) {
    throw new Error("Store settings row could not be loaded.");
  }

  return settings;
}

export async function getStoreTaxRate() {
  const settings = await getStoreSettings();
  return Number(settings.taxRate);
}

export function getOrderEmailsEnabledOverride() {
  return parseOrderEmailsEnabledOverride();
}

export async function getOrderEmailsEnabled() {
  const override = parseOrderEmailsEnabledOverride();

  if (override !== null) {
    return override;
  }

  const settings = await getStoreSettings();
  return settings.orderEmailsEnabled;
}

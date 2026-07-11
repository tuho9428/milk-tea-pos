"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_STORE_ORDER_EMAILS_ENABLED,
  DEFAULT_STORE_SETTINGS_ID,
  DEFAULT_STORE_TAX_RATE,
  ensureStoreSettingsOrderEmailsColumn,
} from "@/lib/store-settings";

const updateTaxSettingsSchema = z.object({
  taxRatePercent: z.coerce.number().min(0).max(100),
  storeName: z.string().trim().max(120).optional(),
});

const updateOrderEmailSettingsSchema = z.object({
  orderEmailsEnabled: z.string().optional(),
});

export async function updateTaxSettingsAction(formData: FormData) {
  await ensureStoreSettingsOrderEmailsColumn();

  const parsed = updateTaxSettingsSchema.safeParse({
    taxRatePercent: formData.get("taxRatePercent"),
    storeName: formData.get("storeName") || undefined,
  });

  if (!parsed.success) {
    redirect("/admin/settings?error=invalid-tax-rate");
  }

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
      ${parsed.data.storeName || null},
      ${parsed.data.taxRatePercent / 100},
      ${DEFAULT_STORE_ORDER_EMAILS_ENABLED},
      NOW(),
      NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "storeName" = EXCLUDED."storeName",
      "taxRate" = EXCLUDED."taxRate",
      "updatedAt" = NOW()
  `;

  redirect("/admin/settings?saved=1");
}

export async function updateOrderEmailSettingsAction(formData: FormData) {
  await ensureStoreSettingsOrderEmailsColumn();

  const parsed = updateOrderEmailSettingsSchema.safeParse({
    orderEmailsEnabled: formData.get("orderEmailsEnabled")?.toString(),
  });

  if (!parsed.success) {
    redirect("/admin/settings?error=invalid-email-settings");
  }

  const orderEmailsEnabled = parsed.data.orderEmailsEnabled === "true";

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
      ${orderEmailsEnabled},
      NOW(),
      NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "orderEmailsEnabled" = EXCLUDED."orderEmailsEnabled",
      "updatedAt" = NOW()
  `;

  redirect("/admin/settings?saved=1");
}

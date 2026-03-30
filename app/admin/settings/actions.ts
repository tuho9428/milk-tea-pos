"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { DEFAULT_STORE_SETTINGS_ID } from "@/lib/store-settings";

const updateTaxSettingsSchema = z.object({
  taxRatePercent: z.coerce.number().min(0).max(100),
  storeName: z.string().trim().max(120).optional(),
});

export async function updateTaxSettingsAction(formData: FormData) {
  const parsed = updateTaxSettingsSchema.safeParse({
    taxRatePercent: formData.get("taxRatePercent"),
    storeName: formData.get("storeName") || undefined,
  });

  if (!parsed.success) {
    redirect("/admin/settings?error=invalid-tax-rate");
  }

  await prisma.storeSettings.upsert({
    where: {
      id: DEFAULT_STORE_SETTINGS_ID,
    },
    update: {
      storeName: parsed.data.storeName || null,
      taxRate: parsed.data.taxRatePercent / 100,
    },
    create: {
      id: DEFAULT_STORE_SETTINGS_ID,
      storeName: parsed.data.storeName || null,
      taxRate: parsed.data.taxRatePercent / 100,
    },
  });

  redirect("/admin/settings?saved=1");
}

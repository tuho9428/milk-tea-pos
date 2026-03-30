import { prisma } from "@/lib/prisma";

export const DEFAULT_STORE_SETTINGS_ID = "default";
export const DEFAULT_STORE_TAX_RATE = 0.0825;

export async function getStoreSettings() {
  return prisma.storeSettings.upsert({
    where: {
      id: DEFAULT_STORE_SETTINGS_ID,
    },
    update: {},
    create: {
      id: DEFAULT_STORE_SETTINGS_ID,
      storeName: null,
      taxRate: DEFAULT_STORE_TAX_RATE,
    },
  });
}

export async function getStoreTaxRate() {
  const settings = await getStoreSettings();
  return Number(settings.taxRate);
}

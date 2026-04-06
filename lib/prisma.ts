import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  __prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });

function hasOrderTaxFields(client: PrismaClient) {
  const runtimeDataModel = (client as PrismaClient & {
    _runtimeDataModel?: {
      models?: Record<string, { fields?: Array<{ name: string }> }>;
    };
  })._runtimeDataModel;

  const orderFields = runtimeDataModel?.models?.Order?.fields ?? [];
  const orderFieldNames = new Set(orderFields.map((field) => field.name));

  return (
    orderFieldNames.has("tax") &&
    orderFieldNames.has("taxRateApplied") &&
    orderFieldNames.has("displayOrderNumber") &&
    orderFieldNames.has("displayOrderDateKey")
  );
}

function hasModifierTemplateOptionSortOrder(client: PrismaClient) {
  const runtimeDataModel = (client as PrismaClient & {
    _runtimeDataModel?: {
      models?: Record<string, { fields?: Array<{ name: string }> }>;
    };
  })._runtimeDataModel;

  const optionFields = runtimeDataModel?.models?.ModifierTemplateOption?.fields ?? [];
  const optionFieldNames = new Set(optionFields.map((field) => field.name));

  return optionFieldNames.has("sortOrder");
}

const hasExpectedDelegates =
  !!globalForPrisma.__prisma &&
  "menuItem" in globalForPrisma.__prisma &&
  "category" in globalForPrisma.__prisma &&
  "menuItemModifierTemplate" in globalForPrisma.__prisma &&
  "modifierTemplate" in globalForPrisma.__prisma &&
  "modifierTemplateOption" in globalForPrisma.__prisma &&
  hasModifierTemplateOptionSortOrder(globalForPrisma.__prisma) &&
  hasOrderTaxFields(globalForPrisma.__prisma);

function createPrismaClient() {
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = hasExpectedDelegates
  ? globalForPrisma.__prisma!
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

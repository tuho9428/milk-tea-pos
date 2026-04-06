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

  return orderFieldNames.has("tax") && orderFieldNames.has("taxRateApplied");
}

const hasExpectedDelegates =
  !!globalForPrisma.__prisma &&
  "menuItem" in globalForPrisma.__prisma &&
  "category" in globalForPrisma.__prisma &&
  "modifierTemplate" in globalForPrisma.__prisma &&
  "modifierTemplateOption" in globalForPrisma.__prisma &&
  hasOrderTaxFields(globalForPrisma.__prisma);

export const prisma = hasExpectedDelegates
  ? globalForPrisma.__prisma
  : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

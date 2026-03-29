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

const hasExpectedDelegates =
  !!globalForPrisma.__prisma &&
  "menuItem" in globalForPrisma.__prisma &&
  "category" in globalForPrisma.__prisma;

export const prisma = hasExpectedDelegates
  ? globalForPrisma.__prisma
  : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

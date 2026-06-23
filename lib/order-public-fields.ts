import { prisma } from "@/lib/prisma";

export type OrderPublicFields = {
  customerEmail: string | null;
  orderEmailSentAt: Date | null;
  publicToken: string | null;
  receiptUrl: string | null;
};

export type OrderEmailLineItem = {
  menuItemName: string | null;
  modifiers: string[];
  quantity: number;
};

export async function ensureOrderPublicToken(orderId: string) {
  const existing = await getOrderPublicFields(orderId);

  if (existing?.publicToken) {
    return existing.publicToken;
  }

  const publicToken = crypto.randomUUID();

  await prisma.$executeRaw`
    UPDATE "Order"
    SET "public_token" = ${publicToken}
    WHERE "id" = ${orderId}
      AND "public_token" IS NULL
  `;

  const current = await getOrderPublicFields(orderId);

  return current?.publicToken ?? publicToken;
}

export async function getOrderPublicFields(orderId: string) {
  const rows = await prisma.$queryRaw<Array<{
    customerEmail: string | null;
    orderEmailSentAt: Date | null;
    publicToken: string | null;
    receiptUrl: string | null;
  }>>`
    SELECT
      "customer_email" AS "customerEmail",
      "order_email_sent_at" AS "orderEmailSentAt",
      "public_token" AS "publicToken",
      "receipt_url" AS "receiptUrl"
    FROM "Order"
    WHERE "id" = ${orderId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function getOrderIdByPublicToken(publicToken: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Order"
    WHERE "public_token" = ${publicToken}
    LIMIT 1
  `;

  return rows[0]?.id ?? null;
}

export async function getOrderEmailLineItems(orderId: string) {
  const rows = await prisma.$queryRaw<Array<{
    itemId: string;
    menuItemName: string | null;
    modifierName: string | null;
    quantity: number;
  }>>`
    SELECT
      oi."id" AS "itemId",
      mi."name" AS "menuItemName",
      oim."name" AS "modifierName",
      oi."quantity" AS "quantity"
    FROM "OrderItem" oi
    LEFT JOIN "MenuItem" mi ON mi."id" = oi."menuItemId"
    LEFT JOIN "OrderItemModifier" oim ON oim."orderItemId" = oi."id"
    WHERE oi."orderId" = ${orderId}
    ORDER BY oi."id" ASC, oim."name" ASC
  `;

  const lineItemsById = new Map<string, OrderEmailLineItem>();

  for (const row of rows) {
    const existing = lineItemsById.get(row.itemId) ?? {
      menuItemName: row.menuItemName,
      modifiers: [],
      quantity: row.quantity,
    };

    if (row.modifierName) {
      existing.modifiers.push(row.modifierName);
    }

    lineItemsById.set(row.itemId, existing);
  }

  return [...lineItemsById.values()];
}

export async function updateOrderStripeReceiptFields(params: {
  customerEmail: string | null;
  orderId: string;
  receiptUrl: string | null;
  stripeCheckoutSessionId: string;
}) {
  await prisma.$executeRaw`
    UPDATE "Order"
    SET
      "customer_email" = COALESCE(${params.customerEmail}, "customer_email"),
      "receipt_url" = COALESCE(${params.receiptUrl}, "receipt_url"),
      "stripeCheckoutSessionId" = ${params.stripeCheckoutSessionId}
    WHERE "id" = ${params.orderId}
  `;
}

export async function markOrderEmailQueued(orderId: string) {
  await prisma.$executeRaw`
    UPDATE "Order"
    SET "order_email_sent_at" = COALESCE("order_email_sent_at", NOW())
    WHERE "id" = ${orderId}
  `;
}

import "server-only";

import { formatPrice } from "@/lib/format";
import {
  ensureOrderPublicToken,
  getOrderEmailLineItems,
  getOrderPublicFields,
  markOrderEmailQueued,
} from "@/lib/order-public-fields";
import { getResend } from "@/lib/resend";
import { getOrderEmailsEnabled } from "@/lib/store-settings";

export type OrderCreatedEventData = {
  customerEmail: string;
  customerName: string;
  displayOrderNumber: string;
  items: Array<{
    menuItemName: string | null;
    modifiers: string[];
    quantity: number;
  }>;
  orderId: string;
  receiptUrl: string | null;
  statusUrl: string;
  total: number;
};

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set.");
  }

  return appUrl;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderOrderItems(items: OrderCreatedEventData["items"]) {
  return items
    .map((item) => {
      const modifierNames = item.modifiers.map(escapeHtml).join(", ");
      const modifiers = modifierNames.length > 0 ? ` (${modifierNames})` : "";
      return `<li>${item.quantity} x ${escapeHtml(item.menuItemName ?? "Item")}${modifiers}</li>`;
    })
    .join("");
}

function renderOrderCreatedEmail(data: OrderCreatedEventData) {
  const receipt = data.receiptUrl
    ? `<p><a href="${data.receiptUrl}">View your Stripe receipt</a></p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #2b2420;">
      <h1 style="font-size: 22px;">Thanks for your order</h1>
      <p>Your queue number is <strong>#${escapeHtml(data.displayOrderNumber)}</strong>.</p>
      <p>Total: <strong>${formatPrice(data.total)}</strong></p>
      <ul>${renderOrderItems(data.items)}</ul>
      <p><a href="${data.statusUrl}">Track your order status</a></p>
      ${receipt}
    </div>
  `;
}

export async function sendOrderCreatedEmailWithResend(data: OrderCreatedEventData) {
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Milk Tea POS <onboarding@resend.dev>";
  const resend = getResend();

  const { error } = await resend.emails.send(
    {
      from,
      html: renderOrderCreatedEmail(data),
      subject: `Milk Tea order #${data.displayOrderNumber}`,
      to: data.customerEmail,
    },
    {
      headers: {
        "Idempotency-Key": `order-confirmation-${data.orderId}`,
      },
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function queueOrderCreatedNotification(order: {
  customerName: string;
  displayOrderNumber: string;
  id: string;
  total: { toString(): string } | number;
}) {
  if (!(await getOrderEmailsEnabled())) {
    return;
  }

  const publicFields = await getOrderPublicFields(order.id);

  if (!publicFields?.customerEmail || publicFields.orderEmailSentAt) {
    return;
  }

  const publicToken = await ensureOrderPublicToken(order.id);
  const data: OrderCreatedEventData = {
    customerEmail: publicFields.customerEmail,
    customerName: order.customerName,
    displayOrderNumber: order.displayOrderNumber,
    items: await getOrderEmailLineItems(order.id),
    orderId: order.id,
    receiptUrl: publicFields.receiptUrl,
    statusUrl: `${getAppUrl()}/status/${publicToken}`,
    total: typeof order.total === "number" ? order.total : Number(order.total),
  };

  try {
    await sendOrderCreatedEmailWithResend(data);
    await markOrderEmailQueued(order.id);
  } catch (error) {
    console.warn(
      "[order-email] failed to send order confirmation",
      error instanceof Error ? error.message : error,
    );
  }
}

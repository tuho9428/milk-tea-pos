import type { PaymentStatus } from "@/lib/payment";

export type AdminOrderStatus =
  | "PENDING"
  | "PAID"
  | "MAKING"
  | "READY"
  | "COMPLETED"
  | "CANCELED";

export type AdminOrderListItem = {
  id: string;
  displayOrderNumber: string;
  customerName: string;
  phone: string;
  notes: string | null;
  status: AdminOrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  taxRateApplied: number;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    menuItemName: string | null;
    modifiers: Array<{
      id: string;
      name: string;
      priceDelta: number;
    }>;
  }>;
};

type OrderWithItems = {
  id: string;
  displayOrderNumber: string;
  customerName: string;
  phone: string;
  notes: string | null;
  status: string;
  paymentStatus: PaymentStatus;
  paymentProvider: string;
  paidAt: Date | null;
  subtotal: { toString(): string } | number;
  tax: { toString(): string } | number;
  taxRateApplied: { toString(): string } | number;
  total: { toString(): string } | number;
  createdAt: Date;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: { toString(): string } | number;
    menuItem: {
      name: string;
    } | null;
    modifiers: Array<{
      id: string;
      name: string;
      priceDelta: { toString(): string } | number;
    }>;
  }>;
};

function toNumber(value: { toString(): string } | number) {
  return typeof value === "number" ? value : Number(value);
}

export function serializeAdminOrder(order: OrderWithItems): AdminOrderListItem {
  return {
    id: order.id,
    displayOrderNumber: order.displayOrderNumber,
    customerName: order.customerName,
    phone: order.phone,
    notes: order.notes,
    status: order.status as AdminOrderStatus,
    paymentStatus: order.paymentStatus,
    subtotal: toNumber(order.subtotal),
    tax: toNumber(order.tax),
    taxRateApplied: toNumber(order.taxRateApplied),
    total: toNumber(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      menuItemName: item.menuItem?.name ?? null,
      modifiers: item.modifiers.map((modifier) => ({
        id: modifier.id,
        name: modifier.name,
        priceDelta: toNumber(modifier.priceDelta),
      })),
    })),
  };
}

export function serializeBoardOrder(order: OrderWithItems) {
  return {
    id: order.id,
    displayOrderNumber: order.displayOrderNumber,
    customerName: order.customerName,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    total: toNumber(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      quantity: item.quantity,
      menuItemName: item.menuItem?.name ?? null,
      modifiers: item.modifiers.map((modifier) => modifier.name),
    })),
  };
}

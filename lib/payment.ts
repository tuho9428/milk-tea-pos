export const paymentStatuses = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pending payment",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  CANCELLED: "Payment cancelled",
  EXPIRED: "Payment expired",
};

const paymentStatusVariants: Record<PaymentStatus, "default" | "primary" | "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "destructive",
  REFUNDED: "default",
  CANCELLED: "destructive",
  EXPIRED: "destructive",
};

export function formatPaymentStatusLabel(status: PaymentStatus) {
  return paymentStatusLabels[status];
}

export function getPaymentStatusVariant(status: PaymentStatus) {
  return paymentStatusVariants[status];
}

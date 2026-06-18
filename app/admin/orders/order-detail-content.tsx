import Link from "next/link";

import { updateOrderStatusAction } from "@/app/admin/orders/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatTaxRate } from "@/lib/format";
import { formatPaymentStatusLabel, getPaymentStatusVariant } from "@/lib/payment";
import { cn } from "@/lib/utils";

const editableStatuses = ["PENDING", "MAKING", "READY", "COMPLETED", "CANCELED"] as const;
type EditableStatus = (typeof editableStatuses)[number];

const statusVariants = {
  PENDING: "warning",
  PAID: "primary",
  MAKING: "primary",
  READY: "success",
  COMPLETED: "default",
  CANCELED: "destructive",
} as const;

type AdminOrderDetail = Awaited<ReturnType<typeof import("./order-detail-data").getAdminOrderDetail>>;
type ResolvedAdminOrderDetail = NonNullable<AdminOrderDetail>;

type OrderDetailContentProps = {
  order: ResolvedAdminOrderDetail;
  mode?: "page" | "modal";
};

function formatStatusLabel(status: keyof typeof statusVariants) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isEditableStatus(status: string): status is EditableStatus {
  return editableStatuses.includes(status as EditableStatus);
}

export function OrderDetailContent({
  order,
  mode = "page",
}: OrderDetailContentProps) {
  const isModal = mode === "modal";

  return (
    <div className={cn("space-y-6", isModal && "max-h-[85vh] overflow-y-auto pr-1")}>
      <Card className="hero-panel">
        <CardHeader className="relative z-10 border-b border-border">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Admin Order Detail</p>
              <CardTitle className="mt-2 page-title text-[2.15rem]">
                Order #{order.displayOrderNumber}
              </CardTitle>
              <CardDescription>
                Review customer info, totals, and all item modifiers.
              </CardDescription>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant={statusVariants[order.status]}>
                {formatStatusLabel(order.status)}
              </Badge>
              <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                {formatPaymentStatusLabel(order.paymentStatus)}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Items</CardTitle>
            <p className="text-sm text-muted-foreground">
              {order.items.length} item{order.items.length === 1 ? "" : "s"}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {order.items.map((item) => (
            <section key={item.id} className="soft-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {item.quantity}x {item.menuItem?.name ?? "Menu item unavailable"}
                  </h2>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>Unit Price: {formatPrice(Number(item.unitPrice))}</p>
                    <p>Line Total: {formatPrice(Number(item.unitPrice) * item.quantity)}</p>
                  </div>
                </div>
              </div>

              {item.modifiers.length > 0 ? (
                <ul className="mt-3 space-y-1 pl-4 text-sm text-muted-foreground">
                  {item.modifiers.map((modifier) => (
                    <li key={modifier.id}>- {modifier.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 pl-4 text-sm text-muted-foreground">No modifiers selected.</p>
              )}
            </section>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Order Notes</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-foreground">
            {order.notes?.trim() || "No notes provided."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Customer Info</CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="soft-panel p-4">
              <p className="eyebrow">Customer Name</p>
              <p className="mt-2 text-sm font-medium text-foreground">{order.customerName}</p>
            </div>
            <div className="soft-panel p-4">
              <p className="eyebrow">Phone</p>
              <p className="mt-2 text-sm text-foreground">{order.phone}</p>
            </div>
            <div className="soft-panel p-4">
              <p className="eyebrow">Created</p>
              <p className="mt-2 text-sm text-foreground">
                {formatTimestamp(order.createdAt)}
              </p>
            </div>
            <div className="soft-panel p-4">
              <p className="eyebrow">Status</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Badge variant={statusVariants[order.status]}>
                  {formatStatusLabel(order.status)}
                </Badge>
                <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                  {formatPaymentStatusLabel(order.paymentStatus)}
                </Badge>
                <form action={updateOrderStatusAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select
                    name="status"
                    defaultValue={isEditableStatus(order.status) ? order.status : "PENDING"}
                    className="field-select h-10 pr-10"
                    aria-label="Update order status"
                  >
                    {editableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                    Update
                  </button>
                </form>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {order.paidAt
                  ? `Paid on ${formatTimestamp(order.paidAt)} via ${order.paymentProvider}`
                  : `Payment provider: ${order.paymentProvider}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Pricing</CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="soft-panel p-4">
              <p className="eyebrow">Subtotal</p>
              <p className="mt-2 text-sm text-foreground">
                {formatPrice(Number(order.subtotal))}
              </p>
            </div>
            <div className="soft-panel p-4">
              <p className="eyebrow">Tax</p>
              <p className="mt-2 text-sm text-foreground">{formatPrice(Number(order.tax))}</p>
            </div>
            <div className="soft-panel p-4">
              <p className="eyebrow">Total</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatPrice(Number(order.total))}
              </p>
            </div>
            <div className="soft-panel p-4">
              <p className="eyebrow">Tax Rate</p>
              <p className="mt-2 text-sm text-foreground">
                {formatTaxRate(Number(order.taxRateApplied))}
              </p>
            </div>
          </div>

          {isModal ? (
            <div className="mt-5">
              <Link
                href={`/admin/orders/${order.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Open Full Detail Page
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

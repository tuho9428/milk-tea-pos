import Link from "next/link";
import type { ComponentProps } from "react";

import { updateOrderStatusAction } from "@/app/admin/orders/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice, formatTaxRate } from "@/lib/format";
import { cn } from "@/lib/utils";

const editableStatuses = ["PENDING", "MAKING", "READY", "COMPLETED", "CANCELED"] as const;

const statusStyles = {
  PENDING: "bg-amber-300/20 text-amber-700 ring-1 ring-amber-400/30",
  PAID: "bg-sky-300/20 text-sky-700 ring-1 ring-sky-400/30",
  MAKING: "bg-violet-300/20 text-violet-700 ring-1 ring-violet-400/30",
  READY: "bg-emerald-300/20 text-emerald-700 ring-1 ring-emerald-400/30",
  COMPLETED: "bg-stone-300/40 text-stone-700 ring-1 ring-stone-400/30",
  CANCELED: "bg-red-300/20 text-red-700 ring-1 ring-red-400/30",
} as const;

type AdminOrderDetail = Awaited<ReturnType<typeof import("./order-detail-data").getAdminOrderDetail>>;
type ResolvedAdminOrderDetail = NonNullable<AdminOrderDetail>;

type OrderDetailContentProps = {
  order: ResolvedAdminOrderDetail;
  mode?: "page" | "modal";
};

function formatStatusLabel(status: keyof typeof statusStyles) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function OrderDetailContent({
  order,
  mode = "page",
}: OrderDetailContentProps) {
  const isModal = mode === "modal";

  return (
    <div className={cn("space-y-6", isModal && "max-h-[85vh] overflow-y-auto pr-1")}>
      <Card className="border border-stone-200 bg-white py-0">
        <CardHeader className="border-b border-stone-200 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-stone-500">
                ADMIN ORDER DETAIL
              </p>
              <CardTitle className="mt-2 text-3xl font-bold text-stone-900">
                Order #{order.displayOrderNumber}
              </CardTitle>
              <CardDescription className="mt-1 text-stone-600">
                Review customer info, totals, and all item modifiers.
              </CardDescription>
            </div>
            <Badge className={statusStyles[order.status]}>
              {formatStatusLabel(order.status)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card className="border border-stone-200 bg-white py-0">
        <CardHeader className="border-b border-stone-200 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl font-semibold text-stone-900">
              Items
            </CardTitle>
            <p className="text-sm text-stone-500">
              {order.items.length} item{order.items.length === 1 ? "" : "s"}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6 py-6">
          {order.items.map((item) => (
            <section
              key={item.id}
              className="rounded-xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    {item.quantity}x {item.menuItem?.name ?? "Menu item unavailable"}
                  </h2>
                  <div className="mt-2 space-y-1 text-sm text-stone-600">
                    <p>Unit Price: {formatPrice(Number(item.unitPrice))}</p>
                    <p>Line Total: {formatPrice(Number(item.unitPrice) * item.quantity)}</p>
                  </div>
                </div>
              </div>

              {item.modifiers.length > 0 ? (
                <ul className="mt-3 space-y-1 pl-4 text-sm text-stone-600">
                  {item.modifiers.map((modifier) => (
                    <li key={modifier.id}>• {modifier.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 pl-4 text-sm text-stone-500">No modifiers selected.</p>
              )}
            </section>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-stone-200 bg-white py-0">
        <CardHeader className="border-b border-stone-200 px-6 py-5">
          <CardTitle className="text-xl font-semibold text-stone-900">
            Order Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <p className="text-sm text-stone-900">
            {order.notes?.trim() || "No notes provided."}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-stone-200 bg-white py-0">
        <CardHeader className="border-b border-stone-200 px-6 py-5">
          <CardTitle className="text-xl font-semibold text-stone-900">
            Customer Info
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Customer Name
              </p>
              <p className="mt-1 text-sm font-medium text-stone-900">
                {order.customerName}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Phone
              </p>
              <p className="mt-1 text-sm text-stone-900">{order.phone}</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Created
              </p>
              <p className="mt-1 text-sm text-stone-900">
                {formatTimestamp(order.createdAt)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Status
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Badge className={statusStyles[order.status]}>
                  {formatStatusLabel(order.status)}
                </Badge>
                <form
                  action={updateOrderStatusAction}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <select
                    name="status"
                    defaultValue={
                      editableStatuses.includes(order.status) ? order.status : "PENDING"
                    }
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                    aria-label="Update order status"
                  >
                    {editableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
                  >
                    Update
                  </button>
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-stone-200 bg-white py-0">
        <CardHeader className="border-b border-stone-200 px-6 py-5">
          <CardTitle className="text-xl font-semibold text-stone-900">
            Pricing
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Subtotal
              </p>
              <p className="mt-1 text-sm text-stone-900">
                {formatPrice(Number(order.subtotal))}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Tax
              </p>
              <p className="mt-1 text-sm text-stone-900">
                {formatPrice(Number(order.tax))}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Total
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">
                {formatPrice(Number(order.total))}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Tax Rate
              </p>
              <p className="mt-1 text-sm text-stone-900">
                {formatTaxRate(Number(order.taxRateApplied))}
              </p>
            </div>
          </div>

          {isModal ? (
            <div className="mt-5">
              <Link
                href={`/admin/orders/${order.id}`}
                className="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
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

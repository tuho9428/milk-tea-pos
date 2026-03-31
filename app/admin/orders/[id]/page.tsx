import Link from "next/link";
import { notFound } from "next/navigation";
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
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const editableStatuses = ["PENDING", "MAKING", "READY", "COMPLETED", "CANCELED"] as const;

const statusStyles = {
  PENDING: "bg-amber-300/20 text-amber-200 ring-1 ring-amber-400/30",
  PAID: "bg-sky-300/20 text-sky-200 ring-1 ring-sky-400/30",
  MAKING: "bg-violet-300/20 text-violet-200 ring-1 ring-violet-400/30",
  READY: "bg-emerald-300/20 text-emerald-200 ring-1 ring-emerald-400/30",
  COMPLETED: "bg-stone-300/20 text-stone-100 ring-1 ring-stone-400/30",
  CANCELED: "bg-red-300/20 text-red-200 ring-1 ring-red-400/30",
} as const;

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
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

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
            },
          },
          modifiers: {
            orderBy: {
              name: "asc",
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
            Back to Orders
          </Link>
        </div>

        <Card className="border border-stone-200 bg-white py-0">
          <CardHeader className="border-b border-stone-200 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-stone-500">
                  ADMIN ORDER DETAIL
                </p>
                <CardTitle className="mt-2 text-3xl font-bold text-stone-900">
                  Order {order.id}
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
                  <form action={updateOrderStatusAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <select
                      name="status"
                      defaultValue={editableStatuses.includes(order.status) ? order.status : "PENDING"}
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
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Notes
                </p>
                <p className="mt-1 text-sm text-stone-900">
                  {order.notes?.trim() || "No notes provided."}
                </p>
              </div>
            </div>
          </CardContent>
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
                      {item.menuItem?.name ?? "Menu item unavailable"}
                    </h2>
                    <div className="mt-2 space-y-1 text-sm text-stone-600">
                      <p>Quantity: {item.quantity}</p>
                      <p>Unit Price: {formatPrice(Number(item.unitPrice))}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">
                    Line Total: {formatPrice(Number(item.unitPrice) * item.quantity)}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Modifiers
                  </p>
                  {item.modifiers.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {item.modifiers.map((modifier) => (
                        <li
                          key={modifier.id}
                          className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                        >
                          <span className="text-stone-700">{modifier.name}</span>
                          <span className="text-stone-500">
                            {Number(modifier.priceDelta) === 0
                              ? formatPrice(0)
                              : `+${formatPrice(Number(modifier.priceDelta))}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-stone-500">No modifiers selected.</p>
                  )}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

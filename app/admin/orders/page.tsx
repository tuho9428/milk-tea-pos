import Link from "next/link";
import type { ComponentProps } from "react";

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

const statusStyles = {
  PENDING: "bg-amber-300/20 text-amber-200 ring-1 ring-amber-400/30",
  PAID: "bg-sky-300/20 text-sky-200 ring-1 ring-sky-400/30",
  MAKING: "bg-violet-300/20 text-violet-200 ring-1 ring-violet-400/30",
  READY: "bg-emerald-300/20 text-emerald-200 ring-1 ring-emerald-400/30",
  COMPLETED: "bg-stone-300/20 text-stone-100 ring-1 ring-stone-400/30",
  CANCELED: "bg-red-300/20 text-red-200 ring-1 ring-red-400/30",
} as const;

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

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader(props: ComponentProps<"thead">) {
  return <thead className="[&_tr]:border-b [&_tr]:border-stone-200" {...props} />;
}

function TableBody(props: ComponentProps<"tbody">) {
  return <tbody className="[&_tr:last-child]:border-0" {...props} />;
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-stone-200 transition-colors", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-semibold tracking-wide text-stone-500 uppercase",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("align-top px-4 py-4", className)} {...props} />;
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
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

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border border-stone-200 bg-white py-0">
          <CardHeader className="border-b border-stone-200 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-stone-500">
                  ADMIN
                </p>
                <CardTitle className="mt-2 text-3xl font-bold text-stone-900">
                  Orders
                </CardTitle>
                <CardDescription className="mt-1 text-stone-600">
                  Newest orders first, with subtotal, tax, total, and item details.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/menu"
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
                >
                  Manage Menu
                </Link>
                <Link
                  href="/menu"
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
                >
                  Customer Menu
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>

        {orders.length === 0 ? (
          <Card className="border border-dashed border-stone-300 bg-white py-0">
            <CardContent className="px-6 py-16 text-center">
              <h2 className="text-xl font-semibold text-stone-900">No orders yet</h2>
              <p className="mt-2 text-sm text-stone-500">
                When customers place orders, they&apos;ll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-stone-200 bg-white py-0">
            <CardHeader className="border-b border-stone-200 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl font-semibold text-stone-900">
                  Incoming Orders
                </CardTitle>
                <p className="text-sm text-stone-500">
                  {orders.length} order{orders.length === 1 ? "" : "s"}
                </p>
              </div>
            </CardHeader>

            <CardContent className="px-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[220px]">Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="min-w-[360px]">Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-stone-50/80">
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="block rounded-lg p-1 transition-colors hover:bg-stone-100"
                        >
                          <div className="space-y-2">
                            <p className="font-mono text-xs text-stone-500">{order.id}</p>
                            <div>
                              <p className="text-sm font-medium text-stone-900">
                                {order.customerName}
                              </p>
                              <p className="text-sm text-stone-500">{order.phone}</p>
                            </div>
                            <p className="text-xs text-stone-500">
                              {order.notes?.trim() || "No notes provided."}
                            </p>
                            <p className="text-xs font-medium text-stone-600">
                              View details
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge className={statusStyles[order.status]}>
                            {formatStatusLabel(order.status)}
                          </Badge>
                          <p className="text-xs text-stone-500">
                            Tax rate: {formatTaxRate(Number(order.taxRateApplied))}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-stone-600">
                            Subtotal: {formatPrice(Number(order.subtotal))}
                          </p>
                          <p className="text-sm text-stone-600">
                            Tax: {formatPrice(Number(order.tax))}
                          </p>
                          <p className="font-semibold text-stone-900">
                            Total: {formatPrice(Number(order.total))}
                          </p>
                          <p className="text-xs text-stone-500">
                            {order.items.length} item{order.items.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-stone-600">
                          {formatTimestamp(order.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-stone-900">
                                    {item.menuItem?.name ?? "Menu item unavailable"}
                                  </p>
                                  <p className="mt-1 text-sm text-stone-500">
                                    Qty {item.quantity} · Unit {formatPrice(Number(item.unitPrice))}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-stone-700">
                                  {formatPrice(Number(item.unitPrice) * item.quantity)}
                                </p>
                              </div>

                              {item.modifiers.length > 0 ? (
                                <ul className="mt-2 space-y-1 text-sm text-stone-500">
                                  {item.modifiers.map((modifier) => (
                                    <li key={modifier.id} className="flex justify-between gap-3">
                                      <span>{modifier.name}</span>
                                      <span>
                                        {Number(modifier.priceDelta) === 0
                                          ? formatPrice(0)
                                          : `+${formatPrice(Number(modifier.priceDelta))}`}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 text-sm text-stone-400">
                                  No modifiers selected.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

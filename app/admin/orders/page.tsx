import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, formatTaxRate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const statusVariants = {
  PENDING: "warning",
  PAID: "primary",
  MAKING: "primary",
  READY: "success",
  COMPLETED: "default",
  CANCELED: "destructive",
} as const;

function formatStatusLabel(status: keyof typeof statusVariants) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
    <main className="page-shell">
      <div className="page-wrap-wide">
        <section className="hero-panel px-6 py-7 sm:px-8">
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="eyebrow">Admin</p>
              <h1 className="page-title">Orders</h1>
              <p className="page-description">
                Newest orders first, with totals, notes, and item-level customization detail.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className={cn(buttonVariants({ size: "sm" }))}>
                Dashboard
              </Link>
              <Link
                href="/admin/orders/board"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Orders Board
              </Link>
              <Link
                href="/admin/menu"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Manage Menu
              </Link>
              <Link
                href="/menu"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                Customer Menu
              </Link>
            </div>
          </div>
        </section>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="text-xl font-semibold text-foreground">No orders yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                When customers place orders, they&apos;ll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="table-shell">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Order Feed</p>
                  <CardTitle className="mt-2">Incoming orders</CardTitle>
                  <CardDescription>
                    {orders.length} order{orders.length === 1 ? "" : "s"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0 pb-0 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="min-w-[360px]">Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="table-row-soft">
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="block rounded-xl p-1 transition hover:bg-primary-soft/40"
                        >
                          <div className="space-y-2">
                            <p className="font-mono text-xs text-muted-foreground">
                              #{order.displayOrderNumber}
                            </p>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {order.customerName}
                              </p>
                              <p className="text-sm text-muted-foreground">{order.phone}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {order.notes?.trim() || "No notes provided."}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge variant={statusVariants[order.status]}>
                            {formatStatusLabel(order.status)}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Tax rate: {formatTaxRate(Number(order.taxRateApplied))}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Subtotal: {formatPrice(Number(order.subtotal))}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tax: {formatPrice(Number(order.tax))}
                          </p>
                          <p className="font-semibold text-foreground">
                            Total: {formatPrice(Number(order.total))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} item{order.items.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(order.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="soft-panel p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-foreground">
                                    {item.menuItem?.name ?? "Menu item unavailable"}
                                  </p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Qty {item.quantity} · Unit {formatPrice(Number(item.unitPrice))}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                  {formatPrice(Number(item.unitPrice) * item.quantity)}
                                </p>
                              </div>

                              {item.modifiers.length > 0 ? (
                                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
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
                                <p className="mt-2 text-sm text-muted-foreground">
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

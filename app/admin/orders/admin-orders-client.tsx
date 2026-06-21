"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { fetchRealtimeOrder } from "@/app/admin/orders/realtime-order-client";
import type { AdminOrderListItem, AdminOrderStatus } from "@/app/admin/orders/order-serializers";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, formatTaxRate } from "@/lib/format";
import { formatPaymentStatusLabel, getPaymentStatusVariant } from "@/lib/payment";
import { cn } from "@/lib/utils";
import { useRealtimeOrders, type RealtimeOrderEvent } from "@/hooks/use-realtime-orders";

const statusVariants = {
  PENDING: "warning",
  PAID: "primary",
  MAKING: "primary",
  READY: "success",
  COMPLETED: "default",
  CANCELED: "destructive",
} as const;

type AdminOrdersClientProps = {
  initialOrders: AdminOrderListItem[];
};

function formatStatusLabel(status: AdminOrderStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatTimestamp(dateInput: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateInput));
}

function sortNewestFirst(orders: AdminOrderListItem[]) {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function AdminOrdersClient({ initialOrders }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleRealtimeOrder = useCallback(async (event: RealtimeOrderEvent) => {
    const payload = await fetchRealtimeOrder(event.order.id);

    setOrders((current) => {
      if (!payload.order) {
        return current.filter((order) => order.id !== event.order.id);
      }

      const nextOrders = current.some((order) => order.id === payload.order?.id)
        ? current.map((order) => (order.id === payload.order?.id ? payload.order : order))
        : [payload.order, ...current];

      return sortNewestFirst(nextOrders);
    });
  }, []);

  useRealtimeOrders({
    onOrderChange: handleRealtimeOrder,
  });

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground">No orders yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When customers place orders, they&apos;ll appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
              <TableHead className="w-[120px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="table-row-soft">
                <TableCell>
                  <div className="space-y-2 rounded-xl p-1">
                    <p className="font-mono text-xs text-muted-foreground">
                      #{order.displayOrderNumber}
                    </p>
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.notes?.trim() || "No notes provided."}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge variant={statusVariants[order.status]}>
                      {formatStatusLabel(order.status)}
                    </Badge>
                    <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                      {formatPaymentStatusLabel(order.paymentStatus)}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Tax rate: {formatTaxRate(order.taxRateApplied)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Subtotal: {formatPrice(order.subtotal)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tax: {formatPrice(order.tax)}
                    </p>
                    <p className="font-semibold text-foreground">
                      Total: {formatPrice(order.total)}
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
                              {item.menuItemName ?? "Menu item unavailable"}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Qty {item.quantity} - Unit {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                        </div>

                        {item.modifiers.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {item.modifiers.map((modifier) => (
                              <li key={modifier.id} className="flex justify-between gap-3">
                                <span>{modifier.name}</span>
                                <span>
                                  {modifier.priceDelta === 0
                                    ? formatPrice(0)
                                    : `+${formatPrice(modifier.priceDelta)}`}
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
                <TableCell className="text-right">
                  <Link
                    href={`/admin/orders?order=${order.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "whitespace-nowrap",
                    )}
                    scroll={false}
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

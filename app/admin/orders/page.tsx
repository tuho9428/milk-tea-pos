import Link from "next/link";

import { AdminOrdersClient } from "@/app/admin/orders/admin-orders-client";
import { HardNavigationButton } from "@/app/admin/orders/hard-navigation-button";
import { OrderDetailContent } from "@/app/admin/orders/order-detail-content";
import { getAdminOrderDetail } from "@/app/admin/orders/order-detail-data";
import { OrderModalShell } from "@/app/admin/orders/order-modal-shell";
import { serializeAdminOrder } from "@/app/admin/orders/order-serializers";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminOrdersPageProps = {
  searchParams?: Promise<{
    order?: string;
  }>;
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeOrderId = resolvedSearchParams?.order?.trim() || null;

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
  const activeOrder = activeOrderId
    ? await getAdminOrderDetail(activeOrderId).catch(() => null)
    : null;
  const serializedOrders = orders.map(serializeAdminOrder);

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
              <HardNavigationButton
                href="/admin/orders/board"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Orders Board
              </HardNavigationButton>
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

        <AdminOrdersClient initialOrders={serializedOrders} />
      </div>

      {activeOrderId ? (
        <OrderModalShell closeHref="/admin/orders">
          {activeOrder ? (
            <OrderDetailContent order={activeOrder} mode="modal" />
          ) : (
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle>Order Not Found</CardTitle>
                <CardDescription>
                  This order is unavailable or could not be loaded.
                </CardDescription>
              </CardHeader>
              <div className="px-6 py-6">
                <Link
                  href="/admin/orders"
                  className={cn(buttonVariants({ size: "sm" }))}
                  scroll={false}
                >
                  Back to Orders
                </Link>
              </div>
            </Card>
          )}
        </OrderModalShell>
      ) : null}
    </main>
  );
}

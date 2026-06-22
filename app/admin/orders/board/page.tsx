import Link from "next/link";

import { OrderDetailContent } from "@/app/admin/orders/order-detail-content";
import { getAdminOrderDetail } from "@/app/admin/orders/order-detail-data";
import { OrderModalShell } from "@/app/admin/orders/order-modal-shell";
import { serializeBoardOrder } from "@/app/admin/orders/order-serializers";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { OrdersBoardClient, type BoardColumnStatus, type BoardOrder } from "./orders-board-client";

const boardColumns: Array<{
  status: BoardColumnStatus;
  title: string;
  tone: string;
  badgeTone: "new" | "progress" | "ready" | "completed";
}> = [
  {
    status: "PENDING",
    title: "New",
    tone: "border-[hsl(34_28%_83%)] bg-[hsl(38_30%_94%/0.72)]",
    badgeTone: "new",
  },
  {
    status: "MAKING",
    title: "In Progress",
    tone: "border-[hsl(43_32%_80%)] bg-[hsl(42_34%_92%/0.74)]",
    badgeTone: "progress",
  },
  {
    status: "READY",
    title: "Ready",
    tone: "border-[hsl(146_20%_82%)] bg-[hsl(144_22%_93%/0.75)]",
    badgeTone: "ready",
  },
  {
    status: "COMPLETED",
    title: "Completed",
    tone: "border-[hsl(118_12%_83%)] bg-[hsl(108_11%_92%/0.72)]",
    badgeTone: "completed",
  },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminOrdersBoardPageProps = {
  searchParams?: Promise<{
    order?: string;
  }>;
};

export default async function AdminOrdersBoardPage({
  searchParams,
}: AdminOrdersBoardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeOrderId = resolvedSearchParams?.order?.trim() || null;
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      status: {
        in: boardColumns.map((column) => column.status),
      },
    },
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

  const serializedOrders: BoardOrder[] = orders.map((order) => ({
    ...serializeBoardOrder(order),
    status: order.status as BoardColumnStatus,
  }));

  return (
    <main className="page-shell">
      <div className="page-wrap-wide space-y-6">
        <section className="hero-panel px-6 py-7 sm:px-8">
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="eyebrow">Kitchen Workflow</p>
              <h1 className="page-title">Orders Board</h1>
              <p className="page-description">
                Active orders grouped by status for a calmer, clearer kitchen handoff.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className={cn(buttonVariants({ size: "sm" }))}>
                Dashboard
              </Link>
              <Link
                href="/admin/orders"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Orders List
              </Link>
              <Link
                href="/admin/menu"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Manage Menu
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[calc(var(--radius)*1.25)] border border-border bg-card/55 p-4 shadow-[0_12px_30px_rgba(31,26,23,0.04)] sm:p-5">
          <OrdersBoardClient columns={boardColumns} initialOrders={serializedOrders} />
        </section>
      </div>

      {activeOrderId ? (
        <OrderModalShell closeHref="/admin/orders/board">
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
                  href="/admin/orders/board"
                  className={cn(buttonVariants({ size: "sm" }))}
                  scroll={false}
                >
                  Back to Board
                </Link>
              </div>
            </Card>
          )}
        </OrderModalShell>
      ) : null}
    </main>
  );
}

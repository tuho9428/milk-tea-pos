import Link from "next/link";
import { OrderDetailContent } from "@/app/admin/orders/order-detail-content";
import { getAdminOrderDetail } from "@/app/admin/orders/order-detail-data";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { OrdersBoardClient, type BoardColumnStatus, type BoardOrder } from "./orders-board-client";

const boardColumns: Array<{
  status: BoardColumnStatus;
  title: string;
  tone: string;
}> = [
  {
    status: "PENDING",
    title: "Pending",
    tone: "border-amber-200 bg-amber-50",
  },
  {
    status: "MAKING",
    title: "Making",
    tone: "border-violet-200 bg-violet-50",
  },
  {
    status: "READY",
    title: "Ready",
    tone: "border-emerald-200 bg-emerald-50",
  },
  {
    status: "COMPLETED",
    title: "Completed",
    tone: "border-stone-200 bg-stone-100",
  },
];

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
    id: order.id,
    customerName: order.customerName,
    status: order.status as BoardColumnStatus,
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      quantity: item.quantity,
      menuItemName: item.menuItem?.name ?? null,
      modifiers: item.modifiers.map((modifier) => modifier.name),
    })),
  }));

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
                  Orders Board
                </CardTitle>
                <CardDescription className="mt-1 text-stone-600">
                  Active orders grouped by status for quick kitchen workflow updates.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/orders"
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
                >
                  Orders List
                </Link>
                <Link
                  href="/admin/menu"
                  className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
                >
                  Manage Menu
                </Link>
              </div>
            </div>
          </CardHeader>
        </Card>

        <OrdersBoardClient
          columns={boardColumns}
          initialOrders={serializedOrders}
        />
      </div>

      {activeOrder ? (
        <div className="fixed inset-0 z-50 bg-stone-950/60 px-4 py-6 backdrop-blur-sm">
          <Link
            href="/admin/orders/board"
            className="absolute inset-0"
            aria-label="Close order details"
            scroll={false}
          />

          <div className="relative mx-auto max-w-5xl">
            <div className="mb-3 flex justify-end">
              <Link
                href="/admin/orders/board"
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
                scroll={false}
              >
                Close
              </Link>
            </div>

            <OrderDetailContent order={activeOrder} mode="modal" />
          </div>
        </div>
      ) : null}
    </main>
  );
}

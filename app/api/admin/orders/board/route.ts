import { NextResponse } from "next/server";

import { serializeBoardOrder } from "@/app/admin/orders/order-serializers";
import type { BoardColumnStatus, BoardOrder } from "@/app/admin/orders/board/orders-board-client";
import { prisma } from "@/lib/prisma";

const boardColumnStatuses: BoardColumnStatus[] = ["PENDING", "MAKING", "READY", "COMPLETED"];

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      status: {
        in: boardColumnStatuses,
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

  const boardOrders: BoardOrder[] = orders.map((order) => ({
    ...serializeBoardOrder(order),
    status: order.status as BoardColumnStatus,
  }));

  return NextResponse.json({
    orders: boardOrders,
  });
}

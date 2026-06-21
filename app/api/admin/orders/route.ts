import { NextResponse } from "next/server";

import { serializeAdminOrder } from "@/app/admin/orders/order-serializers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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

  return NextResponse.json({
    orders: orders.map(serializeAdminOrder),
  });
}

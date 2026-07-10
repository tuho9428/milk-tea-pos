import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type OrderStatusRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: OrderStatusRouteProps) {
  const { id } = await params;
  const orderId = id.trim();

  if (!orderId) {
    return NextResponse.json({ error: "Order id is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paidAt: true,
      paymentStatus: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: order.id,
      paidAt: order.paidAt?.toISOString() ?? null,
      paymentStatus: order.paymentStatus,
      status: order.status,
      updatedAt: order.updatedAt.toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

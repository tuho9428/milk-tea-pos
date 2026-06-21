import { NextResponse } from "next/server";

import { getAdminOrderDetail } from "@/app/admin/orders/order-detail-data";
import { serializeAdminOrder, serializeBoardOrder } from "@/app/admin/orders/order-serializers";

export const dynamic = "force-dynamic";

type AdminOrderApiRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: AdminOrderApiRouteContext) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  if (!order) {
    return NextResponse.json({ order: null, boardOrder: null }, { status: 404 });
  }

  return NextResponse.json({
    order: serializeAdminOrder(order),
    boardOrder: serializeBoardOrder(order),
  });
}

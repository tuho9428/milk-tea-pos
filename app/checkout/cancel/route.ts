import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set.");
  }

  return appUrl;
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")?.trim();

  if (!orderId) {
    return NextResponse.redirect(new URL("/checkout?payment=canceled", getAppUrl()));
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    return NextResponse.redirect(new URL("/checkout?payment=canceled", getAppUrl()));
  }

  if (order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "CANCELED",
        paidAt: null,
      },
    });
  }

  revalidatePath("/checkout");
  revalidatePath(`/order/${order.id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/board");
  revalidatePath(`/admin/orders/${order.id}`);

  return NextResponse.redirect(
    new URL(`/checkout?payment=canceled&orderId=${encodeURIComponent(order.id)}`, getAppUrl()),
  );
}

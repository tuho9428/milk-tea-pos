import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PENDING", "MAKING", "READY", "COMPLETED", "CANCELED"]),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = updateOrderStatusSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status update payload." }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: {
      status: parsed.data.status,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/board");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);

  return NextResponse.json({ ok: true });
}

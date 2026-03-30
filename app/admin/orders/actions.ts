"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const updatableStatuses = ["PENDING", "MAKING", "READY", "COMPLETED", "CANCELED"] as const;

const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(updatableStatuses),
});

export async function updateOrderStatusAction(formData: FormData) {
  const parsed = updateOrderStatusSchema.parse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  await prisma.order.update({
    where: { id: parsed.orderId },
    data: {
      status: parsed.status,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.orderId}`);
}

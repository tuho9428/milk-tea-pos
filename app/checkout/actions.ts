"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { calculateCartSubtotal, getMockCart } from "@/lib/mock-cart";
import { prisma } from "@/lib/prisma";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  notes: z.string().trim().optional(),
});

export async function createOrderAction(formData: FormData) {
  const parsed = checkoutSchema.parse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    notes: formData.get("notes") || undefined,
  });

  const cartItems = await getMockCart();

  if (cartItems.length === 0) {
    throw new Error("Cannot place an order with an empty cart.");
  }

  const subtotal = calculateCartSubtotal(cartItems);

  const order = await prisma.order.create({
    data: {
      customerName: parsed.customerName,
      phone: parsed.phone,
      notes: parsed.notes || null,
      status: "PENDING",
      subtotal,
      total: subtotal,
      items: {
        create: cartItems.map((item) => {
          const modifierTotal = item.selectedModifiers.reduce(
            (sum, modifier) => sum + modifier.priceDelta,
            0,
          );

          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.basePrice + modifierTotal,
            modifiers: {
              create: item.selectedModifiers.map((modifier) => ({
                name: modifier.name,
                priceDelta: modifier.priceDelta,
              })),
            },
          };
        }),
      },
    },
    select: { id: true },
  });

  redirect(`/order/${order.id}`);
}

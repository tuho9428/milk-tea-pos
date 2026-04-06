"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { calculateCartSubtotal, type CartItem } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { getStoreTaxRate } from "@/lib/store-settings";
import { calculateOrderPricing } from "@/lib/tax";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  notes: z.string().trim().optional(),
  cartPayload: z.string().min(1, "Cart payload is required."),
});

export async function createOrderAction(formData: FormData) {
  const parsed = checkoutSchema.parse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    notes: formData.get("notes") || undefined,
    cartPayload: formData.get("cartPayload"),
  });

  const cartItems = parseCartPayload(parsed.cartPayload);

  if (cartItems.length === 0) {
    throw new Error("Cannot place an order with an empty cart.");
  }

  const orderId = await prisma.$transaction(async (tx) => {
    const uniqueMenuItemIds = [...new Set(cartItems.map((item) => item.menuItemId))];

    const menuItems = await tx.menuItem.findMany({
      where: {
        id: { in: uniqueMenuItemIds },
        isActive: true,
        isSoldOut: false,
      },
      include: {
        templateLinks: {
          where: {
            modifierTemplate: {
              required: true,
            },
          },
          include: {
            modifierTemplate: {
              include: {
                options: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (menuItems.length !== uniqueMenuItemIds.length) {
      throw new Error("One or more cart items are no longer available.");
    }

    const menuItemById = new Map(menuItems.map((item) => [item.id, item]));

    for (const cartItem of cartItems) {
      const menuItem = menuItemById.get(cartItem.menuItemId);

      if (!menuItem) {
        throw new Error("One or more cart items are invalid.");
      }

      if (cartItem.quantity <= 0) {
        throw new Error("Cart item quantity must be at least 1.");
      }

      for (const requiredTemplate of menuItem.templateLinks) {
        const hasSelection = requiredTemplate.modifierTemplate.options.some((option) =>
          cartItem.selectedModifiers.some((modifier) => modifier.name === option.name),
        );

        if (!hasSelection) {
          throw new Error(`Missing required modifiers for ${menuItem.name}.`);
        }
      }
    }

    const taxRate = await getStoreTaxRate();
    const pricing = calculateOrderPricing(calculateCartSubtotal(cartItems), taxRate);

    const order = await tx.order.create({
      data: {
        customerName: parsed.customerName,
        phone: parsed.phone,
        notes: parsed.notes || null,
        status: "PENDING",
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        taxRateApplied: pricing.taxRateApplied,
        total: pricing.total,
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

    return order.id;
  });

  redirect(`/order/${orderId}?clearCart=1`);
}

const cartItemSchema = z.object({
  menuItemId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  basePrice: z.number().nonnegative(),
  selectedModifiers: z.array(
    z.object({
      name: z.string().min(1),
      priceDelta: z.number(),
    }),
  ),
});

function parseCartPayload(cartPayload: string): CartItem[] {
  const parsedPayload = JSON.parse(cartPayload) as unknown;

  return z.array(cartItemSchema).parse(parsedPayload);
}

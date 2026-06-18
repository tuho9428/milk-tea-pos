"use server";

import { Prisma } from "@/generated/prisma-stripe/client";
import { z } from "zod";

import type { CheckoutActionState } from "@/app/checkout/checkout-action-state";
import { calculateCartSubtotal, type CartItem } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { getStoreTaxRate } from "@/lib/store-settings";
import { calculateOrderPricing } from "@/lib/tax";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  notes: z.string().trim().optional(),
  cartPayload: z.string().optional(),
  existingOrderId: z.string().trim().optional(),
});

const paymentCurrency = "usd";

function createCheckoutActionState(
  status: CheckoutActionState["status"],
  message: string,
  extra?: Partial<Omit<CheckoutActionState, "status" | "message" | "token">>,
): CheckoutActionState {
  return {
    status,
    message,
    redirectUrl: null,
    orderId: null,
    displayOrderNumber: null,
    token: crypto.randomUUID(),
    ...extra,
  };
}

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set.");
  }

  return appUrl;
}

function getDisplayOrderDateKey(date: Date) {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function formatDisplayOrderNumber(sequenceNumber: number) {
  return String(sequenceNumber).padStart(3, "0");
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function buildModifierSummary(modifiers: Array<{ name: string }>) {
  const modifierNames = modifiers.map((modifier) => modifier.name.trim()).filter(Boolean);
  return modifierNames.length > 0 ? modifierNames.join(", ") : null;
}

type StripeLineItemSource = {
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: Array<{
    name: string;
  }>;
};

function buildStripeLineItemsFromSources(
  sources: StripeLineItemSource[],
  taxAmount: number,
) {
  const lineItems = sources.map((item) => {
    const description = buildModifierSummary(item.modifiers);

    return {
      price_data: {
        currency: paymentCurrency,
        unit_amount: toCents(item.unitPrice),
        product_data: {
          name: item.name,
          ...(description ? { description } : {}),
        },
      },
      quantity: item.quantity,
    };
  });

  if (taxAmount > 0) {
    lineItems.push({
      price_data: {
        currency: paymentCurrency,
        unit_amount: toCents(taxAmount),
        product_data: {
          name: "Sales tax",
          description: "Milk Tea POS checkout tax",
        },
      },
      quantity: 1,
    });
  }

  return lineItems;
}

async function createStripeCheckoutSessionForOrder(order: {
  id: string;
  displayOrderNumber: string;
  total: number;
  tax: number;
  items: StripeLineItemSource[];
}) {
  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: order.id,
    metadata: {
      orderId: order.id,
      displayOrderNumber: order.displayOrderNumber,
    },
    payment_intent_data: {
      metadata: {
        orderId: order.id,
        displayOrderNumber: order.displayOrderNumber,
      },
      description: `Milk Tea POS order #${order.displayOrderNumber}`,
    },
    line_items: buildStripeLineItemsFromSources(order.items, order.tax),
    success_url: `${appUrl}/order/${order.id}?payment=success&session_id={CHECKOUT_SESSION_ID}&clearCart=1`,
    cancel_url: `${appUrl}/checkout/cancel?orderId=${order.id}`,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return session;
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

function parseCartPayload(cartPayload: string | undefined): CartItem[] {
  if (!cartPayload) {
    return [];
  }

  const parsedPayload = JSON.parse(cartPayload) as unknown;

  return z.array(cartItemSchema).parse(parsedPayload);
}

async function getExistingOrderForStripe(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
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
}

function buildStripeSourcesFromCart(cartItems: CartItem[]): StripeLineItemSource[] {
  return cartItems.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice:
      item.basePrice +
      item.selectedModifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0),
    modifiers: item.selectedModifiers,
  }));
}

function buildStripeSourcesFromOrder(order: NonNullable<Awaited<ReturnType<typeof getExistingOrderForStripe>>>) {
  return order.items.map((item) => ({
    name: item.menuItem?.name ?? "Menu item",
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    modifiers: item.modifiers.map((modifier) => ({
      name: modifier.name,
    })),
  }));
}

async function createPendingOrderFromCart(parsed: {
  customerName: string;
  phone: string;
  notes?: string;
  cartPayload?: string;
}) {
  const cartItems = parseCartPayload(parsed.cartPayload);

  if (cartItems.length === 0) {
    throw new Error("Cannot place an order with an empty cart.");
  }

  return prisma.$transaction(async (tx) => {
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
    const displayOrderDateKey = getDisplayOrderDateKey(new Date());
    const maxNumberResult = await tx.$queryRaw<Array<{ maxNumber: number | null }>>`
      SELECT MAX("displayOrderNumber"::integer) AS "maxNumber"
      FROM "Order"
      WHERE "displayOrderDateKey" = ${displayOrderDateKey}
    `;
    const displayOrderNumber = formatDisplayOrderNumber((maxNumberResult[0]?.maxNumber ?? 0) + 1);

    const order = await tx.order.create({
      data: {
        displayOrderDateKey,
        displayOrderNumber,
        customerName: parsed.customerName,
        phone: parsed.phone,
        notes: parsed.notes || null,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentProvider: "STRIPE",
        paymentAmount: pricing.total,
        paymentCurrency,
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
      select: {
        id: true,
        displayOrderNumber: true,
        total: true,
        tax: true,
      },
    });

    return {
      order: {
        id: order.id,
        displayOrderNumber: order.displayOrderNumber,
        total: Number(order.total),
        tax: Number(order.tax),
      },
      stripeSources: buildStripeSourcesFromCart(cartItems),
    };
  });
}

async function createStripePaymentForOrder(order: {
  id: string;
  displayOrderNumber: string;
  total: number;
  tax: number;
  items: StripeLineItemSource[];
}) {
  const session = await createStripeCheckoutSessionForOrder(order);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: null,
      paymentStatus: "PENDING",
      paymentProvider: "STRIPE",
      paymentAmount: order.total,
      paymentCurrency,
      paidAt: null,
    },
  });

  return session;
}

export async function createOrderAction(
  _state: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  let currentOrder: {
    id: string;
    displayOrderNumber: string;
  } | null = null;

  try {
    const parsed = checkoutSchema.parse({
      customerName: formData.get("customerName"),
      phone: formData.get("phone"),
      notes: formData.get("notes") || undefined,
      cartPayload: formData.get("cartPayload") || undefined,
      existingOrderId: formData.get("existingOrderId") || undefined,
    });

    let order: {
      id: string;
      displayOrderNumber: string;
      total: number;
      tax: number;
    };
    let stripeSources: StripeLineItemSource[];

    if (parsed.existingOrderId) {
      const existingOrder = await getExistingOrderForStripe(parsed.existingOrderId);

      if (!existingOrder) {
        return createCheckoutActionState("error", "We couldn't find the order to resume.");
      }

      if (existingOrder.paymentStatus === "PAID") {
        return createCheckoutActionState(
          "error",
          "That order is already paid. You can head back to the order page.",
          {
            orderId: existingOrder.id,
            displayOrderNumber: existingOrder.displayOrderNumber,
          },
        );
      }

      order = {
        id: existingOrder.id,
        displayOrderNumber: existingOrder.displayOrderNumber,
        total: Number(existingOrder.total),
        tax: Number(existingOrder.tax),
      };
      stripeSources = buildStripeSourcesFromOrder(existingOrder);
      currentOrder = {
        id: existingOrder.id,
        displayOrderNumber: existingOrder.displayOrderNumber,
      };
    } else {
      const created = await createPendingOrderFromCart(parsed);
      order = created.order;
      stripeSources = created.stripeSources;
      currentOrder = {
        id: created.order.id,
        displayOrderNumber: created.order.displayOrderNumber,
      };
    }

    const session = await createStripePaymentForOrder({
      ...order,
      items: stripeSources,
    });

    return createCheckoutActionState("success", "Redirecting to Stripe Checkout.", {
      redirectUrl: session.url,
      orderId: order.id,
      displayOrderNumber: order.displayOrderNumber,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (currentOrder) {
        return createCheckoutActionState(
          "error",
          "We couldn't save your Stripe checkout session. Please try again.",
          {
            orderId: currentOrder.id,
            displayOrderNumber: currentOrder.displayOrderNumber,
          },
        );
      }

      return createCheckoutActionState("error", "We couldn't save your order. Please try again.");
    }

    if (error instanceof z.ZodError) {
      return createCheckoutActionState(
        "error",
        error.issues[0]?.message ?? "Please complete the checkout form.",
      );
    }

    if (error instanceof Error) {
      if (currentOrder) {
        return createCheckoutActionState("error", error.message, {
          orderId: currentOrder.id,
          displayOrderNumber: currentOrder.displayOrderNumber,
        });
      }

      return createCheckoutActionState("error", error.message);
    }

    return createCheckoutActionState(
      "error",
      "Something went wrong while starting Stripe Checkout. Please try again.",
    );
  }
}

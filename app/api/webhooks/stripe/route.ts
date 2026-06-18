import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  }

  return secret;
}

function getSessionOrderId(session: Stripe.Checkout.Session) {
  return session.metadata?.orderId?.trim() || session.client_reference_id?.trim() || null;
}

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : null;
}

function getAmountTotal(session: Stripe.Checkout.Session) {
  return typeof session.amount_total === "number" ? session.amount_total / 100 : null;
}

function getPaymentIntentOrderId(paymentIntent: Stripe.PaymentIntent) {
  return paymentIntent.metadata?.orderId?.trim() || null;
}

function getPaymentIntentAmount(paymentIntent: Stripe.PaymentIntent) {
  if (typeof paymentIntent.amount_received === "number") {
    return paymentIntent.amount_received / 100;
  }

  if (typeof paymentIntent.amount === "number") {
    return paymentIntent.amount / 100;
  }

  return null;
}

async function revalidateOrderPaths(orderId: string) {
  revalidatePath(`/order/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/board");
  revalidatePath(`/admin/orders/${orderId}`);
}

async function updateOrderPaymentStatus(params: {
  orderId: string;
  session: Stripe.Checkout.Session;
  paymentStatus: "PAID" | "FAILED" | "EXPIRED";
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      paymentStatus: true,
      stripeCheckoutSessionId: true,
    },
  });

  if (!order) {
    console.log("[stripe:webhook] order not found", params.orderId);
    return;
  }

  if (order.paymentStatus === "PAID") {
    console.log("[stripe:webhook] order already paid", order.id);
    await revalidateOrderPaths(order.id);
    return;
  }

  if (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== params.session.id) {
    console.log("[stripe:webhook] stale session ignored", {
      orderId: order.id,
      expectedSessionId: order.stripeCheckoutSessionId,
      receivedSessionId: params.session.id,
    });
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: params.paymentStatus,
      stripeCheckoutSessionId: params.session.id,
      stripePaymentIntentId: getPaymentIntentId(params.session),
      paymentAmount: getAmountTotal(params.session) ?? undefined,
      paymentCurrency: params.session.currency ?? "usd",
      paidAt: params.paymentStatus === "PAID" ? new Date() : null,
    },
  });

  console.log("[stripe:webhook] order payment updated", {
    orderId: order.id,
    paymentStatus: params.paymentStatus,
    sessionId: params.session.id,
  });

  await revalidateOrderPaths(order.id);
}

async function updateOrderPaymentFromPaymentIntent(params: {
  orderId: string;
  paymentIntent: Stripe.PaymentIntent;
  paymentStatus: "PAID" | "FAILED";
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    select: {
      id: true,
      paymentStatus: true,
      stripeCheckoutSessionId: true,
    },
  });

  if (!order) {
    console.log("[stripe:webhook] order not found", params.orderId);
    return;
  }

  if (order.paymentStatus === "PAID") {
    console.log("[stripe:webhook] order already paid", order.id);
    await revalidateOrderPaths(order.id);
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: params.paymentStatus,
      stripePaymentIntentId: params.paymentIntent.id,
      paymentAmount: getPaymentIntentAmount(params.paymentIntent) ?? undefined,
      paymentCurrency: params.paymentIntent.currency ?? "usd",
      paidAt: params.paymentStatus === "PAID" ? new Date() : null,
    },
  });

  console.log("[stripe:webhook] order payment updated via payment_intent", {
    orderId: order.id,
    paymentStatus: params.paymentStatus,
    paymentIntentId: params.paymentIntent.id,
  });

  await revalidateOrderPaths(order.id);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/webhooks/stripe",
    accepts: "POST",
    configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.log("[stripe:webhook] missing signature");
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature.";
    console.log("[stripe:webhook] signature verification failed", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.log("[stripe:webhook] received", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = getSessionOrderId(session);

        console.log("[stripe:webhook] payment success candidate", {
          orderId,
          sessionId: session.id,
          paymentStatus: session.payment_status,
        });

        if (!orderId) {
          break;
        }

        if (event.type === "checkout.session.completed" && session.payment_status !== "paid") {
          break;
        }

        await updateOrderPaymentStatus({
          orderId,
          session,
          paymentStatus: "PAID",
        });
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = getSessionOrderId(session);

        console.log("[stripe:webhook] payment failure candidate", {
          orderId,
          sessionId: session.id,
          eventType: event.type,
        });

        if (!orderId) {
          break;
        }

        await updateOrderPaymentStatus({
          orderId,
          session,
          paymentStatus: event.type === "checkout.session.expired" ? "EXPIRED" : "FAILED",
        });
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = getPaymentIntentOrderId(paymentIntent);

        console.log("[stripe:webhook] payment_intent success candidate", {
          orderId,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        });

        if (!orderId) {
          break;
        }

        await updateOrderPaymentFromPaymentIntent({
          orderId,
          paymentIntent,
          paymentStatus: "PAID",
        });
        break;
      }
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = getPaymentIntentOrderId(paymentIntent);

        console.log("[stripe:webhook] payment_intent failure candidate", {
          orderId,
          paymentIntentId: paymentIntent.id,
          eventType: event.type,
        });

        if (!orderId) {
          break;
        }

        await updateOrderPaymentFromPaymentIntent({
          orderId,
          paymentIntent,
          paymentStatus: "FAILED",
        });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.log(
      "[stripe:webhook] processing failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process Stripe webhook.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

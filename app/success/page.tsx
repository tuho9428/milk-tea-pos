import Link from "next/link";
import Stripe from "stripe";

import { ClearCartOnLoad } from "@/app/order/[id]/clear-cart-on-load";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatPrice } from "@/lib/format";
import {
  ensureOrderPublicToken,
  getOrderPublicFields,
  updateOrderStripeReceiptFields,
} from "@/lib/order-public-fields";
import { queueOrderCreatedNotification } from "@/lib/order-created-notification";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { cn } from "@/lib/utils";

type SuccessPageProps = {
  searchParams?: Promise<{
    clearCart?: string;
    session_id?: string;
  }>;
};

export const dynamic = "force-dynamic";

function SuccessFallback({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <main className="page-shell">
      <div className="page-wrap space-y-6">
        <section className="hero-panel px-7 py-8">
          <div className="relative z-10 space-y-5">
            <p className="eyebrow">Checkout</p>
            <div className="space-y-2">
              <h1 className="page-title">{title}</h1>
              <p className="page-description">{message}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }))}>
                Return to Checkout
              </Link>
              <Link
                href="/menu"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Open Menu
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id ?? null;
}

async function getReceiptUrl(stripe: Stripe, session: Stripe.Checkout.Session) {
  const paymentIntentId = getPaymentIntentId(session);

  if (!paymentIntentId) {
    return null;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
  const latestCharge = paymentIntent.latest_charge;

  if (latestCharge && typeof latestCharge === "object" && "receipt_url" in latestCharge) {
    return latestCharge.receipt_url ?? null;
  }

  return null;
}

function getSessionCustomerEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email ?? session.customer_email ?? null;
}

async function reconcileSuccessSession(sessionId: string) {
  const order = await prisma.order.findUnique({
    where: {
      stripeCheckoutSessionId: sessionId,
    },
    select: {
      customerName: true,
      displayOrderNumber: true,
      id: true,
      paymentStatus: true,
      stripeCheckoutSessionId: true,
      total: true,
    },
  });

  if (!order) {
    return;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const customerEmail = getSessionCustomerEmail(session);

  if (
    session.payment_status !== "paid" ||
    session.metadata?.orderId !== order.id ||
    session.id !== order.stripeCheckoutSessionId
  ) {
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paidAt: order.paymentStatus === "PAID" ? undefined : new Date(),
      paymentAmount:
        typeof session.amount_total === "number" ? session.amount_total / 100 : undefined,
      paymentCurrency: session.currency ?? "usd",
      paymentStatus: "PAID",
      stripePaymentIntentId: getPaymentIntentId(session),
    },
  });

  if (customerEmail) {
    console.log("[stripe:success-page] customer email captured", {
      orderId: order.id,
      email: customerEmail,
    });
  }

  await updateOrderStripeReceiptFields({
    customerEmail,
    orderId: order.id,
    receiptUrl: await getReceiptUrl(stripe, session),
    stripeCheckoutSessionId: session.id,
  });
  await ensureOrderPublicToken(order.id);
  await queueOrderCreatedNotification(order);
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionId = resolvedSearchParams?.session_id?.trim();

  if (!sessionId) {
    return (
      <SuccessFallback
        title="Payment session missing"
        message="We could not find a Stripe checkout session in this link. Please return to checkout and try again."
      />
    );
  }

  await reconcileSuccessSession(sessionId);

  const order = await prisma.order.findUnique({
    where: {
      stripeCheckoutSessionId: sessionId,
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

  if (!order) {
    return (
      <SuccessFallback
        title="Order confirmation unavailable"
        message="Stripe returned to the app, but we could not match this session to an order yet. Please return to checkout or check your order link."
      />
    );
  }

  const publicToken = await ensureOrderPublicToken(order.id);
  const publicFields = await getOrderPublicFields(order.id);
  const statusHref = `/status/${publicToken}`;

  return (
    <main className="page-shell">
      <ClearCartOnLoad shouldClear={resolvedSearchParams?.clearCart === "1"} />
      <div className="page-wrap space-y-6">
        <section className="hero-panel px-7 py-8">
          <div className="relative z-10 space-y-5">
            <p className="eyebrow">Payment Complete</p>
            <div className="space-y-2">
              <h1 className="page-title">Queue #{order.displayOrderNumber}</h1>
              <p className="page-description">
                Thanks, {order.customerName}. Your order is confirmed and ready for the kitchen queue.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={statusHref} className={cn(buttonVariants({ size: "lg" }))}>
                Track Order
              </Link>
              {publicFields?.receiptUrl ? (
                <a
                  href={publicFields.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  Stripe Receipt
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="section-card p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="eyebrow">Summary</p>
              <h2 className="section-title">Order Summary</h2>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {formatPrice(Number(order.total))}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <article key={item.id} className="soft-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {item.quantity} x {item.menuItem?.name ?? "Item"}
                    </h3>
                    {item.modifiers.length > 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.modifiers.map((modifier) => modifier.name).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatPrice(Number(item.unitPrice) * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

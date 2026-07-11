import Link from "next/link";
import { notFound } from "next/navigation";

import {
  OrderTrackingStatus,
  type CustomerOrderStatus,
} from "@/app/order/[id]/order-tracking-status";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatPrice, formatTaxRate } from "@/lib/format";
import { getOrderIdByPublicToken, getOrderPublicFields } from "@/lib/order-public-fields";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type PublicOrderStatusPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicOrderStatusPage({ params }: PublicOrderStatusPageProps) {
  const { token } = await params;
  const publicToken = token.trim();

  if (!publicToken) {
    notFound();
  }

  const orderId = await getOrderIdByPublicToken(publicToken);

  if (!orderId) {
    notFound();
  }

  const [order, publicFields] = await Promise.all([
    prisma.order.findUnique({
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
    }),
    getOrderPublicFields(orderId),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <main className="page-shell">
      <div className="page-wrap space-y-6">
        <section className="hero-panel px-7 py-8">
          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              <p className="eyebrow">Order Status</p>
              <div className="space-y-2">
                <h1 className="page-title">Queue #{order.displayOrderNumber}</h1>
                <p className="page-description">
                  Track your drink as it moves through the kitchen.
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="soft-panel p-4">
                <dt className="eyebrow">Name</dt>
                <dd className="mt-2 text-sm font-semibold text-foreground">
                  {order.customerName}
                </dd>
              </div>
              <OrderTrackingStatus
                initialPaidAt={order.paidAt?.toISOString() ?? null}
                initialPaymentStatus={order.paymentStatus}
                initialStatus={order.status as CustomerOrderStatus}
                orderId={order.id}
              />
              <div className="soft-panel p-4">
                <dt className="eyebrow">Placed</dt>
                <dd className="mt-2 text-sm text-foreground">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(order.createdAt)}
                </dd>
              </div>
              <div className="soft-panel p-4">
                <dt className="eyebrow">Tax Rate</dt>
                <dd className="mt-2 text-sm text-foreground">
                  {formatTaxRate(Number(order.taxRateApplied))}
                </dd>
              </div>
            </dl>
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
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">
                      {item.quantity} x {item.menuItem.name}
                    </h3>
                    {item.modifiers.length > 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.modifiers.map((modifier) => modifier.name).join(", ")}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">No modifiers</p>
                    )}
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatPrice(Number(item.unitPrice) * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/menu" className={cn(buttonVariants({ size: "lg" }))}>
            Order More Drinks
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
    </main>
  );
}

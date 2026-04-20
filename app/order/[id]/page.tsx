import Link from "next/link";
import { notFound } from "next/navigation";

import { ClearCartOnLoad } from "@/app/order/[id]/clear-cart-on-load";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatPrice, formatTaxRate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type OrderConfirmationPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ clearCart?: string }>;
};

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
            },
          },
          modifiers: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="page-shell">
      <ClearCartOnLoad shouldClear={resolvedSearchParams?.clearCart === "1"} />
      <div className="page-wrap space-y-6">
        <section className="hero-panel px-7 py-8">
          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              <p className="eyebrow">Order Confirmed</p>
              <div className="space-y-2">
                <h1 className="page-title">Thanks, {order.customerName}</h1>
                <p className="page-description">
                  Your milk tea order has been created and is now waiting in the queue.
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="soft-panel p-4">
                <dt className="eyebrow">Order Number</dt>
                <dd className="mt-2 text-sm font-semibold text-foreground">
                  #{order.displayOrderNumber}
                </dd>
              </div>
              <div className="soft-panel p-4">
                <dt className="eyebrow">Status</dt>
                <dd className="mt-2">
                  <span className="status-pill status-warning">{order.status}</span>
                </dd>
              </div>
              <div className="soft-panel p-4">
                <dt className="eyebrow">Phone</dt>
                <dd className="mt-2 text-sm text-foreground">{order.phone}</dd>
              </div>
              <div className="soft-panel p-4">
                <dt className="eyebrow">Placed</dt>
                <dd className="mt-2 text-sm text-foreground">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(order.createdAt)}
                </dd>
              </div>
              <div className="soft-panel p-4 sm:col-span-2">
                <dt className="eyebrow">Tax Rate</dt>
                <dd className="mt-2 text-sm text-foreground">
                  {formatTaxRate(Number(order.taxRateApplied))}
                </dd>
              </div>
              {order.notes ? (
                <div className="soft-panel p-4 sm:col-span-2">
                  <dt className="eyebrow">Notes</dt>
                  <dd className="mt-2 text-sm text-foreground">{order.notes}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        <section className="section-card p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="eyebrow">Summary</p>
              <h2 className="section-title">Order Summary</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.items.length} line item{order.items.length === 1 ? "" : "s"}
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
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {item.modifiers.map((modifier) => (
                          <li key={modifier.id}>
                            {modifier.name}
                            {Number(modifier.priceDelta) > 0
                              ? ` (+${formatPrice(Number(modifier.priceDelta))})`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">No modifiers</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Line Total
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatPrice(Number(item.unitPrice) * item.quantity)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <dl className="mt-6 space-y-3 border-t border-border pt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{formatPrice(Number(order.subtotal))}</dd>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <dt>Tax</dt>
              <dd>{formatPrice(Number(order.tax))}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold text-foreground">
              <dt>Total</dt>
              <dd>{formatPrice(Number(order.total))}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/menu" className={cn(buttonVariants({ size: "lg" }))}>
            Order More Drinks
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { ClearCartOnLoad } from "@/app/order/[id]/clear-cart-on-load";
import { formatPrice, formatTaxRate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

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
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-10">
      <ClearCartOnLoad shouldClear={resolvedSearchParams?.clearCart === "1"} />
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.2em] text-emerald-600">
            ORDER CONFIRMED
          </p>
          <h1 className="mt-3 text-3xl font-bold text-stone-900">
            Thanks, {order.customerName}
          </h1>
          <p className="mt-2 text-stone-600">
            Your milk tea order has been created and is now waiting in the queue.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-stone-500">Order Number</dt>
              <dd className="mt-1 text-sm font-semibold text-stone-800">
                #{order.displayOrderNumber}
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-stone-500">Status</dt>
              <dd className="mt-1 font-semibold text-amber-700">{order.status}</dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-stone-500">Phone</dt>
              <dd className="mt-1 text-stone-800">{order.phone}</dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-stone-500">Placed</dt>
              <dd className="mt-1 text-stone-800">
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(order.createdAt)}
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-stone-500">Tax Rate</dt>
              <dd className="mt-1 text-stone-800">
                {formatTaxRate(Number(order.taxRateApplied))}
              </dd>
            </div>
            {order.notes ? (
              <div className="rounded-xl bg-stone-50 p-4 sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-stone-500">Notes</dt>
                <dd className="mt-1 text-stone-800">{order.notes}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-stone-900">Order Summary</h2>
            <p className="text-sm text-stone-500">{order.items.length} line items</p>
          </div>

          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-stone-900">
                      {item.quantity} x {item.menuItem.name}
                    </h3>
                    {item.modifiers.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-stone-600">
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
                      <p className="mt-2 text-sm text-stone-500">No modifiers</p>
                    )}
                  </div>
                  <p className="font-semibold text-stone-900">
                    {formatPrice(Number(item.unitPrice) * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <dl className="mt-6 space-y-3 border-t border-stone-200 pt-4">
            <div className="flex justify-between text-sm text-stone-600">
              <dt>Subtotal</dt>
              <dd>{formatPrice(Number(order.subtotal))}</dd>
            </div>
            <div className="flex justify-between text-sm text-stone-600">
              <dt>Tax</dt>
              <dd>{formatPrice(Number(order.tax))}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold text-stone-900">
              <dt>Total</dt>
              <dd>{formatPrice(Number(order.total))}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/menu"
            className="rounded-lg bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
          >
            Order More Drinks
          </Link>
        </div>
      </div>
    </main>
  );
}

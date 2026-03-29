import Link from "next/link";
import { formatPrice } from "lib/format";
import { prisma } from "lib/prisma";

const sampleQuantities: Record<string, number> = {
  "brown-sugar-boba-milk-tea": 1,
  "sea-salt-coffee": 2,
};

export default async function CartPage() {
  let drinks = await prisma.menuItem.findMany({
    where: {
      slug: { in: Object.keys(sampleQuantities) },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      basePrice: true,
      isSoldOut: true,
      isActive: true,
    },
  });

  if (drinks.length === 0) {
    drinks = await prisma.menuItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        basePrice: true,
        isSoldOut: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
      take: 2,
    });
  }

  const rows = drinks.map((drink) => ({
    ...drink,
    quantity: sampleQuantities[drink.slug] ?? 1,
    unitPrice: Number(drink.basePrice),
  }));

  const subtotal = rows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);
  const serviceFee = rows.length > 0 ? 0.5 : 0;
  const total = subtotal + serviceFee;

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-stone-900">Cart</h1>
            <Link href="/menu" className="text-sm font-medium text-stone-600 underline">
              Continue Shopping
            </Link>
          </header>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-5 text-stone-600">
              No sample cart items found in DB yet.
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-xl border border-stone-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-stone-900">{row.name}</h2>
                      <p className="mt-1 text-sm text-stone-600">
                        {row.isSoldOut || !row.isActive ? "Sold Out" : "Available"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-stone-700">
                      {formatPrice(row.unitPrice)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-3 rounded-lg border border-stone-300 px-3 py-1">
                      <span className="font-medium text-stone-900">{row.quantity}</span>
                    </div>
                    <p className="text-lg font-bold text-stone-900">
                      {formatPrice(row.unitPrice * row.quantity)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-stone-900">Order Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-stone-600">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-stone-600">
              <dt>Service Fee</dt>
              <dd>{formatPrice(serviceFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold text-stone-900">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-5 block rounded-lg bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-stone-700"
          >
            Continue to Checkout
          </Link>
        </aside>
      </div>
    </main>
  );
}

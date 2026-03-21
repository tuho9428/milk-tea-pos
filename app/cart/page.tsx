import Link from "next/link";
import { formatPrice, mockDrinks } from "@/lib/mock-drinks";

const cartItems = [
  {
    slug: "brown-sugar-boba-milk-tea",
    quantity: 1,
    unitPrice: 6.25,
    modifiers: ["Large", "Boba"],
  },
  {
    slug: "sea-salt-coffee",
    quantity: 2,
    unitPrice: 5.5,
    modifiers: ["Less Ice"],
  },
];

const cartRows = cartItems
  .map((item) => {
    const drink = mockDrinks.find((d) => d.slug === item.slug);
    return { ...item, drink };
  })
  .filter(
    (row): row is (typeof row & { drink: NonNullable<typeof row.drink> }) =>
      row.drink !== undefined,
  );

const subtotal = cartRows.reduce(
  (sum, row) => sum + row.quantity * row.unitPrice,
  0,
);
const serviceFee = 0.5;
const total = subtotal + serviceFee;

export default function CartPage() {
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

          <div className="space-y-4">
            {cartRows.map((row) => (
              <article
                key={row.slug}
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">{row.drink.name}</h2>
                    <p className="mt-1 text-sm text-stone-600">
                      {row.modifiers.join(" • ")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-stone-700">
                    {formatPrice(row.unitPrice)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center gap-3 rounded-lg border border-stone-300 px-3 py-1">
                    <button type="button" className="text-stone-700">
                      -
                    </button>
                    <span className="font-medium text-stone-900">{row.quantity}</span>
                    <button type="button" className="text-stone-700">
                      +
                    </button>
                  </div>
                  <p className="text-lg font-bold text-stone-900">
                    {formatPrice(row.unitPrice * row.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>
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

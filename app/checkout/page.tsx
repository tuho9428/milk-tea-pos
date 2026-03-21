import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CheckoutPage() {
  const summaryItems = await prisma.menuItem.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      basePrice: true,
    },
    take: 2,
    orderBy: { createdAt: "asc" },
  });

  const subtotal = summaryItems.reduce((sum, item) => sum + Number(item.basePrice), 0);
  const serviceFee = summaryItems.length > 0 ? 0.5 : 0;
  const total = subtotal + serviceFee;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-stone-100 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-2">
          <h1 className="text-3xl font-bold text-stone-900">Checkout</h1>
          <p className="mt-1 text-stone-600">Order summary now loaded from Prisma data.</p>

          <form className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-stone-700">Customer Name</span>
              <input
                className="rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-300 focus:ring-2"
                placeholder="John Doe"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-stone-700">Phone Number</span>
              <input
                className="rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-300 focus:ring-2"
                placeholder="(555) 123-4567"
              />
            </label>
            <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
              <span className="font-medium text-stone-700">Pickup Notes</span>
              <textarea
                className="min-h-28 rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-300 focus:ring-2"
                placeholder="Less sugar for all drinks, please."
              />
            </label>
            <div className="sm:col-span-2 mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
              >
                Place Order
              </button>
              <Link
                href="/cart"
                className="rounded-lg border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100"
              >
                Back to Cart
              </Link>
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">Order Summary</h2>
          <ul className="mt-4 space-y-3">
            {summaryItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-700">1 x {item.name}</span>
                <span className="font-medium text-stone-900">
                  {formatPrice(Number(item.basePrice))}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between text-stone-600">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-stone-600">
              <dt>Service Fee</dt>
              <dd>{formatPrice(serviceFee)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold text-stone-900">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}

import Link from "next/link";

import { createOrderAction } from "@/app/checkout/actions";
import { calculateCartSubtotal, getMockCart } from "@/lib/mock-cart";
import { formatPrice } from "lib/format";

export default async function CheckoutPage() {
  const cartItems = await getMockCart();
  const subtotal = calculateCartSubtotal(cartItems);
  const total = subtotal;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-stone-100 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-stone-200 bg-white p-6 lg:col-span-2">
          <h1 className="text-3xl font-bold text-stone-900">Checkout</h1>
          <p className="mt-1 text-stone-600">
            Enter pickup details and place this temporary mocked cart as a real order.
          </p>

          <form action={createOrderAction} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-stone-700">Customer Name</span>
              <input
                name="customerName"
                required
                className="rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none placeholder:text-stone-400 ring-amber-300 focus:ring-2"
                placeholder="John Doe"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-stone-700">Phone Number</span>
              <input
                name="phone"
                required
                className="rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none placeholder:text-stone-400 ring-amber-300 focus:ring-2"
                placeholder="(555) 123-4567"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-stone-700">Pickup Notes</span>
              <textarea
                name="notes"
                className="min-h-28 rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none placeholder:text-stone-400 ring-amber-300 focus:ring-2"
                placeholder="Less sugar for all drinks, please."
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={cartItems.length === 0}
                className="rounded-lg bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
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
          {cartItems.length === 0 ? (
            <p className="mt-4 text-sm text-stone-600">No temporary cart items are available yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {cartItems.map((item) => {
                const modifierTotal = item.selectedModifiers.reduce(
                  (sum, modifier) => sum + modifier.priceDelta,
                  0,
                );

                return (
                  <li key={item.menuItemId} className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-stone-700">
                        {item.quantity} x {item.name}
                      </span>
                      <span className="font-medium text-stone-900">
                        {formatPrice(item.quantity * (item.basePrice + modifierTotal))}
                      </span>
                    </div>
                    {item.selectedModifiers.length > 0 ? (
                      <ul className="mt-2 space-y-1 pl-3 text-stone-500">
                        {item.selectedModifiers.map((modifier) => (
                          <li key={`${item.menuItemId}-${modifier.name}`}>
                            {modifier.name}
                            {modifier.priceDelta > 0
                              ? ` (+${formatPrice(modifier.priceDelta)})`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between text-stone-600">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
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

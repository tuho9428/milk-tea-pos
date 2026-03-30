"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import type { CartItem } from "@/lib/cart";
import { calculateCartSubtotal } from "@/lib/cart";
import { getStoredCart, subscribeToStoredCart } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";

type CartClientProps = {
  initialItems: CartItem[];
};

export function CartClient({ initialItems }: CartClientProps) {
  const rows = useSyncExternalStore(
    subscribeToStoredCart,
    () => {
      const storedCart = getStoredCart();
      return storedCart.length > 0 ? storedCart : initialItems;
    },
    () => initialItems,
  );

  const subtotal = calculateCartSubtotal(rows);
  const total = subtotal;

  return (
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
            Your cart is empty.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, index) => (
              <article
                key={`${row.menuItemId}-${index}`}
                className="rounded-xl border border-stone-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">{row.name}</h2>
                    <p className="mt-1 text-sm text-stone-600">Cart item</p>
                    {row.selectedModifiers.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-stone-500">
                        {row.selectedModifiers.map((modifier) => (
                          <li key={`${row.menuItemId}-${index}-${modifier.name}`}>
                            {modifier.name}
                            {modifier.priceDelta > 0
                              ? ` (+${formatPrice(modifier.priceDelta)})`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-stone-700">
                    {formatPrice(row.basePrice)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center gap-3 rounded-lg border border-stone-300 px-3 py-1">
                    <span className="font-medium text-stone-900">{row.quantity}</span>
                  </div>
                  <p className="text-lg font-bold text-stone-900">
                    {formatPrice(
                      row.quantity *
                        (row.basePrice +
                          row.selectedModifiers.reduce(
                            (sum, modifier) => sum + modifier.priceDelta,
                            0,
                          )),
                    )}
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
  );
}

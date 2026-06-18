"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  calculateCartLineTotal,
  calculateCartLineUnitPrice,
  calculateCartSubtotal,
  getCartItemCount,
} from "@/lib/cart";
import {
  getStoredCart,
  removeStoredCartItem,
  subscribeToStoredCart,
  updateStoredCartItemQuantity,
} from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartClient() {
  const rows = useSyncExternalStore(subscribeToStoredCart, getStoredCart, () => []);

  const subtotal = calculateCartSubtotal(rows);
  const total = subtotal;
  const itemCount = getCartItemCount(rows);

  return (
    <div className="page-wrap-wide grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
      <section className="space-y-4">
        <header className="hero-panel px-6 py-6 sm:px-7">
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="eyebrow">Your Order</p>
              <div className="space-y-2">
                <h1 className="page-title">Cart</h1>
                <p className="page-description">
                  Review quantities, selected modifiers, and your current subtotal.
                </p>
              </div>
            </div>
            <Link
              href="/menu"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Continue Shopping
            </Link>
          </div>
        </header>

        {rows.length === 0 ? (
          <div className="section-card p-6">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, index) => (
              <article key={`${row.menuItemId}-${index}`} className="section-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold text-foreground">{row.name}</h2>
                      <p className="text-sm text-muted-foreground">Cart item</p>
                    </div>

                    {row.selectedModifiers.length > 0 ? (
                      <ul className="space-y-1 text-sm text-muted-foreground">
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
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Unit Price
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatPrice(calculateCartLineUnitPrice(row))}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-border bg-secondary/45 shadow-sm">
                      <button
                        type="button"
                        onClick={() => updateStoredCartItemQuantity(index, row.quantity - 1)}
                        className="px-4 py-2 text-foreground transition hover:bg-secondary rounded-full"
                        aria-label={`Decrease quantity for ${row.name}`}
                      >
                        -
                      </button>
                      <span className="min-w-12 px-4 py-2 text-center font-medium text-foreground">
                        {row.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateStoredCartItemQuantity(index, row.quantity + 1)}
                        className="px-4 py-2 text-foreground transition hover:bg-secondary rounded-full"
                        aria-label={`Increase quantity for ${row.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStoredCartItem(index)}
                      className="status-pill status-danger"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Line Total
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatPrice(calculateCartLineTotal(row))}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="section-card h-fit p-5">
        <div className="space-y-2">
          <p className="eyebrow">Summary</p>
          <h2 className="section-title">Order Summary</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length > 0
              ? `${itemCount} item${itemCount === 1 ? "" : "s"} in cart`
              : "Add a drink from the menu to start your order."}
          </p>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-3">
          <Link
            href={rows.length > 0 ? "/checkout" : "/menu"}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            {rows.length > 0 ? "Continue to Checkout" : "Go to Menu"}
          </Link>
          {rows.length > 0 ? (
            <Link
              href="/menu"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
            >
              Add More Drinks
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

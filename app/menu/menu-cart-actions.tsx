"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { getCartItemCount } from "@/lib/cart";
import { getStoredCart, subscribeToStoredCart } from "@/lib/cart-storage";

export function MenuCartActions() {
  const cartItems = useSyncExternalStore(
    subscribeToStoredCart,
    getStoredCart,
    () => [],
  );

  const itemCount = getCartItemCount(cartItems);

  if (itemCount === 0) {
    return null;
  }

  return (
    <nav className="flex gap-2 text-sm">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 font-medium text-amber-900 hover:bg-amber-200"
      >
        <span>View Cart</span>
        <span className="rounded-full bg-amber-900 px-2 py-0.5 text-xs font-semibold text-white">
          {itemCount}
        </span>
      </Link>
      <Link
        href="/checkout"
        className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-900 hover:bg-stone-100"
      >
        <span>Checkout</span>
        <span className="rounded-full bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white">
          {itemCount}
        </span>
      </Link>
    </nav>
  );
}

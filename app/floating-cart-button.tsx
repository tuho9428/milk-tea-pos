"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { getCartItemCount } from "@/lib/cart";
import { getStoredCart, subscribeToStoredCart } from "@/lib/cart-storage";

const EMPTY_CART: ReturnType<typeof getStoredCart> = [];

export function FloatingCartButton() {
  const pathname = usePathname();
  const cartItems = useSyncExternalStore(
    subscribeToStoredCart,
    getStoredCart,
    () => EMPTY_CART,
  );

  const itemCount = getCartItemCount(cartItems);
  const isAdminRoute = pathname.startsWith("/admin");
  const isCartPage = pathname === "/cart";

  if (itemCount === 0 || isAdminRoute || isCartPage) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      <Link
        href="/cart"
        className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-stone-900/25 transition-colors hover:bg-stone-700"
      >
        <span>View Cart</span>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-amber-300 px-2 py-1 text-xs font-bold text-stone-900">
          {itemCount}
        </span>
      </Link>
    </div>
  );
}

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
  const isCheckoutPage = pathname === "/checkout";

  if (itemCount === 0 || isAdminRoute || isCartPage || isCheckoutPage) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-50 sm:right-6 sm:bottom-6">
      <Link
        href="/cart"
        className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-primary/15 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_16px_32px_rgba(47,107,90,0.28)] transition hover:bg-primary/90 hover:border-primary/90"
      >
        <span>View Cart</span>
        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-white/16 px-2 py-1 text-xs font-semibold text-white">
          {itemCount}
        </span>
      </Link>
    </div>
  );
}

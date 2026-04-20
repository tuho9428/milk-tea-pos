"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { getCartItemCount } from "@/lib/cart";
import { getStoredCart, subscribeToStoredCart } from "@/lib/cart-storage";
import { cn } from "@/lib/utils";

const EMPTY_CART: ReturnType<typeof getStoredCart> = [];

export function MenuCartActions() {
  const cartItems = useSyncExternalStore(
    subscribeToStoredCart,
    getStoredCart,
    () => EMPTY_CART,
  );

  const itemCount = getCartItemCount(cartItems);

  if (itemCount === 0) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      <Link
        href="/cart"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-3 shadow-none",
        )}
      >
        <span>View Cart</span>
        <span className="status-pill status-primary min-w-7 justify-center px-2">
          {itemCount}
        </span>
      </Link>
      <Link
        href="/checkout"
        className={cn(
          buttonVariants({ variant: "default", size: "sm" }),
          "gap-3",
        )}
      >
        <span>Checkout</span>
        <span className="status-pill bg-primary-foreground/14 px-2 text-primary-foreground border-primary-foreground/20">
          {itemCount}
        </span>
      </Link>
    </nav>
  );
}

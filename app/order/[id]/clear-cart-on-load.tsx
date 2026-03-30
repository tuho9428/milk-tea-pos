"use client";

import { useEffect } from "react";

import { clearStoredCart } from "@/lib/cart-storage";

type ClearCartOnLoadProps = {
  shouldClear: boolean;
};

export function ClearCartOnLoad({ shouldClear }: ClearCartOnLoadProps) {
  useEffect(() => {
    if (!shouldClear) {
      return;
    }

    clearStoredCart();
  }, [shouldClear]);

  return null;
}

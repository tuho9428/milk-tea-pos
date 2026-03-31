"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { clearStoredCart } from "@/lib/cart-storage";

type ClearCartOnLoadProps = {
  shouldClear: boolean;
};

export function ClearCartOnLoad({ shouldClear }: ClearCartOnLoadProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldClear) {
      return;
    }

    clearStoredCart();
    router.replace(pathname, { scroll: false });
  }, [pathname, router, shouldClear]);

  useEffect(() => {
    const handlePageShow = () => {
      router.refresh();
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  return null;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { createOrderAction } from "@/app/checkout/actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { calculateCartSubtotal } from "@/lib/cart";
import { getStoredCart, subscribeToStoredCart } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import { calculateOrderPricing } from "@/lib/tax";
import { cn } from "@/lib/utils";

type CheckoutClientProps = {
  taxRate: number;
};

export function CheckoutClient({ taxRate }: CheckoutClientProps) {
  const router = useRouter();
  const cartItems = useSyncExternalStore(subscribeToStoredCart, getStoredCart, () => []);

  const pricing = useMemo(
    () => calculateOrderPricing(calculateCartSubtotal(cartItems), taxRate),
    [cartItems, taxRate],
  );

  useEffect(() => {
    const handlePageShow = () => {
      router.refresh();
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  return (
    <form
      action={createOrderAction}
      className="page-wrap-wide grid gap-6 lg:grid-cols-[1.45fr_0.78fr]"
    >
      <input type="hidden" name="cartPayload" value={JSON.stringify(cartItems)} />

      <Card className="hero-panel lg:col-span-1">
        <CardHeader className="relative z-10 gap-3 border-b border-border">
          <p className="eyebrow">Pickup Details</p>
          <div className="space-y-2">
            <CardTitle className="page-title text-[2.2rem]">Checkout</CardTitle>
            <CardDescription>
              Enter customer details and place this cart as a real order.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Customer Name</span>
              <Input name="customerName" required placeholder="John Doe" className="h-12" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Phone Number</span>
              <Input name="phone" required placeholder="(555) 123-4567" className="h-12" />
            </label>
            <label className="flex flex-col gap-2 text-sm sm:col-span-2">
              <span className="font-medium text-foreground">Pickup Notes</span>
              <Textarea
                name="notes"
                placeholder="Less sugar for all drinks, please."
                className="min-h-36"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="section-card h-fit">
        <CardHeader className="border-b border-border">
          <div className="space-y-2">
            <p className="eyebrow">Summary</p>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              {cartItems.length} line item{cartItems.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {cartItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {cartItems.map((item, index) => {
                const modifierTotal = item.selectedModifiers.reduce(
                  (sum, modifier) => sum + modifier.priceDelta,
                  0,
                );

                return (
                  <li key={`${item.menuItemId}-${index}`} className="soft-panel p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {item.quantity} x {item.name}
                        </p>
                        {item.selectedModifiers.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-muted-foreground">
                            {item.selectedModifiers.map((modifier) => (
                              <li key={`${item.menuItemId}-${index}-${modifier.name}`}>
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
                          Line Total
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          {formatPrice(item.quantity * (item.basePrice + modifierTotal))}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{formatPrice(pricing.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Tax</dt>
              <dd>{formatPrice(pricing.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
              <dt>Total</dt>
              <dd>{formatPrice(pricing.total)}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" disabled={cartItems.length === 0} size="lg" className="flex-1">
              Place Order
            </Button>
            <Link
              href={cartItems.length === 0 ? "/menu" : "/cart"}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {cartItems.length === 0 ? "Go to Menu" : "Back to Cart"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

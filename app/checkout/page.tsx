import Link from "next/link";

import { createOrderAction } from "@/app/checkout/actions";
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
import { calculateCartSubtotal, getMockCart } from "@/lib/mock-cart";
import { formatPrice } from "@/lib/format";

export default async function CheckoutPage() {
  const cartItems = await getMockCart();
  const subtotal = calculateCartSubtotal(cartItems);
  const total = subtotal;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-stone-100 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        <Card className="border-stone-200 bg-white py-0 lg:col-span-2">
          <CardHeader className="gap-2 border-b border-stone-200 px-6 py-6">
            <CardTitle className="text-3xl font-bold text-stone-900">Checkout</CardTitle>
            <CardDescription className="text-stone-600">
              Enter pickup details and place this temporary mocked cart as a real order.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-6">
            <form action={createOrderAction} className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-stone-700">Customer Name</span>
                <Input
                  name="customerName"
                  required
                  placeholder="John Doe"
                  className="h-11 border-stone-300 bg-white text-stone-900 placeholder:text-stone-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-stone-700">Phone Number</span>
                <Input
                  name="phone"
                  required
                  placeholder="(555) 123-4567"
                  className="h-11 border-stone-300 bg-white text-stone-900 placeholder:text-stone-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm sm:col-span-2">
                <span className="font-medium text-stone-700">Pickup Notes</span>
                <Textarea
                  name="notes"
                  placeholder="Less sugar for all drinks, please."
                  className="min-h-32 border-stone-300 bg-white text-stone-900 placeholder:text-stone-400"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
                <Button
                  type="submit"
                  disabled={cartItems.length === 0}
                  size="lg"
                  className="bg-stone-900 px-5 text-white hover:bg-stone-700"
                >
                  Place Order
                </Button>

                <Link
                  href="/cart"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-300 bg-white px-5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
                >
                  Back to Cart
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit border-stone-200 bg-white py-0">
          <CardHeader className="border-b border-stone-200 px-6 py-5">
            <CardTitle className="text-lg font-semibold text-stone-900">Order Summary</CardTitle>
          </CardHeader>

          <CardContent className="px-6 py-5">
            {cartItems.length === 0 ? (
              <p className="text-sm text-stone-600">No temporary cart items are available yet.</p>
            ) : (
              <ul className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

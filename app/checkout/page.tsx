import { CheckoutClient } from "@/app/checkout/checkout-client";
import { getMockCart } from "@/lib/mock-cart";

export default async function CheckoutPage() {
  const cartItems = await getMockCart();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-stone-100 px-6 py-10">
      <CheckoutClient initialCartItems={cartItems} />
    </main>
  );
}

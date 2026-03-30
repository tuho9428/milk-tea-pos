import { CheckoutClient } from "@/app/checkout/checkout-client";

export default async function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-stone-100 px-6 py-10">
      <CheckoutClient />
    </main>
  );
}

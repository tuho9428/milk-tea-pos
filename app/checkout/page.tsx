import { CheckoutClient } from "@/app/checkout/checkout-client";
import { getStoreTaxRate } from "@/lib/store-settings";

export default async function CheckoutPage() {
  const taxRate = await getStoreTaxRate();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-stone-100 px-6 py-10">
      <CheckoutClient taxRate={taxRate} />
    </main>
  );
}

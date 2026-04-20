import { CheckoutClient } from "@/app/checkout/checkout-client";
import { getStoreTaxRate } from "@/lib/store-settings";

export default async function CheckoutPage() {
  const taxRate = await getStoreTaxRate();

  return (
    <main className="page-shell">
      <CheckoutClient taxRate={taxRate} />
    </main>
  );
}

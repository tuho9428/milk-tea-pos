import { CheckoutClientLoader } from "@/app/checkout/checkout-client-loader";
import { getStoreTaxRate } from "@/lib/store-settings";

export default async function CheckoutPage() {
  const taxRate = await getStoreTaxRate();

  return (
    <main className="page-shell">
      <CheckoutClientLoader taxRate={taxRate} />
    </main>
  );
}

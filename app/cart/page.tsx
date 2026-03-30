import { CartClient } from "@/app/cart/cart-client";
import { getMockCart } from "@/lib/mock-cart";

export default async function CartPage() {
  const rows = await getMockCart();

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10">
      <CartClient initialItems={rows} />
    </main>
  );
}

import { CartClient } from "@/app/cart/cart-client";

export default async function CartPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10">
      <CartClient />
    </main>
  );
}

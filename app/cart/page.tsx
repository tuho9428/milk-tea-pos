import { CartClient } from "@/app/cart/cart-client";

export default async function CartPage() {
  return (
    <main className="page-shell">
      <CartClient />
    </main>
  );
}

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="page-shell flex items-center">
      <section className="page-wrap max-w-5xl">
        <div className="hero-panel px-7 py-10 sm:px-10 sm:py-12">
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.25fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="eyebrow">Milk Tea POS</p>
              <div className="space-y-4">
                <h1 className="page-title max-w-xl">
                  A softer, hospitality-first ordering flow for modern tea shops.
                </h1>
                <p className="page-description max-w-2xl">
                  Browse the storefront, customize drinks, move through checkout,
                  and manage incoming orders from a clean admin workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/menu" className={cn(buttonVariants({ size: "lg" }))}>
                  Open Menu
                </Link>
                <Link
                  href="/cart"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  View Cart
                </Link>
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
                >
                  Admin Workspace
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="section-card p-5">
                <p className="eyebrow">Customer Flow</p>
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  Menu, cart, checkout
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Customers can browse the menu, customize drinks, and place orders
                  through a streamlined flow.
                </p>
              </div>
              <div className="section-card p-5">
                <p className="eyebrow">Operations</p>
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  Orders, board, settings
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Staff can review orders, update statuses, manage menu items, and
                  keep store settings aligned.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

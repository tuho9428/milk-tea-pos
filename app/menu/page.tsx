import Link from "next/link";
import { formatPrice, mockDrinks } from "@/lib/mock-drinks";

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-2xl border border-amber-200 bg-white/80 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-amber-700">
                MILK TEA POS
              </p>
              <h1 className="mt-2 text-3xl font-bold text-stone-900">Menu</h1>
              <p className="mt-1 text-stone-600">
                Static mock drinks for UI flow and layout testing.
              </p>
            </div>
            <nav className="flex gap-2 text-sm">
              <Link
                href="/cart"
                className="rounded-full border border-amber-300 bg-amber-100 px-4 py-2 font-medium text-amber-900 hover:bg-amber-200"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-900 hover:bg-stone-100"
              >
                Checkout
              </Link>
            </nav>
          </div>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mockDrinks.map((drink) => (
            <article
              key={drink.slug}
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                  {drink.category}
                </span>
                <span className="text-lg font-bold text-stone-900">
                  {formatPrice(drink.price)}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-stone-900">{drink.name}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {drink.shortDescription}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {drink.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <Link
                  href={`/menu/${drink.slug}`}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-900 hover:bg-stone-100"
                >
                  View Details
                </Link>
                <button
                  type="button"
                  className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700"
                >
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

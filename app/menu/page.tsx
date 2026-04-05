import Link from "next/link";
import { MenuCartActions } from "@/app/menu/menu-cart-actions";
import { ProductDetailContent } from "@/app/menu/[slug]/product-detail-content";
import { getProductDetailBySlug } from "@/app/menu/[slug]/product-detail-data";
import { prisma } from "lib/prisma";
import { formatPrice } from "lib/format";

type MenuPageProps = {
  searchParams?: Promise<{
    item?: string;
  }>;
};

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeItemSlug = resolvedSearchParams?.item?.trim() || null;
  const drinks = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
  const activeDrink = activeItemSlug
    ? await getProductDetailBySlug(activeItemSlug).catch(() => null)
    : null;

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
                Loaded from Prisma and your Neon database.
              </p>
            </div>
            <MenuCartActions />
          </div>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {drinks.map((drink) => {
            const price = Number(drink.basePrice);
            const soldOut = drink.isSoldOut || !drink.isActive;

            return (
              <Link
                key={drink.id}
                href={`/menu?item=${drink.slug}`}
                scroll={false}
                className="group block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-50"
              >
                <article>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                      {drink.category.name}
                    </span>
                    <span className="text-lg font-bold text-stone-900">
                      {formatPrice(price)}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-stone-900 transition-colors group-hover:text-amber-800 group-focus-visible:text-amber-800">
                    {drink.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {drink.description ?? "No description yet."}
                  </p>

                  {drink.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {drink.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4">
                    {soldOut ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Sold Out
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Available
                      </span>
                    )}
                  </div>
                </article>
              </Link>
            );
          })}
        </section>
      </div>

      {activeItemSlug ? (
        <div className="fixed inset-0 z-50 bg-stone-950/70 px-4 py-6 backdrop-blur-sm">
          <Link
            href="/menu"
            className="absolute inset-0"
            aria-label="Close product details"
            scroll={false}
          />

          <div className="relative mx-auto max-w-4xl">
            <div className="mb-3 flex justify-end">
              <Link
                href="/menu"
                scroll={false}
                className="rounded-lg border border-stone-600 bg-stone-900/90 px-3 py-2 text-sm font-medium text-stone-100 hover:bg-stone-800"
              >
                Close
              </Link>
            </div>

            {activeDrink ? (
              <ProductDetailContent drink={activeDrink} mode="modal" />
            ) : (
              <div className="rounded-2xl border border-stone-700 bg-stone-900/90 p-7 text-stone-100 shadow-xl">
                <h2 className="text-2xl font-semibold">Item not found</h2>
                <p className="mt-2 text-stone-300">
                  This menu item is unavailable or could not be loaded.
                </p>
                <div className="mt-5">
                  <Link
                    href="/menu"
                    scroll={false}
                    className="inline-flex rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-200"
                  >
                    Back to Menu
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

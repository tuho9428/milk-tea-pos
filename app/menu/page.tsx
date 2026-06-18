import Link from "next/link";

import { MenuCartActions } from "@/app/menu/menu-cart-actions";
import { ProductDetailContent } from "@/app/menu/[slug]/product-detail-content";
import { getProductDetailBySlug } from "@/app/menu/[slug]/product-detail-data";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

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
    orderBy: [{ category: { name: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const activeDrink = activeItemSlug
    ? await getProductDetailBySlug(activeItemSlug).catch(() => null)
    : null;

  const categoryEntries = drinks.reduce<
    Array<{
      name: string;
      slug: string;
      items: typeof drinks;
    }>
  >((groups, drink) => {
    const id = drink.category.slug;
    const existing = groups.find((group) => group.slug === id);

    if (existing) {
      existing.items.push(drink);
      return groups;
    }

    groups.push({
      name: drink.category.name,
      slug: id,
      items: [drink],
    });

    return groups;
  }, []);

  return (
    <main className="page-shell">
      <div className="page-wrap-wide">
        <header className="hero-panel px-6 py-7 sm:px-8">
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <p className="eyebrow">Milk Tea Menu</p>
              <div className="space-y-3">
                <h1 className="page-title">
                  Customize drinks with a calm, polished ordering flow.
                </h1>
                <p className="page-description">
                  Browse by category, open product details in place, and let the drinks
                  stay the most colorful part of the experience.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                {drinks.length} menu item{drinks.length === 1 ? "" : "s"}
              </div>
              <MenuCartActions />
            </div>
          </div>

          <div className="relative z-10 mt-6 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Browse by category
            </p>
            <nav className="flex flex-wrap gap-2">
              {categoryEntries.map((category) => (
                <a key={category.slug} href={`#${category.slug}`} className="tab-chip">
                  {category.name}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <div className="space-y-10">
          {categoryEntries.map((category) => (
            <section key={category.slug} id={category.slug} className="space-y-4 scroll-mt-28">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                  <p className="eyebrow">{category.name}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="section-title">
                      {category.items.length} item{category.items.length === 1 ? "" : "s"}
                    </h2>
                    <span className="chip">
                      {category.items.filter((item) => !item.isSoldOut && item.isActive).length} available
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {category.items.map((drink) => {
                  const soldOut = drink.isSoldOut || !drink.isActive;

                  return (
                    <Link
                      key={drink.id}
                      href={`/menu?item=${drink.slug}`}
                      scroll={false}
                      className="section-card group block p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_14px_26px_rgba(31,26,23,0.07)] focus-visible:ring-4 focus-visible:ring-primary/12"
                    >
                      <article className="flex h-full flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <span className="chip">{drink.category.name}</span>
                          <span className="text-lg font-semibold text-foreground">
                            {formatPrice(Number(drink.basePrice))}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground transition group-hover:text-primary">
                            {drink.name}
                          </h3>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {drink.description ?? "No description yet."}
                          </p>
                        </div>

                        {drink.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {drink.tags.map((tag) => (
                              <span key={tag} className="chip-accent">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-4">
                          <span
                            className={cn(
                              "status-pill",
                              soldOut ? "status-danger" : "status-success",
                            )}
                          >
                            {soldOut ? "Sold Out" : "Available"}
                          </span>
                          <span className="text-sm font-medium text-primary">Customize</span>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {activeItemSlug ? (
        <div className="dialog-backdrop">
          <Link
            href="/menu"
            className="absolute inset-0"
            aria-label="Close product details"
            scroll={false}
          />

          <div className="relative mx-auto max-w-4xl">
            <div className="mb-3 flex justify-end">
              <Link href="/menu" scroll={false} className="dialog-close">
                Close
              </Link>
            </div>

            {activeDrink ? (
              <ProductDetailContent drink={activeDrink} mode="modal" />
            ) : (
              <div className="section-card p-7">
                <h2 className="section-title">Item not found</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This menu item is unavailable or could not be loaded.
                </p>
                <div className="mt-5">
                  <Link
                    href="/menu"
                    scroll={false}
                    className={cn(buttonVariants({ size: "sm" }))}
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

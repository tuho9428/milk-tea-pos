import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartForm } from "@/app/menu/[slug]/add-to-cart-form";
import { formatPrice } from "lib/format";
import { prisma } from "lib/prisma";

type DrinkDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DrinkDetailPage({ params }: DrinkDetailPageProps) {
  const { slug } = await params;
  const drink = await prisma.menuItem.findUnique({
    where: { slug },
    include: {
      category: true,
      groups: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!drink) {
    notFound();
  }

  const soldOut = drink.isSoldOut || !drink.isActive;
  const serializedGroups = drink.groups.map((group) => ({
    id: group.id,
    name: group.name,
    required: group.required,
    multiSelect: group.multiSelect,
    options: group.options.map((option) => ({
      id: option.id,
      name: option.name,
      priceDelta: Number(option.priceDelta),
    })),
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/menu"
          className="mb-6 inline-flex rounded-lg border border-stone-600 px-3 py-2 text-sm font-medium text-stone-100 hover:bg-stone-800"
        >
          Back to Menu
        </Link>

        <section className="rounded-2xl border border-stone-700 bg-stone-900/80 p-7 shadow-xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-300">
            {drink.category.name}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{drink.name}</h1>
          <p className="mt-3 max-w-3xl text-stone-300">
            {drink.description ?? "No description yet."}
          </p>

          {drink.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {drink.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-amber-200/20 px-3 py-1 text-sm text-amber-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-400">Price</p>
              <p className="mt-2 text-2xl font-bold text-amber-300">
                {formatPrice(Number(drink.basePrice))}
              </p>
            </div>
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-stone-400">Status</p>
              <div className="mt-2">
                {soldOut ? (
                  <span className="rounded-full bg-red-900/40 px-3 py-1 text-sm text-red-200">
                    Sold Out
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-sm text-emerald-200">
                    Available
                  </span>
                )}
              </div>
            </div>
          </div>

          <AddToCartForm
            menuItem={{
              menuItemId: drink.id,
              name: drink.name,
              basePrice: Number(drink.basePrice),
            }}
            groups={serializedGroups}
            soldOut={soldOut}
          />
        </section>
      </div>
    </main>
  );
}

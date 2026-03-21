import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getDrinkBySlug } from "@/lib/mock-drinks";

type DrinkDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DrinkDetailPage({ params }: DrinkDetailPageProps) {
  const { slug } = await params;
  const drink = getDrinkBySlug(slug);

  if (!drink) {
    notFound();
  }

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
            {drink.category}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{drink.name}</h1>
          <p className="mt-3 max-w-3xl text-stone-300">{drink.description}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-400">Price</p>
              <p className="mt-2 text-2xl font-bold text-amber-300">
                {formatPrice(drink.price)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-stone-400">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {drink.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-amber-200/20 px-3 py-1 text-sm text-amber-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-4">
              <h2 className="font-semibold text-white">Size</h2>
              <ul className="mt-2 space-y-2 text-sm text-stone-300">
                <li>Medium (+$0.00)</li>
                <li>Large (+$0.75)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-stone-700 bg-stone-950 p-4">
              <h2 className="font-semibold text-white">Toppings</h2>
              <ul className="mt-2 space-y-2 text-sm text-stone-300">
                <li>Boba (+$0.50)</li>
                <li>Pudding (+$0.60)</li>
                <li>Cheese Foam (+$0.90)</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-amber-300 px-5 py-3 font-semibold text-stone-900 hover:bg-amber-200"
            >
              Add to Cart
            </button>
            <Link
              href="/cart"
              className="rounded-lg border border-stone-600 px-5 py-3 font-semibold text-stone-100 hover:bg-stone-800"
            >
              Go to Cart
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

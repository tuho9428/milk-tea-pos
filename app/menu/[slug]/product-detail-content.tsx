import { AddToCartForm } from "@/app/menu/[slug]/add-to-cart-form";
import { formatPrice } from "@/lib/format";

export type ProductDetailGroup = {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: {
    id: string;
    name: string;
    priceDelta: number;
  }[];
};

export type ProductDetailData = {
  id: string;
  name: string;
  description: string | null;
  categoryName: string;
  tags: string[];
  basePrice: number;
  soldOut: boolean;
  groups: ProductDetailGroup[];
};

type ProductDetailContentProps = {
  drink: ProductDetailData;
  mode?: "page" | "modal";
};

export function ProductDetailContent({
  drink,
  mode = "page",
}: ProductDetailContentProps) {
  return (
    <section
      className={`rounded-2xl border border-stone-700 bg-stone-900/80 p-7 shadow-xl ${
        mode === "modal" ? "max-h-[85vh] overflow-y-auto" : ""
      }`}
    >
      <p className="text-xs font-semibold tracking-[0.2em] text-amber-300">
        {drink.categoryName}
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
          <p className="text-xs uppercase tracking-wide text-stone-400">Base Price</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">
            {formatPrice(drink.basePrice)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-700 bg-stone-950 p-4 md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-stone-400">Status</p>
          <div className="mt-2">
            {drink.soldOut ? (
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
          basePrice: drink.basePrice,
        }}
        groups={drink.groups}
        soldOut={drink.soldOut}
        afterAdd={mode === "modal" ? "menu" : "cart"}
        showCartLink={mode !== "modal"}
      />
    </section>
  );
}

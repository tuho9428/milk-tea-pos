import { AddToCartForm } from "@/app/menu/[slug]/add-to-cart-form";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductDetailGroup = {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  maxSelections: number;
  defaultOptionId: string | null;
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
      className={cn(
        "section-card overflow-hidden p-7 sm:p-8",
        mode === "modal" && "max-h-[85vh] overflow-y-auto",
      )}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">{drink.categoryName}</p>
            <span className={cn("status-pill", drink.soldOut ? "status-danger" : "status-success")}>
              {drink.soldOut ? "Sold Out" : "Available"}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="page-title text-[2.35rem] sm:text-[2.7rem]">{drink.name}</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
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
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="soft-panel p-5">
            <p className="eyebrow">Base Price</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              {formatPrice(drink.basePrice)}
            </p>
          </div>
          <div className="soft-panel p-5">
            <p className="eyebrow">Customization</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Choose from shared milk tea modifiers like size, sugar, ice, and
              toppings. Required groups come preselected, and multi-select groups
              use the limit set by the admin before the item can be added.
            </p>
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

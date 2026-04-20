"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import type { CartItem } from "@/lib/cart";
import { addToStoredCart } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type ModifierOptionView = {
  id: string;
  name: string;
  priceDelta: number;
};

type ModifierGroupView = {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOptionView[];
};

type AddToCartFormProps = {
  menuItem: Pick<CartItem, "menuItemId" | "name" | "basePrice">;
  groups: ModifierGroupView[];
  soldOut: boolean;
  afterAdd?: "cart" | "menu";
  showCartLink?: boolean;
};

export function AddToCartForm({
  menuItem,
  groups,
  soldOut,
  afterAdd = "cart",
  showCartLink = true,
}: AddToCartFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedModifiers = groups.flatMap((group) => {
    const selectedIds = selectedByGroup[group.id] ?? [];

    return group.options
      .filter((option) => selectedIds.includes(option.id))
      .map((option) => ({
        name: option.name,
        priceDelta: option.priceDelta,
      }));
  });

  const totalPrice =
    quantity *
    (menuItem.basePrice +
      selectedModifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0));

  function toggleOption(groupId: string, optionId: string, multiSelect: boolean) {
    setSelectedByGroup((current) => {
      const currentGroup = current[groupId] ?? [];

      if (!multiSelect) {
        return {
          ...current,
          [groupId]: [optionId],
        };
      }

      const nextGroup = currentGroup.includes(optionId)
        ? currentGroup.filter((id) => id !== optionId)
        : [...currentGroup, optionId];

      return {
        ...current,
        [groupId]: nextGroup,
      };
    });

    setErrorMessage(null);
  }

  function handleAddToCart() {
    const missingRequiredGroup = groups.find((group) => {
      if (!group.required) {
        return false;
      }

      return (selectedByGroup[group.id] ?? []).length === 0;
    });

    if (missingRequiredGroup) {
      setErrorMessage(`Please choose at least one option for ${missingRequiredGroup.name}.`);
      return;
    }

    const cartItem: CartItem = {
      menuItemId: menuItem.menuItemId,
      name: menuItem.name,
      quantity,
      basePrice: menuItem.basePrice,
      selectedModifiers,
    };

    addToStoredCart(cartItem);

    if (afterAdd === "menu") {
      router.replace("/menu");
      return;
    }

    router.push("/cart");
  }

  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {groups.map((group) => {
          const selectedIds = selectedByGroup[group.id] ?? [];

          return (
            <section key={group.id} className="soft-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">{group.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {group.multiSelect ? "Choose any" : "Choose one"}
                  {group.required ? " - Required" : " - Optional"}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {group.options.map((option) => {
                  const isSelected = selectedIds.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(group.id, option.id, group.multiSelect)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
                        isSelected
                          ? "border-primary/22 bg-primary-soft text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          : "border-border bg-card text-foreground hover:border-primary/18 hover:bg-background",
                      )}
                    >
                      <span className="font-medium">{option.name}</span>
                      <span className="text-muted-foreground">
                        {option.priceDelta === 0
                          ? formatPrice(0)
                          : `+${formatPrice(option.priceDelta)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="soft-panel mt-8 flex flex-wrap items-center justify-between gap-6 p-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">Quantity</p>
            <div className="inline-flex items-center rounded-full border border-border bg-card">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="px-4 py-2 text-foreground transition hover:bg-secondary"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="min-w-12 px-4 py-2 text-center font-medium text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                className="px-4 py-2 text-foreground transition hover:bg-secondary"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p className="eyebrow">Current Price</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              {formatPrice(totalPrice)}
            </p>
          </div>

          {selectedModifiers.length > 0 ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {selectedModifiers.map((modifier) => (
                <li key={`${menuItem.menuItemId}-${modifier.name}`}>
                  {modifier.name}
                  {modifier.priceDelta > 0 ? ` (+${formatPrice(modifier.priceDelta)})` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No modifiers selected yet.</p>
          )}

          {errorMessage ? (
            <p className="status-pill status-danger text-sm font-medium">{errorMessage}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={soldOut}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Add to Cart
          </button>
          {showCartLink ? (
            <Link
              href="/cart"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Go to Cart
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

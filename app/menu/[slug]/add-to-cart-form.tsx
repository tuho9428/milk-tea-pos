"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CartItem } from "@/lib/cart";
import { addToStoredCart } from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";

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
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {groups.map((group) => {
          const selectedIds = selectedByGroup[group.id] ?? [];

          return (
            <section
              key={group.id}
              className="rounded-xl border border-stone-700 bg-stone-950 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-white">{group.name}</h2>
                <span className="text-xs text-stone-400">
                  {group.multiSelect ? "Choose any" : "Choose one"}
                  {group.required ? " - Required" : " - Optional"}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {group.options.map((option) => {
                  const isSelected = selectedIds.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(group.id, option.id, group.multiSelect)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-amber-300 bg-amber-300/10 text-amber-100"
                          : "border-stone-700 bg-stone-900 text-stone-200 hover:border-stone-500"
                      }`}
                    >
                      <span>{option.name}</span>
                      <span className="text-sm">
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

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-700 bg-stone-950 p-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-wide text-stone-400">Quantity</p>
            <div className="inline-flex items-center rounded-lg border border-stone-700">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="px-3 py-1 text-stone-200 hover:bg-stone-800"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="min-w-10 px-3 py-1 text-center text-stone-100">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                className="px-3 py-1 text-stone-200 hover:bg-stone-800"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <p className="text-xs uppercase tracking-wide text-stone-400">Current Price</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{formatPrice(totalPrice)}</p>
          {selectedModifiers.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-stone-300">
              {selectedModifiers.map((modifier) => (
                <li key={`${menuItem.menuItemId}-${modifier.name}`}>
                  {modifier.name}
                  {modifier.priceDelta > 0 ? ` (+${formatPrice(modifier.priceDelta)})` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-500">No modifiers selected yet.</p>
          )}
          {errorMessage ? <p className="mt-2 text-sm text-red-300">{errorMessage}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={soldOut}
            className="rounded-lg bg-amber-300 px-5 py-3 font-semibold text-stone-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-stone-500 disabled:text-stone-200"
          >
            Add to Cart
          </button>
          {showCartLink ? (
            <Link
              href="/cart"
              className="rounded-lg border border-stone-600 px-5 py-3 font-semibold text-stone-100 hover:bg-stone-800"
            >
              Go to Cart
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

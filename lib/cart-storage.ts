import type { CartItem } from "@/lib/cart";

const CART_STORAGE_KEY = "milk-tea-pos-cart";
const CART_STORAGE_EVENT = "milk-tea-pos-cart-updated";

let cachedRawValue: string | null | undefined;
let cachedCart: CartItem[] = [];

export function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);

  if (rawValue === cachedRawValue) {
    return cachedCart;
  }

  if (!rawValue) {
    cachedRawValue = rawValue;
    cachedCart = [];
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      cachedRawValue = rawValue;
      cachedCart = [];
      return [];
    }

    cachedRawValue = rawValue;
    cachedCart = parsed.filter(isCartItem);
    return cachedCart;
  } catch {
    cachedRawValue = rawValue;
    cachedCart = [];
    return [];
  }
}

export function addToStoredCart(item: CartItem) {
  if (typeof window === "undefined") {
    return;
  }

  const nextCart = [...getStoredCart(), item];
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
  window.dispatchEvent(new Event(CART_STORAGE_EVENT));
}

export function clearStoredCart() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CART_STORAGE_KEY);
  cachedRawValue = null;
  cachedCart = [];
  window.dispatchEvent(new Event(CART_STORAGE_EVENT));
}

export function subscribeToStoredCart(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(CART_STORAGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(CART_STORAGE_EVENT, handleChange);
  };
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.menuItemId === "string" &&
    typeof item.name === "string" &&
    typeof item.quantity === "number" &&
    typeof item.basePrice === "number" &&
    Array.isArray(item.selectedModifiers)
  );
}

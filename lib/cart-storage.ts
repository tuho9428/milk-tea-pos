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

export function hasStoredCart() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(CART_STORAGE_KEY) !== null;
}

export function addToStoredCart(item: CartItem) {
  if (typeof window === "undefined") {
    return;
  }

  setStoredCart([...getStoredCart(), item]);
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

export function updateStoredCartItemQuantity(index: number, quantity: number) {
  if (typeof window === "undefined") {
    return;
  }

  const currentCart = getStoredCart();

  if (index < 0 || index >= currentCart.length) {
    return;
  }

  if (quantity <= 0) {
    removeStoredCartItem(index);
    return;
  }

  const nextCart = currentCart.map((item, currentIndex) =>
    currentIndex === index ? { ...item, quantity } : item,
  );

  setStoredCart(nextCart);
}

export function removeStoredCartItem(index: number) {
  if (typeof window === "undefined") {
    return;
  }

  const currentCart = getStoredCart();

  if (index < 0 || index >= currentCart.length) {
    return;
  }

  const nextCart = currentCart.filter((_, currentIndex) => currentIndex !== index);
  setStoredCart(nextCart);
}

export function subscribeToStoredCart(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  const handlePageShow = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(CART_STORAGE_EVENT, handleChange);
  window.addEventListener("pageshow", handlePageShow);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(CART_STORAGE_EVENT, handleChange);
    window.removeEventListener("pageshow", handlePageShow);
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

function setStoredCart(cartItems: CartItem[]) {
  const nextRawValue = JSON.stringify(cartItems);
  window.localStorage.setItem(CART_STORAGE_KEY, nextRawValue);
  cachedRawValue = nextRawValue;
  cachedCart = cartItems;
  window.dispatchEvent(new Event(CART_STORAGE_EVENT));
}

export type SelectedModifier = {
  name: string;
  priceDelta: number;
};

export type CartItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedModifiers: SelectedModifier[];
};

export function calculateCartLineUnitPrice(cartItem: CartItem) {
  return (
    cartItem.basePrice +
    cartItem.selectedModifiers.reduce(
      (modifierSum, modifier) => modifierSum + modifier.priceDelta,
      0,
    )
  );
}

export function calculateCartLineTotal(cartItem: CartItem) {
  return cartItem.quantity * calculateCartLineUnitPrice(cartItem);
}

export function calculateCartSubtotal(cartItems: CartItem[]) {
  return cartItems.reduce((sum, item) => sum + calculateCartLineTotal(item), 0);
}

export function getCartItemCount(cartItems: CartItem[]) {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

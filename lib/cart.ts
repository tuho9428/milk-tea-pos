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

export function calculateCartSubtotal(cartItems: CartItem[]) {
  return cartItems.reduce((sum, item) => {
    const modifierTotal = item.selectedModifiers.reduce(
      (modifierSum, modifier) => modifierSum + modifier.priceDelta,
      0,
    );

    return sum + item.quantity * (item.basePrice + modifierTotal);
  }, 0);
}

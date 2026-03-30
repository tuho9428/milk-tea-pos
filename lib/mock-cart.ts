import { prisma } from "@/lib/prisma";

export type CartItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedModifiers: {
    name: string;
    priceDelta: number;
  }[];
};

const sampleCartBySlug: Record<
  string,
  Pick<CartItem, "quantity" | "selectedModifiers">
> = {
  "brown-sugar-boba-milk-tea": {
    quantity: 1,
    selectedModifiers: [
      { name: "Large", priceDelta: 1 },
      { name: "Boba", priceDelta: 0.75 },
    ],
  },
  "sea-salt-coffee": {
    quantity: 2,
    selectedModifiers: [{ name: "Less Ice", priceDelta: 0 }],
  },
};

export async function getMockCart(): Promise<CartItem[]> {
  const preferredSlugs = Object.keys(sampleCartBySlug);

  let drinks = await prisma.menuItem.findMany({
    where: {
      slug: { in: preferredSlugs },
      isActive: true,
      isSoldOut: false,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      basePrice: true,
    },
  });

  if (drinks.length === 0) {
    drinks = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        isSoldOut: false,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        basePrice: true,
      },
      orderBy: { name: "asc" },
      take: 2,
    });
  }

  return drinks.map((drink) => {
    const sample = sampleCartBySlug[drink.slug];

    return {
      menuItemId: drink.id,
      name: drink.name,
      quantity: sample?.quantity ?? 1,
      basePrice: Number(drink.basePrice),
      selectedModifiers: sample?.selectedModifiers ?? [],
    };
  });
}

export function calculateCartSubtotal(cartItems: CartItem[]) {
  return cartItems.reduce((sum, item) => {
    const modifierTotal = item.selectedModifiers.reduce(
      (modifierSum, modifier) => modifierSum + modifier.priceDelta,
      0,
    );

    return sum + item.quantity * (item.basePrice + modifierTotal);
  }, 0);
}

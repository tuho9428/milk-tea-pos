export type MockDrink = {
  name: string;
  slug: string;
  category: "Milk Tea" | "Coffee";
  shortDescription: string;
  description: string;
  price: number;
  tags: string[];
};

export const mockDrinks: MockDrink[] = [
  {
    name: "Classic Milk Tea",
    slug: "classic-milk-tea",
    category: "Milk Tea",
    shortDescription: "Smooth black tea with creamy milk and balanced sweetness.",
    description:
      "Our house black tea blend shaken with milk for a clean, classic profile that works hot or iced.",
    price: 4.5,
    tags: ["Best Seller", "Balanced"],
  },
  {
    name: "Brown Sugar Boba Milk Tea",
    slug: "brown-sugar-boba-milk-tea",
    category: "Milk Tea",
    shortDescription: "Rich brown sugar syrup, fresh milk tea, and chewy boba.",
    description:
      "Slow-cooked brown sugar pearls with a caramel finish, layered into creamy milk tea.",
    price: 5.75,
    tags: ["Signature", "Boba"],
  },
  {
    name: "Jasmine Green Milk Tea",
    slug: "jasmine-green-milk-tea",
    category: "Milk Tea",
    shortDescription: "Floral jasmine aroma with a light and silky texture.",
    description:
      "Fragrant jasmine green tea blended with milk for a bright cup that is fresh and smooth.",
    price: 4.95,
    tags: ["Light", "Floral"],
  },
  {
    name: "Vietnamese Iced Coffee",
    slug: "vietnamese-iced-coffee",
    category: "Coffee",
    shortDescription: "Bold dark roast with sweet condensed milk over ice.",
    description:
      "Intense drip-style coffee and condensed milk for a strong, sweet, and creamy finish.",
    price: 5.25,
    tags: ["Strong", "Sweet"],
  },
  {
    name: "Sea Salt Coffee",
    slug: "sea-salt-coffee",
    category: "Coffee",
    shortDescription: "Creamy sea salt foam over a deep espresso base.",
    description:
      "A smooth contrast of savory foam and rich coffee that lands silky and balanced.",
    price: 5.5,
    tags: ["Cream Foam", "House Favorite"],
  },
];

export function getDrinkBySlug(slug: string) {
  return mockDrinks.find((drink) => drink.slug === slug);
}

export function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

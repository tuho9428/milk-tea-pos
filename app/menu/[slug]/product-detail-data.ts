import { prisma } from "@/lib/prisma";

export async function getProductDetailBySlug(slug: string) {
  const drink = await prisma.menuItem.findUnique({
    where: { slug },
    include: {
      category: true,
      groups: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!drink) {
    return null;
  }

  return {
    id: drink.id,
    name: drink.name,
    description: drink.description,
    categoryName: drink.category.name,
    tags: drink.tags,
    basePrice: Number(drink.basePrice),
    soldOut: drink.isSoldOut || !drink.isActive,
    groups: drink.groups.map((group) => ({
      id: group.id,
      name: group.name,
      required: group.required,
      multiSelect: group.multiSelect,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceDelta: Number(option.priceDelta),
      })),
    })),
  };
}

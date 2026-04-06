import { prisma } from "@/lib/prisma";

export async function getProductDetailBySlug(slug: string) {
  const drink = await prisma.menuItem.findUnique({
    where: { slug },
    include: {
      category: true,
      templateLinks: {
        orderBy: [{ sortOrder: "asc" }],
        include: {
          modifierTemplate: {
            include: {
              options: {
                orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
              },
            },
          },
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
    groups: drink.templateLinks.map((link) => ({
      id: `${link.menuItemId}:${link.modifierTemplateId}`,
      name: link.modifierTemplate.name,
      required: link.modifierTemplate.required,
      multiSelect: link.modifierTemplate.multiSelect,
      options: link.modifierTemplate.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceDelta: Number(option.priceDelta),
      })),
    })),
  };
}

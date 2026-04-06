import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { ModifierType, OrderStatus, PrismaClient } from "../app/generated/prisma/client";
import { calculateOrderPricing } from "../lib/tax";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const seededTaxRate = 0.0825;
  const seededDisplayOrderDateKey = "20260406";

  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  await prisma.category.createMany({
    data: [
      { name: "Classic Milk Tea", slug: "classic-milk-tea" },
      { name: "Fruit Tea", slug: "fruit-tea" },
      { name: "Snacks", slug: "snacks" },
    ],
  });

  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const brownSugar = await prisma.menuItem.create({
    data: {
      name: "Brown Sugar Boba Milk",
      slug: "brown-sugar-boba-milk",
      description: "Fresh milk with brown sugar pearls.",
      tags: ["Signature", "Boba", "Sweet"],
      basePrice: "5.50",
      imageUrl: "/images/brown-sugar-boba.jpg",
      categoryId: categoryBySlug.get("classic-milk-tea")!,
      groups: {
        create: [
          {
            name: "Size",
            type: ModifierType.SIZE,
            required: true,
            multiSelect: false,
            options: {
              create: [
                { name: "M", priceDelta: "0" },
                { name: "L", priceDelta: "0.75" },
              ],
            },
          },
          {
            name: "Sugar",
            type: ModifierType.SUGAR,
            required: true,
            multiSelect: false,
            options: {
              create: [
                { name: "0%", priceDelta: "0" },
                { name: "25%", priceDelta: "0" },
                { name: "50%", priceDelta: "0" },
                { name: "100%", priceDelta: "0" },
              ],
            },
          },
          {
            name: "Topping",
            type: ModifierType.TOPPING,
            required: false,
            multiSelect: true,
            options: {
              create: [
                { name: "Boba", priceDelta: "0.50" },
                { name: "Pudding", priceDelta: "0.60" },
              ],
            },
          },
        ],
      },
    },
  });

  const jasmine = await prisma.menuItem.create({
    data: {
      name: "Jasmine Green Milk Tea",
      slug: "jasmine-green-milk-tea",
      description: "Jasmine tea with creamy milk finish.",
      tags: ["Floral", "Light", "Popular"],
      basePrice: "4.90",
      imageUrl: "/images/jasmine-milk-tea.jpg",
      categoryId: categoryBySlug.get("classic-milk-tea")!,
      groups: {
        create: [
          {
            name: "Size",
            type: ModifierType.SIZE,
            required: true,
            multiSelect: false,
            options: {
              create: [
                { name: "M", priceDelta: "0" },
                { name: "L", priceDelta: "0.70" },
              ],
            },
          },
          {
            name: "Ice",
            type: ModifierType.ICE,
            required: true,
            multiSelect: false,
            options: {
              create: [
                { name: "No Ice", priceDelta: "0" },
                { name: "Less Ice", priceDelta: "0" },
                { name: "Regular Ice", priceDelta: "0" },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      name: "Passion Fruit Green Tea",
      slug: "passion-fruit-green-tea",
      description: "Refreshing sweet-tangy fruit tea.",
      tags: ["Fruity", "Refreshing", "Tea"],
      basePrice: "4.70",
      imageUrl: "/images/passion-fruit-tea.jpg",
      categoryId: categoryBySlug.get("fruit-tea")!,
      groups: {
        create: [
          {
            name: "Sugar",
            type: ModifierType.SUGAR,
            required: true,
            multiSelect: false,
            options: {
              create: [
                { name: "25%", priceDelta: "0" },
                { name: "50%", priceDelta: "0" },
                { name: "100%", priceDelta: "0" },
              ],
            },
          },
          {
            name: "Topping",
            type: ModifierType.TOPPING,
            required: false,
            multiSelect: true,
            options: {
              create: [
                { name: "Aloe Vera", priceDelta: "0.60" },
                { name: "Lychee Jelly", priceDelta: "0.60" },
              ],
            },
          },
        ],
      },
    },
  });

  const seededPricing = calculateOrderPricing(10.40, seededTaxRate);

  const order = await prisma.order.create({
    data: {
      displayOrderNumber: "001",
      displayOrderDateKey: seededDisplayOrderDateKey,
      customerName: "Walk-in Guest",
      phone: "0000000000",
      status: OrderStatus.PENDING,
      subtotal: seededPricing.subtotal,
      tax: seededPricing.tax,
      taxRateApplied: seededPricing.taxRateApplied,
      total: seededPricing.total,
      notes: "Sample seeded order",
      items: {
        create: [
          {
            menuItemId: brownSugar.id,
            quantity: 1,
            unitPrice: "6.25",
            modifiers: {
              create: [
                { name: "L", priceDelta: "0.75" },
                { name: "Boba", priceDelta: "0.50" },
              ],
            },
          },
          {
            menuItemId: jasmine.id,
            quantity: 1,
            unitPrice: "4.65",
            modifiers: {
              create: [{ name: "Less Ice", priceDelta: "0.00" }],
            },
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log("Seed completed.");
  console.log(`Created ${categories.length} categories.`);
  console.log(`Created sample order ${order.id} with ${order.items.length} item(s).`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "lib/prisma";
import { formatPrice } from "lib/format";

const modifierTypes = ["SIZE", "SUGAR", "ICE", "TOPPING", "OTHER"] as const;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function revalidateMenuPaths(menuSlug?: string) {
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  if (menuSlug) {
    revalidatePath(`/menu/${menuSlug}`);
  }
}

async function addDrinkAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const tagsInput = String(formData.get("tags") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const categoryId = String(formData.get("categoryId") ?? "");
  const tags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!name || !categoryId || !Number.isFinite(price) || price <= 0) {
    return;
  }

  const slug = toSlug(slugInput || name);

  await prisma.menuItem.create({
    data: {
      name,
      slug,
      description: description || null,
      tags,
      basePrice: price,
      categoryId,
      isActive: true,
      isSoldOut: false,
    },
  });

  revalidateMenuPaths(slug);
}

async function editDrinkAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const tagsInput = String(formData.get("tags") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const categoryId = String(formData.get("categoryId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "on";
  const tags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!id || !name || !categoryId || !Number.isFinite(price) || price <= 0) {
    return;
  }

  const slug = toSlug(slugInput || name);

  await prisma.menuItem.update({
    where: { id },
    data: {
      name,
      slug,
      description: description || null,
      tags,
      basePrice: price,
      categoryId,
      isActive,
    },
  });

  revalidateMenuPaths(slug);
}

async function toggleSoldOutAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");
  const current = String(formData.get("current") ?? "") === "true";

  if (!id) {
    return;
  }

  await prisma.menuItem.update({
    where: { id },
    data: { isSoldOut: !current },
  });

  revalidateMenuPaths(menuSlug);
}

async function addModifierGroupAction(formData: FormData) {
  "use server";

  const menuItemId = String(formData.get("menuItemId") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const required = String(formData.get("required") ?? "") === "on";
  const multiSelect = String(formData.get("multiSelect") ?? "") === "on";

  if (!menuItemId || !name || !modifierTypes.includes(type as (typeof modifierTypes)[number])) {
    return;
  }

  await prisma.modifierGroup.create({
    data: {
      menuItemId,
      name,
      type: type as (typeof modifierTypes)[number],
      required,
      multiSelect,
    },
  });

  revalidateMenuPaths(menuSlug);
}

async function editModifierGroupAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const required = String(formData.get("required") ?? "") === "on";
  const multiSelect = String(formData.get("multiSelect") ?? "") === "on";

  if (!id || !name || !modifierTypes.includes(type as (typeof modifierTypes)[number])) {
    return;
  }

  await prisma.modifierGroup.update({
    where: { id },
    data: {
      name,
      type: type as (typeof modifierTypes)[number],
      required,
      multiSelect,
    },
  });

  revalidateMenuPaths(menuSlug);
}

async function deleteModifierGroupAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");

  if (!id) {
    return;
  }

  await prisma.$transaction([
    prisma.modifierOption.deleteMany({
      where: { modifierGroupId: id },
    }),
    prisma.modifierGroup.delete({
      where: { id },
    }),
  ]);

  revalidateMenuPaths(menuSlug);
}

async function addModifierOptionAction(formData: FormData) {
  "use server";

  const modifierGroupId = String(formData.get("modifierGroupId") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);

  if (!modifierGroupId || !name || !Number.isFinite(priceDelta)) {
    return;
  }

  await prisma.modifierOption.create({
    data: {
      modifierGroupId,
      name,
      priceDelta,
    },
  });

  revalidateMenuPaths(menuSlug);
}

async function editModifierOptionAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);

  if (!id || !name || !Number.isFinite(priceDelta)) {
    return;
  }

  await prisma.modifierOption.update({
    where: { id },
    data: {
      name,
      priceDelta,
    },
  });

  revalidateMenuPaths(menuSlug);
}

async function deleteModifierOptionAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");

  if (!id) {
    return;
  }

  await prisma.modifierOption.delete({
    where: { id },
  });

  revalidateMenuPaths(menuSlug);
}

async function addModifierTemplateAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const required = String(formData.get("required") ?? "") === "on";
  const multiSelect = String(formData.get("multiSelect") ?? "") === "on";

  if (!name || !modifierTypes.includes(type as (typeof modifierTypes)[number])) {
    return;
  }

  await prisma.modifierTemplate.create({
    data: {
      name,
      type: type as (typeof modifierTypes)[number],
      required,
      multiSelect,
    },
  });

  revalidateMenuPaths();
}

async function editModifierTemplateAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const required = String(formData.get("required") ?? "") === "on";
  const multiSelect = String(formData.get("multiSelect") ?? "") === "on";

  if (!id || !name || !modifierTypes.includes(type as (typeof modifierTypes)[number])) {
    return;
  }

  await prisma.modifierTemplate.update({
    where: { id },
    data: {
      name,
      type: type as (typeof modifierTypes)[number],
      required,
      multiSelect,
    },
  });

  revalidateMenuPaths();
}

async function deleteModifierTemplateAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.modifierTemplate.delete({
    where: { id },
  });

  revalidateMenuPaths();
}

async function addModifierTemplateOptionAction(formData: FormData) {
  "use server";

  const modifierTemplateId = String(formData.get("modifierTemplateId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);

  if (!modifierTemplateId || !name || !Number.isFinite(priceDelta)) {
    return;
  }

  await prisma.modifierTemplateOption.create({
    data: {
      modifierTemplateId,
      name,
      priceDelta,
    },
  });

  revalidateMenuPaths();
}

async function editModifierTemplateOptionAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);

  if (!id || !name || !Number.isFinite(priceDelta)) {
    return;
  }

  await prisma.modifierTemplateOption.update({
    where: { id },
    data: {
      name,
      priceDelta,
    },
  });

  revalidateMenuPaths();
}

async function deleteModifierTemplateOptionAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.modifierTemplateOption.delete({
    where: { id },
  });

  revalidateMenuPaths();
}

async function applyModifierTemplateToDrinkAction(formData: FormData) {
  "use server";

  const menuItemId = String(formData.get("menuItemId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const menuSlug = String(formData.get("menuSlug") ?? "");

  if (!menuItemId || !templateId) {
    return;
  }

  const template = await prisma.modifierTemplate.findUnique({
    where: { id: templateId },
    include: {
      options: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!template) {
    return;
  }

  const existingGroup = await prisma.modifierGroup.findFirst({
    where: {
      menuItemId,
      templateId,
    },
    select: { id: true },
  });

  if (existingGroup) {
    return;
  }

  await prisma.modifierGroup.create({
    data: {
      menuItemId,
      templateId: template.id,
      name: template.name,
      type: template.type,
      required: template.required,
      multiSelect: template.multiSelect,
      options: {
        create: template.options.map((option) => ({
          name: option.name,
          priceDelta: option.priceDelta,
        })),
      },
    },
  });

  revalidateMenuPaths(menuSlug);
}

export default async function AdminMenuPage() {
  const [categories, templates, drinks] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.modifierTemplate.findMany({
      include: {
        options: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.menuItem.findMany({
      include: {
        category: true,
        groups: {
          include: {
            options: {
              orderBy: { name: "asc" },
            },
            template: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-stone-700 bg-stone-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-amber-300">
                ADMIN
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">Menu Manager</h1>
              <p className="mt-1 text-sm text-stone-300">
                Backed by Prisma queries and server actions.
              </p>
            </div>
            <Link
              href="/menu"
              className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
            >
              View Customer Menu
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-stone-700 bg-stone-900/80 p-5">
          <h2 className="text-xl font-semibold text-white">Modifier Templates</h2>
          <p className="mt-1 text-sm text-stone-400">
            Create shared presets like Size, Sugar Level, and Ice Level. Applying a
            template clones it into a menu item so the current ordering flow stays
            compatible.
          </p>

          <form
            action={addModifierTemplateAction}
            className="mt-4 grid gap-3 rounded-xl border border-dashed border-stone-600 bg-stone-950 p-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              name="name"
              placeholder="Template name"
              className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              required
            />
            <select
              name="type"
              defaultValue="OTHER"
              className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
            >
              {modifierTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300">
              <input
                name="required"
                type="checkbox"
                className="h-4 w-4 rounded border-stone-500 bg-stone-900"
              />
              Required
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300">
              <input
                name="multiSelect"
                type="checkbox"
                className="h-4 w-4 rounded border-stone-500 bg-stone-900"
              />
              Multi-select
            </label>
            <button
              type="submit"
              className="lg:col-span-4 rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
            >
              Add Template
            </button>
          </form>

          <div className="mt-4 space-y-4">
            {templates.length === 0 ? (
              <p className="text-sm text-stone-400">No templates created yet.</p>
            ) : (
              templates.map((template) => (
                <section
                  key={template.id}
                  className="rounded-xl border border-stone-700 bg-stone-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <form
                      action={editModifierTemplateAction}
                      className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                    >
                      <input type="hidden" name="id" value={template.id} />
                      <input
                        name="name"
                        defaultValue={template.name}
                        className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                        required
                      />
                      <select
                        name="type"
                        defaultValue={template.type}
                        className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                      >
                        {modifierTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300">
                        <input
                          name="required"
                          type="checkbox"
                          defaultChecked={template.required}
                          className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                        />
                        Required
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300">
                        <input
                          name="multiSelect"
                          type="checkbox"
                          defaultChecked={template.multiSelect}
                          className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                        />
                        Multi-select
                      </label>
                      <button
                        type="submit"
                        className="rounded-lg border border-stone-500 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800 lg:col-span-3"
                      >
                        Save Template
                      </button>
                    </form>

                    <form action={deleteModifierTemplateAction}>
                      <input type="hidden" name="id" value={template.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-red-300 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-200"
                      >
                        Delete Template
                      </button>
                    </form>
                  </div>

                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-stone-300">Template Options</p>

                    {template.options.length === 0 ? (
                      <p className="text-sm text-stone-500">
                        No options yet in this template.
                      </p>
                    ) : (
                      template.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex flex-wrap items-start gap-3 rounded-lg border border-stone-700 bg-stone-900 p-3"
                        >
                          <form
                            action={editModifierTemplateOptionAction}
                            className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
                          >
                            <input type="hidden" name="id" value={option.id} />
                            <input
                              name="name"
                              defaultValue={option.name}
                              className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                              required
                            />
                            <input
                              name="priceDelta"
                              type="number"
                              step="0.01"
                              defaultValue={Number(option.priceDelta)}
                              className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                              required
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-stone-500 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                            >
                              Save Option
                            </button>
                          </form>

                          <form action={deleteModifierTemplateOptionAction}>
                            <input type="hidden" name="id" value={option.id} />
                            <button
                              type="submit"
                              className="rounded-lg bg-red-300 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      ))
                    )}

                    <form
                      action={addModifierTemplateOptionAction}
                      className="grid gap-3 rounded-lg border border-dashed border-stone-600 bg-stone-900 p-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
                    >
                      <input type="hidden" name="modifierTemplateId" value={template.id} />
                      <input
                        name="name"
                        placeholder="New option name"
                        className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                        required
                      />
                      <input
                        name="priceDelta"
                        type="number"
                        step="0.01"
                        defaultValue="0"
                        className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                        required
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
                      >
                        Add Option
                      </button>
                    </form>
                  </div>
                </section>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-700 bg-stone-900/80 p-5">
          <h2 className="text-xl font-semibold text-white">Add Drink</h2>
          <form action={addDrinkAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Drink name"
              className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              required
            />
            <input
              name="slug"
              placeholder="Slug (optional)"
              className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
            />
            <select
              name="categoryId"
              className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Base price"
              className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              className="sm:col-span-2 min-h-20 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
            />
            <input
              name="tags"
              placeholder="Quick tags (comma separated)"
              className="sm:col-span-2 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
            >
              Add Drink
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-stone-700 bg-stone-900/80 p-5">
          <h2 className="text-xl font-semibold text-white">Drinks</h2>
          <div className="mt-4 grid gap-3">
            {drinks.map((drink) => (
              <article
                key={drink.id}
                className="rounded-xl border border-stone-700 bg-stone-950 p-4"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold text-white">
                    {drink.name}{" "}
                    <span className="text-sm font-normal text-stone-400">
                      ({formatPrice(Number(drink.basePrice))})
                    </span>
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      drink.isSoldOut
                        ? "bg-red-900/40 text-red-200"
                        : "bg-emerald-900/40 text-emerald-200"
                    }`}
                  >
                    {drink.isSoldOut ? "Sold Out" : "Available"}
                  </span>
                </div>

                <form action={editDrinkAction} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={drink.id} />
                  <input
                    name="name"
                    defaultValue={drink.name}
                    className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                    required
                  />
                  <input
                    name="slug"
                    defaultValue={drink.slug}
                    className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                    required
                  />
                  <select
                    name="categoryId"
                    defaultValue={drink.categoryId}
                    className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={Number(drink.basePrice)}
                    className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                    required
                  />
                  <textarea
                    name="description"
                    defaultValue={drink.description ?? ""}
                    className="sm:col-span-2 min-h-20 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                  />
                  <input
                    name="tags"
                    defaultValue={drink.tags.join(", ")}
                    className="sm:col-span-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                  />
                  <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-stone-300">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={drink.isActive}
                      className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                    />
                    Active
                  </label>

                  <div className="sm:col-span-2 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="rounded-lg border border-stone-500 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>

                <section className="mt-4 rounded-xl border border-stone-700 bg-stone-900 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-white">Modifier Groups</h3>
                      <p className="text-sm text-stone-400">
                        Mix reusable templates with item-specific groups.
                      </p>
                    </div>
                    <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-semibold text-stone-300">
                      {drink.groups.length} group{drink.groups.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-stone-600 bg-stone-950 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <form
                      action={applyModifierTemplateToDrinkAction}
                      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <input type="hidden" name="menuItemId" value={drink.id} />
                      <input type="hidden" name="menuSlug" value={drink.slug} />
                      <select
                        name="templateId"
                        className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                        defaultValue=""
                        required
                      >
                        <option value="" disabled>
                          Attach a reusable modifier template
                        </option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.options.length} option
                            {template.options.length === 1 ? "" : "s"})
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
                      >
                        Apply Template
                      </button>
                    </form>
                    {templates.length === 0 ? (
                      <p className="text-sm text-stone-500">
                        Create templates above to reuse common modifier sets.
                      </p>
                    ) : null}
                  </div>

                  <form
                    action={addModifierGroupAction}
                    className="mt-4 grid gap-3 rounded-xl border border-dashed border-stone-600 bg-stone-950 p-4 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    <input type="hidden" name="menuItemId" value={drink.id} />
                    <input type="hidden" name="menuSlug" value={drink.slug} />
                    <input
                      name="name"
                      placeholder="New group name"
                      className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                      required
                    />
                    <select
                      name="type"
                      defaultValue="OTHER"
                      className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                    >
                      {modifierTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300">
                      <input
                        name="required"
                        type="checkbox"
                        className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                      />
                      Required
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300">
                      <input
                        name="multiSelect"
                        type="checkbox"
                        className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                      />
                      Multi-select
                    </label>
                    <button
                      type="submit"
                      className="lg:col-span-4 rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
                    >
                      Add Modifier Group
                    </button>
                  </form>

                  <div className="mt-4 space-y-4">
                    {drink.groups.length === 0 ? (
                      <p className="text-sm text-stone-400">
                        No modifier groups yet for this menu item.
                      </p>
                    ) : (
                      drink.groups.map((group) => (
                        <section
                          key={group.id}
                          className="rounded-xl border border-stone-700 bg-stone-950 p-4"
                        >
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {group.template ? (
                              <span className="rounded-full bg-amber-200/20 px-3 py-1 text-xs font-semibold text-amber-200">
                                From template: {group.template.name}
                              </span>
                            ) : (
                              <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-semibold text-stone-300">
                                Custom group
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <form
                              action={editModifierGroupAction}
                              className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                            >
                              <input type="hidden" name="id" value={group.id} />
                              <input type="hidden" name="menuSlug" value={drink.slug} />
                              <input
                                name="name"
                                defaultValue={group.name}
                                className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                                required
                              />
                              <select
                                name="type"
                                defaultValue={group.type}
                                className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                              >
                                {modifierTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300">
                                <input
                                  name="required"
                                  type="checkbox"
                                  defaultChecked={group.required}
                                  className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                                />
                                Required
                              </label>
                              <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-300">
                                <input
                                  name="multiSelect"
                                  type="checkbox"
                                  defaultChecked={group.multiSelect}
                                  className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                                />
                                Multi-select
                              </label>
                              <button
                                type="submit"
                                className="rounded-lg border border-stone-500 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800 lg:col-span-3"
                              >
                                Save Group
                              </button>
                            </form>

                            <form action={deleteModifierGroupAction}>
                              <input type="hidden" name="id" value={group.id} />
                              <input type="hidden" name="menuSlug" value={drink.slug} />
                              <button
                                type="submit"
                                className="rounded-lg bg-red-300 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-200"
                              >
                                Delete Group
                              </button>
                            </form>
                          </div>

                          <div className="mt-4 space-y-3">
                            <p className="text-sm font-medium text-stone-300">
                              Options
                            </p>

                            {group.options.length === 0 ? (
                              <p className="text-sm text-stone-500">
                                No options yet in this group.
                              </p>
                            ) : (
                              group.options.map((option) => (
                                <div
                                  key={option.id}
                                  className="flex flex-wrap items-start gap-3 rounded-lg border border-stone-700 bg-stone-900 p-3"
                                >
                                  <form
                                    action={editModifierOptionAction}
                                    className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
                                  >
                                    <input type="hidden" name="id" value={option.id} />
                                    <input type="hidden" name="menuSlug" value={drink.slug} />
                                    <input
                                      name="name"
                                      defaultValue={option.name}
                                      className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                                      required
                                    />
                                    <input
                                      name="priceDelta"
                                      type="number"
                                      step="0.01"
                                      defaultValue={Number(option.priceDelta)}
                                      className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                                      required
                                    />
                                    <button
                                      type="submit"
                                      className="rounded-lg border border-stone-500 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                                    >
                                      Save Option
                                    </button>
                                  </form>

                                  <form action={deleteModifierOptionAction}>
                                    <input type="hidden" name="id" value={option.id} />
                                    <input type="hidden" name="menuSlug" value={drink.slug} />
                                    <button
                                      type="submit"
                                      className="rounded-lg bg-red-300 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-200"
                                    >
                                      Delete
                                    </button>
                                  </form>
                                </div>
                              ))
                            )}

                            <form
                              action={addModifierOptionAction}
                              className="grid gap-3 rounded-lg border border-dashed border-stone-600 bg-stone-900 p-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
                            >
                              <input
                                type="hidden"
                                name="modifierGroupId"
                                value={group.id}
                              />
                              <input type="hidden" name="menuSlug" value={drink.slug} />
                              <input
                                name="name"
                                placeholder="New option name"
                                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                                required
                              />
                              <input
                                name="priceDelta"
                                type="number"
                                step="0.01"
                                defaultValue="0"
                                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                                required
                              />
                              <button
                                type="submit"
                                className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
                              >
                                Add Option
                              </button>
                            </form>
                          </div>
                        </section>
                      ))
                    )}
                  </div>
                </section>

                {drink.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {drink.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-amber-200/20 px-3 py-1 text-xs font-semibold text-amber-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <form action={toggleSoldOutAction} className="mt-3">
                  <input type="hidden" name="id" value={drink.id} />
                  <input type="hidden" name="menuSlug" value={drink.slug} />
                  <input type="hidden" name="current" value={String(drink.isSoldOut)} />
                  <button
                    type="submit"
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      drink.isSoldOut
                        ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                        : "bg-red-300 text-red-950 hover:bg-red-200"
                    }`}
                  >
                    {drink.isSoldOut ? "Mark Available" : "Mark Sold Out"}
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

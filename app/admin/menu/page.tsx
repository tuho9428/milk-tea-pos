import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "lib/prisma";
import { formatPrice } from "lib/format";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
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

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

async function toggleSoldOutAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const current = String(formData.get("current") ?? "") === "true";

  if (!id) {
    return;
  }

  await prisma.menuItem.update({
    where: { id },
    data: { isSoldOut: !current },
  });

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export default async function AdminMenuPage() {
  const [categories, drinks] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.menuItem.findMany({
      include: { category: true },
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

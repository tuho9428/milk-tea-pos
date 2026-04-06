import Link from "next/link";

import {
  addMenuItemAction,
  moveMenuItemDownAction,
  moveMenuItemUpAction,
  toggleSoldOutAction,
} from "@/app/admin/menu/actions";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AdminMenuPage() {
  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.menuItem.findMany({
      include: {
        category: true,
        templateLinks: {
          include: {
            modifierTemplate: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ sortOrder: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
                Order menu items manually and attach shared modifier templates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-lg border border-stone-600 bg-amber-300 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-200"
              >
                Admin Dashboard
              </Link>
              <Link
                href="/admin/modifiers"
                className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
              >
                Modifier Templates
              </Link>
              <Link
                href="/menu"
                className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
              >
                Customer Menu
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-stone-700 bg-stone-900/80 p-5">
          <h2 className="text-xl font-semibold text-white">Add Menu Item</h2>
          <form action={addMenuItemAction} className="mt-4 grid gap-3 sm:grid-cols-2">
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
              Add Menu Item
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-stone-700 bg-stone-900/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Menu Items</h2>
            <p className="text-sm text-stone-400">
              Displayed by manual order, not by name.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {menuItems.map((item, index) => (
              <Card
                key={item.id}
                className="border border-stone-700 bg-stone-950 py-0 text-stone-100"
              >
                <CardContent className="space-y-4 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.2em] text-stone-400">
                        POSITION {index + 1}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">{item.name}</h3>
                      <p className="mt-1 text-sm text-stone-400">
                        {item.category.name} · {formatPrice(Number(item.basePrice))}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <form action={moveMenuItemUpAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move Up
                        </button>
                      </form>
                      <form action={moveMenuItemDownAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          disabled={index === menuItems.length - 1}
                          className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move Down
                        </button>
                      </form>
                      <Link
                        href={`/admin/menu/${item.id}`}
                        className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-200"
                      >
                        Edit Item
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isSoldOut
                          ? "bg-red-900/40 text-red-200"
                          : "bg-emerald-900/40 text-emerald-200"
                      }`}
                    >
                      {item.isSoldOut ? "Sold Out" : "Available"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isActive
                          ? "bg-sky-900/40 text-sky-200"
                          : "bg-stone-800 text-stone-300"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-amber-200/20 px-3 py-1 text-xs font-semibold text-amber-200">
                      {item.templateLinks.length} template
                      {item.templateLinks.length === 1 ? "" : "s"} attached
                    </span>
                  </div>

                  {item.templateLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.templateLinks.map((link) => (
                        <span
                          key={link.modifierTemplate.id}
                          className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-200"
                        >
                          {link.modifierTemplate.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500">No templates attached yet.</p>
                  )}

                  <form action={toggleSoldOutAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="menuSlug" value={item.slug} />
                    <input type="hidden" name="current" value={String(item.isSoldOut)} />
                    <button
                      type="submit"
                      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                        item.isSoldOut
                          ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                          : "bg-red-300 text-red-950 hover:bg-red-200"
                      }`}
                    >
                      {item.isSoldOut ? "Mark Available" : "Mark Sold Out"}
                    </button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}


import Link from "next/link";
import { notFound } from "next/navigation";

import {
  attachModifierTemplateAction,
  detachModifierTemplateAction,
  moveAttachedModifierTemplateDownAction,
  moveAttachedModifierTemplateUpAction,
  moveMenuItemDownAction,
  moveMenuItemUpAction,
  toggleSoldOutAction,
  updateMenuItemAction,
} from "@/app/admin/menu/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type AdminMenuItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMenuItemPage({
  params,
}: AdminMenuItemPageProps) {
  const { id } = await params;

  const [categories, templates, menuItem, orderedMenuItems] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.modifierTemplate.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        required: true,
        multiSelect: true,
        _count: {
          select: {
            options: true,
          },
        },
      },
    }),
    prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        templateLinks: {
          include: {
            modifierTemplate: {
              select: {
                id: true,
                name: true,
                type: true,
                required: true,
                multiSelect: true,
                _count: {
                  select: {
                    options: true,
                  },
                },
              },
            },
          },
          orderBy: [{ sortOrder: "asc" }],
        },
      },
    }),
    prisma.menuItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
      },
    }),
  ]);

  if (!menuItem) {
    notFound();
  }

  const attachedTemplateIds = new Set(
    menuItem.templateLinks.map((link) => link.modifierTemplate.id),
  );
  const availableTemplates = templates.filter((template) => !attachedTemplateIds.has(template.id));
  const itemIndex = orderedMenuItems.findIndex((item) => item.id === menuItem.id);

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/menu"
            className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
          >
            Back to Menu Manager
          </Link>
          <div className="flex flex-wrap gap-2">
            <form action={moveMenuItemUpAction}>
              <input type="hidden" name="id" value={menuItem.id} />
              <button
                type="submit"
                disabled={itemIndex <= 0}
                className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move Up
              </button>
            </form>
            <form action={moveMenuItemDownAction}>
              <input type="hidden" name="id" value={menuItem.id} />
              <button
                type="submit"
                disabled={itemIndex < 0 || itemIndex === orderedMenuItems.length - 1}
                className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move Down
              </button>
            </form>
          </div>
        </div>

        <Card className="border border-stone-700 bg-stone-900/80 py-0 text-stone-100">
          <CardHeader className="border-b border-stone-700 px-6 py-6">
            <CardTitle className="text-3xl font-bold text-white">{menuItem.name}</CardTitle>
            <CardDescription className="text-stone-400">
              Edit basic fields and attach shared modifier templates only.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-6">
            <form action={updateMenuItemAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={menuItem.id} />
              <input
                name="name"
                defaultValue={menuItem.name}
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                required
              />
              <input
                name="slug"
                defaultValue={menuItem.slug}
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                required
              />
              <select
                name="categoryId"
                defaultValue={menuItem.categoryId}
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
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
                defaultValue={Number(menuItem.basePrice)}
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                required
              />
              <textarea
                name="description"
                defaultValue={menuItem.description ?? ""}
                className="sm:col-span-2 min-h-24 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              />
              <input
                name="tags"
                defaultValue={menuItem.tags.join(", ")}
                className="sm:col-span-2 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              />
              <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-stone-300">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={menuItem.isActive}
                  className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                />
                Active
              </label>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3 text-sm text-stone-400">
                <span>Current position: {itemIndex + 1}</span>
                <span>Base price: {formatPrice(Number(menuItem.basePrice))}</span>
              </div>
              <button
                type="submit"
                className="sm:col-span-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
              >
                Save Menu Item
              </button>
            </form>

            <form action={toggleSoldOutAction} className="mt-4">
              <input type="hidden" name="id" value={menuItem.id} />
              <input type="hidden" name="menuSlug" value={menuItem.slug} />
              <input type="hidden" name="current" value={String(menuItem.isSoldOut)} />
              <button
                type="submit"
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  menuItem.isSoldOut
                    ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                    : "bg-red-300 text-red-950 hover:bg-red-200"
                }`}
              >
                {menuItem.isSoldOut ? "Mark Available" : "Mark Sold Out"}
              </button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-stone-700 bg-stone-900/80 py-0 text-stone-100">
          <CardHeader className="border-b border-stone-700 px-6 py-5">
            <CardTitle className="text-xl font-semibold text-white">
              Attached Modifier Templates
            </CardTitle>
            <CardDescription className="text-stone-400">
              Menu items can only use shared templates. Reorder or detach them here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-6">
            <form
              action={attachModifierTemplateAction}
              className="grid gap-3 rounded-xl border border-dashed border-stone-600 bg-stone-950 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <input type="hidden" name="menuItemId" value={menuItem.id} />
              <input type="hidden" name="menuSlug" value={menuItem.slug} />
              <select
                name="modifierTemplateId"
                defaultValue=""
                className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                required
              >
                <option value="" disabled>
                  Attach a modifier template
                </option>
                {availableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.type} · {template._count.options} option
                    {template._count.options === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={availableTemplates.length === 0}
                className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Attach Template
              </button>
            </form>

            {menuItem.templateLinks.length === 0 ? (
              <p className="text-sm text-stone-400">No templates attached yet.</p>
            ) : (
              menuItem.templateLinks.map((link, index) => (
                <div
                  key={link.modifierTemplate.id}
                  className="rounded-xl border border-stone-700 bg-stone-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.2em] text-stone-400">
                        TEMPLATE {index + 1}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">
                        {link.modifierTemplate.name}
                      </h3>
                      <p className="mt-1 text-sm text-stone-400">
                        {link.modifierTemplate.type} ·{" "}
                        {link.modifierTemplate.required ? "Required" : "Optional"} ·{" "}
                        {link.modifierTemplate.multiSelect ? "Multi-select" : "Single-select"} ·{" "}
                        {link.modifierTemplate._count.options} option
                        {link.modifierTemplate._count.options === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <form action={moveAttachedModifierTemplateUpAction}>
                        <input type="hidden" name="menuItemId" value={menuItem.id} />
                        <input
                          type="hidden"
                          name="modifierTemplateId"
                          value={link.modifierTemplate.id}
                        />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move Up
                        </button>
                      </form>
                      <form action={moveAttachedModifierTemplateDownAction}>
                        <input type="hidden" name="menuItemId" value={menuItem.id} />
                        <input
                          type="hidden"
                          name="modifierTemplateId"
                          value={link.modifierTemplate.id}
                        />
                        <button
                          type="submit"
                          disabled={index === menuItem.templateLinks.length - 1}
                          className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move Down
                        </button>
                      </form>
                      <form action={detachModifierTemplateAction}>
                        <input type="hidden" name="menuItemId" value={menuItem.id} />
                        <input type="hidden" name="menuSlug" value={menuItem.slug} />
                        <input
                          type="hidden"
                          name="modifierTemplateId"
                          value={link.modifierTemplate.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-red-300 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-200"
                        >
                          Detach
                        </button>
                      </form>
                      <Link
                        href={`/admin/modifiers/${link.modifierTemplate.id}`}
                        className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
                      >
                        Edit Template
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

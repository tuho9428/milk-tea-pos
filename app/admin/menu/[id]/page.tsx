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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

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
    <main className="page-shell">
      <div className="page-wrap space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/menu"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to Menu Manager
          </Link>
          <div className="flex flex-wrap gap-2">
            <form action={moveMenuItemUpAction}>
              <input type="hidden" name="id" value={menuItem.id} />
              <button
                type="submit"
                disabled={itemIndex <= 0}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Move Up
              </button>
            </form>
            <form action={moveMenuItemDownAction}>
              <input type="hidden" name="id" value={menuItem.id} />
              <button
                type="submit"
                disabled={itemIndex < 0 || itemIndex === orderedMenuItems.length - 1}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Move Down
              </button>
            </form>
          </div>
        </div>

        <Card className="hero-panel">
          <CardHeader className="relative z-10 border-b border-border">
            <CardTitle className="page-title text-[2.15rem]">{menuItem.name}</CardTitle>
            <CardDescription>
              Edit basic fields and attach shared modifier templates only.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-6">
            <form action={updateMenuItemAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={menuItem.id} />
              <Input name="name" defaultValue={menuItem.name} required />
              <Input name="slug" defaultValue={menuItem.slug} required />
              <select name="categoryId" defaultValue={menuItem.categoryId} className="field-select" required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={Number(menuItem.basePrice)}
                required
              />
              <Textarea
                name="description"
                defaultValue={menuItem.description ?? ""}
                className="sm:col-span-2 min-h-24"
              />
              <Input
                name="tags"
                defaultValue={menuItem.tags.join(", ")}
                className="sm:col-span-2"
              />
              <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={menuItem.isActive}
                  className="field-checkbox"
                />
                Active
              </label>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>Current position: {itemIndex + 1}</span>
                <span>Base price: {formatPrice(Number(menuItem.basePrice))}</span>
              </div>
              <button type="submit" className={cn(buttonVariants({ size: "sm" }), "sm:col-span-2 w-fit")}>
                Save Menu Item
              </button>
            </form>

            <form action={toggleSoldOutAction} className="mt-4">
              <input type="hidden" name="id" value={menuItem.id} />
              <input type="hidden" name="menuSlug" value={menuItem.slug} />
              <input type="hidden" name="current" value={String(menuItem.isSoldOut)} />
              <button
                type="submit"
                className={cn(
                  buttonVariants({
                    variant: menuItem.isSoldOut ? "secondary" : "destructive",
                    size: "sm",
                  }),
                )}
              >
                {menuItem.isSoldOut ? "Mark Available" : "Mark Sold Out"}
              </button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Attached Modifier Templates</CardTitle>
            <CardDescription>
              Menu items can only use shared templates. Reorder or detach them here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form
              action={attachModifierTemplateAction}
              className="soft-panel grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <input type="hidden" name="menuItemId" value={menuItem.id} />
              <input type="hidden" name="menuSlug" value={menuItem.slug} />
              <select
                name="modifierTemplateId"
                defaultValue=""
                className="field-select"
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
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Attach Template
              </button>
            </form>

            {menuItem.templateLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates attached yet.</p>
            ) : (
              menuItem.templateLinks.map((link, index) => (
                <div key={link.modifierTemplate.id} className="soft-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">Template {index + 1}</p>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">
                        {link.modifierTemplate.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="default">{link.modifierTemplate.type}</Badge>
                        <Badge variant={link.modifierTemplate.required ? "warning" : "default"}>
                          {link.modifierTemplate.required ? "Required" : "Optional"}
                        </Badge>
                        <Badge variant={link.modifierTemplate.multiSelect ? "primary" : "default"}>
                          {link.modifierTemplate.multiSelect ? "Multi-select" : "Single-select"}
                        </Badge>
                        <Badge variant="success">
                          {link.modifierTemplate._count.options} option
                          {link.modifierTemplate._count.options === 1 ? "" : "s"}
                        </Badge>
                      </div>
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
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
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
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
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
                          className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
                        >
                          Detach
                        </button>
                      </form>
                      <Link
                        href={`/admin/modifiers/${link.modifierTemplate.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
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

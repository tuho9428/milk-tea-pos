import Link from "next/link";

import {
  addMenuItemAction,
  moveMenuItemDownAction,
  moveMenuItemUpAction,
  toggleSoldOutAction,
} from "@/app/admin/menu/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

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
    <main className="page-shell">
      <div className="page-wrap-wide space-y-6">
        <section className="hero-panel px-6 py-7 sm:px-8">
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="eyebrow">Admin</p>
              <h1 className="page-title">Menu Manager</h1>
              <p className="page-description">
                Order menu items manually and attach shared modifier templates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className={cn(buttonVariants({ size: "sm" }))}>
                Dashboard
              </Link>
              <Link
                href="/admin/modifiers"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Modifier Templates
              </Link>
              <Link
                href="/menu"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
              >
                Customer Menu
              </Link>
            </div>
          </div>
        </section>

        <Card>
          <CardHeader className="border-b border-border">
            <div className="space-y-2">
              <p className="eyebrow">Create</p>
              <CardTitle>Add Menu Item</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={addMenuItemAction} className="grid gap-4 sm:grid-cols-2">
              <Input name="name" placeholder="Drink name" required />
              <Input name="slug" placeholder="Slug (optional)" />
              <select name="categoryId" className="field-select" required>
                <option value="">Select category</option>
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
                placeholder="Base price"
                required
              />
              <Textarea
                name="description"
                placeholder="Description"
                className="sm:col-span-2 min-h-24"
              />
              <Input
                name="tags"
                placeholder="Quick tags (comma separated)"
                className="sm:col-span-2"
              />
              <button
                type="submit"
                className={cn(buttonVariants({ size: "sm" }), "sm:col-span-2 w-fit")}
              >
                Add Menu Item
              </button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <p className="eyebrow">Current Menu</p>
              <h2 className="section-title">Menu Items</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Displayed by manual order, not by name.
            </p>
          </div>

          <div className="grid gap-4">
            {menuItems.map((item, index) => (
              <Card key={item.id}>
                <CardContent className="space-y-5 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="eyebrow">Position {index + 1}</p>
                      <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.category.name} · {formatPrice(Number(item.basePrice))}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <form action={moveMenuItemUpAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Move Up
                        </button>
                      </form>
                      <form action={moveMenuItemDownAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          disabled={index === menuItems.length - 1}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Move Down
                        </button>
                      </form>
                      <Link
                        href={`/admin/menu/${item.id}`}
                        className={cn(buttonVariants({ size: "sm" }))}
                      >
                        Edit Item
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={item.isSoldOut ? "destructive" : "success"}>
                      {item.isSoldOut ? "Sold Out" : "Available"}
                    </Badge>
                    <Badge variant={item.isActive ? "primary" : "default"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="warning">
                      {item.templateLinks.length} template
                      {item.templateLinks.length === 1 ? "" : "s"} attached
                    </Badge>
                  </div>

                  {item.templateLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.templateLinks.map((link) => (
                        <span key={link.modifierTemplate.id} className="chip">
                          {link.modifierTemplate.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No templates attached yet.</p>
                  )}

                  <form action={toggleSoldOutAction} className="border-t border-border pt-4">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="menuSlug" value={item.slug} />
                    <input type="hidden" name="current" value={String(item.isSoldOut)} />
                    <button
                      type="submit"
                      className={cn(
                        buttonVariants({
                          variant: item.isSoldOut ? "secondary" : "destructive",
                          size: "sm",
                        }),
                      )}
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

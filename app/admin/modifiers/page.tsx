import Link from "next/link";

import {
  addModifierTemplateAction,
  deleteModifierTemplateAction,
} from "@/app/admin/modifiers/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const modifierTypes = ["SIZE", "SUGAR", "ICE", "TOPPING", "OTHER"] as const;

export default async function AdminModifiersPage() {
  const templates = await prisma.modifierTemplate.findMany({
    include: {
      _count: {
        select: {
          options: true,
          menuItems: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  return (
    <main className="page-shell">
      <div className="page-wrap">
        <section className="hero-panel px-6 py-7 sm:px-8">
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="eyebrow">Admin</p>
              <h1 className="page-title">Modifier Templates</h1>
              <p className="page-description">
                Manage shared modifier sets like size, sugar, ice, and toppings.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className={cn(buttonVariants({ size: "sm" }))}>
                Dashboard
              </Link>
              <Link
                href="/admin/menu"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Menu Manager
              </Link>
            </div>
          </div>
        </section>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Create Template</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={addModifierTemplateAction} className="grid gap-3 sm:grid-cols-2">
              <Input name="name" placeholder="Template name" required />
              <select name="type" defaultValue="OTHER" className="field-select">
                {modifierTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-foreground">
                <input name="required" type="checkbox" className="field-checkbox" />
                Required
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-foreground">
                <input name="multiSelect" type="checkbox" className="field-checkbox" />
                Multi-select
              </label>
              <button type="submit" className={cn(buttonVariants({ size: "sm" }), "sm:col-span-2 w-fit")}>
                Add Template
              </button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{template.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="default">{template.type}</Badge>
                      <Badge variant={template.required ? "warning" : "default"}>
                        {template.required ? "Required" : "Optional"}
                      </Badge>
                      <Badge variant={template.multiSelect ? "primary" : "default"}>
                        {template.multiSelect ? "Multi-select" : "Single-select"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/modifiers/${template.id}`}
                      className={cn(buttonVariants({ size: "sm" }))}
                    >
                      Edit Template
                    </Link>
                    <form action={deleteModifierTemplateAction}>
                      <input type="hidden" name="id" value={template.id} />
                      <button
                        type="submit"
                        className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{template._count.options} option{template._count.options === 1 ? "" : "s"}</span>
                  <span>·</span>
                  <span>
                    Attached to {template._count.menuItems} item
                    {template._count.menuItems === 1 ? "" : "s"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}

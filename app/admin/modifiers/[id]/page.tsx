import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addModifierTemplateOptionAction,
  deleteModifierTemplateAction,
  deleteModifierTemplateOptionAction,
  moveModifierTemplateOptionDownAction,
  moveModifierTemplateOptionUpAction,
  updateModifierTemplateAction,
  updateModifierTemplateOptionAction,
} from "@/app/admin/modifiers/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const modifierTypes = ["SIZE", "SUGAR", "ICE", "TOPPING", "OTHER"] as const;

type AdminModifierTemplatePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminModifierTemplatePage({
  params,
}: AdminModifierTemplatePageProps) {
  const { id } = await params;

  const template = await prisma.modifierTemplate.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
      _count: {
        select: {
          menuItems: true,
        },
      },
    },
  });

  if (!template) {
    notFound();
  }

  return (
    <main className="page-shell">
      <div className="page-wrap space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/modifiers"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to Modifier Templates
          </Link>
          <Link
            href="/admin/menu"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Menu Manager
          </Link>
        </div>

        <Card className="hero-panel">
          <CardHeader className="relative z-10 border-b border-border">
            <CardTitle className="page-title text-[2.15rem]">{template.name}</CardTitle>
            <CardDescription>
              Edit the shared template and its option list. Changes affect every menu
              item that uses this template.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-6">
            <form action={updateModifierTemplateAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={template.id} />
              <Input name="name" defaultValue={template.name} required />
              <select name="type" defaultValue={template.type} className="field-select">
                {modifierTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-foreground">
                <input
                  name="required"
                  type="checkbox"
                  defaultChecked={template.required}
                  className="field-checkbox"
                />
                Required
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm text-foreground">
                <input
                  name="multiSelect"
                  type="checkbox"
                  defaultChecked={template.multiSelect}
                  className="field-checkbox"
                />
                Multi-select
              </label>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Badge variant="success">
                  Attached to {template._count.menuItems} item
                  {template._count.menuItems === 1 ? "" : "s"}
                </Badge>
              </div>
              <button type="submit" className={cn(buttonVariants({ size: "sm" }), "sm:col-span-2 w-fit")}>
                Save Template
              </button>
            </form>

            <form action={deleteModifierTemplateAction} className="mt-4">
              <input type="hidden" name="id" value={template.id} />
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
              >
                Delete Template
              </button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Template Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form
              action={addModifierTemplateOptionAction}
              className="soft-panel grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
            >
              <input type="hidden" name="modifierTemplateId" value={template.id} />
              <Input name="name" placeholder="New option name" required />
              <Input name="priceDelta" type="number" step="0.01" defaultValue="0" required />
              <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                Add Option
              </button>
            </form>

            {template.options.length === 0 ? (
              <p className="text-sm text-muted-foreground">No options yet.</p>
            ) : (
              template.options.map((option) => (
                <div key={option.id} className="soft-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <form
                      action={updateModifierTemplateOptionAction}
                      className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
                    >
                      <input type="hidden" name="id" value={option.id} />
                      <input type="hidden" name="modifierTemplateId" value={template.id} />
                      <Input name="name" defaultValue={option.name} required />
                      <Input
                        name="priceDelta"
                        type="number"
                        step="0.01"
                        defaultValue={Number(option.priceDelta)}
                        required
                      />
                      <button
                        type="submit"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Save Option
                      </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                      <form action={moveModifierTemplateOptionUpAction}>
                        <input type="hidden" name="modifierTemplateId" value={template.id} />
                        <input type="hidden" name="optionId" value={option.id} />
                        <button
                          type="submit"
                          disabled={template.options[0]?.id === option.id}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Move Up
                        </button>
                      </form>
                      <form action={moveModifierTemplateOptionDownAction}>
                        <input type="hidden" name="modifierTemplateId" value={template.id} />
                        <input type="hidden" name="optionId" value={option.id} />
                        <button
                          type="submit"
                          disabled={template.options[template.options.length - 1]?.id === option.id}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Move Down
                        </button>
                      </form>
                      <form action={deleteModifierTemplateOptionAction}>
                        <input type="hidden" name="id" value={option.id} />
                        <input type="hidden" name="modifierTemplateId" value={template.id} />
                        <button
                          type="submit"
                          className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Current price delta: {formatPrice(Number(option.priceDelta))}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

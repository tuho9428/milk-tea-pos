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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

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
    <main className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/modifiers"
            className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
          >
            Back to Modifier Templates
          </Link>
          <Link
            href="/admin/menu"
            className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
          >
            Menu Manager
          </Link>
        </div>

        <Card className="border border-stone-700 bg-stone-900/80 py-0 text-stone-100">
          <CardHeader className="border-b border-stone-700 px-6 py-6">
            <CardTitle className="text-3xl font-bold text-white">{template.name}</CardTitle>
            <CardDescription className="text-stone-400">
              Edit the shared template and its option list. Changes affect every menu
              item that uses this template.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-6">
            <form action={updateModifierTemplateAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={template.id} />
              <input
                name="name"
                defaultValue={template.name}
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                required
              />
              <select
                name="type"
                defaultValue={template.type}
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              >
                {modifierTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm text-stone-300">
                <input
                  name="required"
                  type="checkbox"
                  defaultChecked={template.required}
                  className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                />
                Required
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm text-stone-300">
                <input
                  name="multiSelect"
                  type="checkbox"
                  defaultChecked={template.multiSelect}
                  className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                />
                Multi-select
              </label>
              <div className="sm:col-span-2 flex flex-wrap gap-3 text-sm text-stone-400">
                <span>
                  Attached to {template._count.menuItems} item
                  {template._count.menuItems === 1 ? "" : "s"}
                </span>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200 sm:col-span-2"
              >
                Save Template
              </button>
            </form>

            <form action={deleteModifierTemplateAction} className="mt-4">
              <input type="hidden" name="id" value={template.id} />
              <button
                type="submit"
                className="rounded-lg bg-red-300 px-4 py-2 text-sm font-semibold text-red-950 hover:bg-red-200"
              >
                Delete Template
              </button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-stone-700 bg-stone-900/80 py-0 text-stone-100">
          <CardHeader className="border-b border-stone-700 px-6 py-5">
            <CardTitle className="text-xl font-semibold text-white">Template Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-6">
            <form
              action={addModifierTemplateOptionAction}
              className="grid gap-3 rounded-xl border border-dashed border-stone-600 bg-stone-950 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
            >
              <input type="hidden" name="modifierTemplateId" value={template.id} />
              <input
                name="name"
                placeholder="New option name"
                className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                required
              />
              <input
                name="priceDelta"
                type="number"
                step="0.01"
                defaultValue="0"
                className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
              >
                Add Option
              </button>
            </form>

            {template.options.length === 0 ? (
              <p className="text-sm text-stone-400">No options yet.</p>
            ) : (
              template.options.map((option) => (
                <div
                  key={option.id}
                  className="rounded-xl border border-stone-700 bg-stone-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <form
                      action={updateModifierTemplateOptionAction}
                      className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
                    >
                      <input type="hidden" name="id" value={option.id} />
                      <input type="hidden" name="modifierTemplateId" value={template.id} />
                      <input
                        name="name"
                        defaultValue={option.name}
                        className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                        required
                      />
                      <input
                        name="priceDelta"
                        type="number"
                        step="0.01"
                        defaultValue={Number(option.priceDelta)}
                        className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                        required
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
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
                          className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
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
                          className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move Down
                        </button>
                      </form>
                      <form action={deleteModifierTemplateOptionAction}>
                        <input type="hidden" name="id" value={option.id} />
                        <input type="hidden" name="modifierTemplateId" value={template.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-red-300 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-stone-400">
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

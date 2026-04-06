import Link from "next/link";

import {
  addModifierTemplateAction,
  deleteModifierTemplateAction,
} from "@/app/admin/modifiers/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

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
    <main className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-stone-700 bg-stone-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-amber-300">
                ADMIN
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">Modifier Templates</h1>
              <p className="mt-1 text-sm text-stone-300">
                Manage shared modifier sets like size, sugar, and ice.
              </p>
            </div>
            <Link
              href="/admin/menu"
              className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
            >
              Menu Manager
            </Link>
          </div>
        </header>

        <Card className="border border-stone-700 bg-stone-900/80 py-0 text-stone-100">
          <CardHeader className="border-b border-stone-700 px-6 py-5">
            <CardTitle className="text-xl font-semibold text-white">
              Create Template
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-6">
            <form action={addModifierTemplateAction} className="grid gap-3 sm:grid-cols-2">
              <input
                name="name"
                placeholder="Template name"
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                required
              />
              <select
                name="type"
                defaultValue="OTHER"
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
                  className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                />
                Required
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm text-stone-300">
                <input
                  name="multiSelect"
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-500 bg-stone-900"
                />
                Multi-select
              </label>
              <button
                type="submit"
                className="sm:col-span-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
              >
                Add Template
              </button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="border border-stone-700 bg-stone-950 py-0 text-stone-100"
            >
              <CardContent className="space-y-4 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{template.name}</h2>
                    <p className="mt-1 text-sm text-stone-400">
                      {template.type} · {template.required ? "Required" : "Optional"} ·{" "}
                      {template.multiSelect ? "Multi-select" : "Single-select"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/modifiers/${template.id}`}
                      className="rounded-lg bg-amber-300 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-200"
                    >
                      Edit Template
                    </Link>
                    <form action={deleteModifierTemplateAction}>
                      <input type="hidden" name="id" value={template.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-red-300 px-3 py-2 text-sm font-semibold text-red-950 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-stone-400">
                  <span>{template._count.options} option{template._count.options === 1 ? "" : "s"}</span>
                  <span>·</span>
                  <span>Attached to {template._count.menuItems} item{template._count.menuItems === 1 ? "" : "s"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { MockDrink, formatPrice, mockDrinks } from "@/lib/mock-drinks";

type AdminDrink = MockDrink & {
  isSoldOut: boolean;
};

type DrinkForm = {
  name: string;
  slug: string;
  category: "Milk Tea" | "Coffee";
  shortDescription: string;
  description: string;
  price: string;
  tags: string;
};

const emptyForm: DrinkForm = {
  name: "",
  slug: "",
  category: "Milk Tea",
  shortDescription: "",
  description: "",
  price: "",
  tags: "",
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function drinkToForm(drink: AdminDrink): DrinkForm {
  return {
    name: drink.name,
    slug: drink.slug,
    category: drink.category,
    shortDescription: drink.shortDescription,
    description: drink.description,
    price: String(drink.price),
    tags: drink.tags.join(", "),
  };
}

function formToDrink(form: DrinkForm): Omit<AdminDrink, "isSoldOut"> {
  return {
    name: form.name.trim(),
    slug: toSlug(form.slug || form.name),
    category: form.category,
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

export default function AdminMenuPage() {
  const [drinks, setDrinks] = useState<AdminDrink[]>(
    mockDrinks.map((drink) => ({ ...drink, isSoldOut: false })),
  );
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<DrinkForm>(emptyForm);
  const [editForm, setEditForm] = useState<DrinkForm>(emptyForm);
  const [error, setError] = useState<string>("");

  const editingDrink = useMemo(
    () => drinks.find((drink) => drink.slug === editingSlug) ?? null,
    [drinks, editingSlug],
  );

  function validateAndBuild(
    form: DrinkForm,
    mode: "add" | "edit",
    currentSlug?: string,
  ) {
    const parsedPrice = Number(form.price);
    const slug = toSlug(form.slug || form.name);

    if (!form.name.trim()) {
      return "Drink name is required.";
    }
    if (!slug) {
      return "Slug is required.";
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return "Price must be a number greater than 0.";
    }

    const slugTaken = drinks.some(
      (drink) => drink.slug === slug && (mode === "add" || drink.slug !== currentSlug),
    );

    if (slugTaken) {
      return "Slug already exists. Please choose a different one.";
    }

    return null;
  }

  function handleAddDrink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formError = validateAndBuild(addForm, "add");
    if (formError) {
      setError(formError);
      return;
    }

    const nextDrink = formToDrink(addForm);
    setDrinks((current) => [{ ...nextDrink, isSoldOut: false }, ...current]);
    setAddForm(emptyForm);
  }

  function startEdit(slug: string) {
    const target = drinks.find((drink) => drink.slug === slug);
    if (!target) return;
    setEditingSlug(slug);
    setEditForm(drinkToForm(target));
    setError("");
  }

  function handleSaveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingDrink) return;

    setError("");
    const formError = validateAndBuild(editForm, "edit", editingDrink.slug);
    if (formError) {
      setError(formError);
      return;
    }

    const updated = formToDrink(editForm);
    setDrinks((current) =>
      current.map((drink) =>
        drink.slug === editingDrink.slug
          ? { ...updated, isSoldOut: drink.isSoldOut }
          : drink,
      ),
    );
    setEditingSlug(null);
    setEditForm(emptyForm);
  }

  function toggleSoldOut(slug: string) {
    setDrinks((current) =>
      current.map((drink) =>
        drink.slug === slug ? { ...drink, isSoldOut: !drink.isSoldOut } : drink,
      ),
    );
  }

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
                Static admin UI for add, edit, and sold-out actions.
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

        {error ? (
          <div className="rounded-lg border border-red-400/60 bg-red-900/30 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-stone-700 bg-stone-900/80 p-5">
            <h2 className="text-xl font-semibold text-white">Add Drink</h2>
            <form onSubmit={handleAddDrink} className="mt-4 grid gap-3">
              <input
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.slug ? f.slug : toSlug(e.target.value),
                  }))
                }
                placeholder="Drink name"
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              />
              <input
                value={addForm.slug}
                onChange={(e) => setAddForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
                placeholder="Slug"
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={addForm.category}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      category: e.target.value as "Milk Tea" | "Coffee",
                    }))
                  }
                  className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                >
                  <option>Milk Tea</option>
                  <option>Coffee</option>
                </select>
                <input
                  value={addForm.price}
                  onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="Price (e.g. 5.50)"
                  className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                />
              </div>
              <input
                value={addForm.shortDescription}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, shortDescription: e.target.value }))
                }
                placeholder="Short description"
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              />
              <textarea
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Long description"
                className="min-h-24 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              />
              <input
                value={addForm.tags}
                onChange={(e) => setAddForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="Tags (comma separated)"
                className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
              />
              <button
                type="submit"
                className="mt-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-200"
              >
                Add Drink
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-stone-700 bg-stone-900/80 p-5">
            <h2 className="text-xl font-semibold text-white">Edit Drink</h2>
            {!editingDrink ? (
              <p className="mt-4 text-sm text-stone-300">
                Choose a drink from the list and click Edit.
              </p>
            ) : (
              <form onSubmit={handleSaveEdit} className="mt-4 grid gap-3">
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Drink name"
                  className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                />
                <input
                  value={editForm.slug}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      slug: toSlug(e.target.value),
                    }))
                  }
                  placeholder="Slug"
                  className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        category: e.target.value as "Milk Tea" | "Coffee",
                      }))
                    }
                    className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                  >
                    <option>Milk Tea</option>
                    <option>Coffee</option>
                  </select>
                  <input
                    value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="Price"
                    className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                  />
                </div>
                <input
                  value={editForm.shortDescription}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, shortDescription: e.target.value }))
                  }
                  placeholder="Short description"
                  className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Long description"
                  className="min-h-24 rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                />
                <input
                  value={editForm.tags}
                  onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="Tags (comma separated)"
                  className="rounded-lg border border-stone-600 bg-stone-950 px-3 py-2 text-sm outline-none ring-amber-300 focus:ring-2"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-stone-900 hover:bg-stone-200"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlug(null);
                      setEditForm(emptyForm);
                    }}
                    className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </article>
        </section>

        <section className="rounded-2xl border border-stone-700 bg-stone-900/80 p-5">
          <h2 className="text-xl font-semibold text-white">Drinks</h2>
          <div className="mt-4 grid gap-3">
            {drinks.map((drink) => (
              <article
                key={drink.slug}
                className="rounded-xl border border-stone-700 bg-stone-950 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                      {drink.category}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{drink.name}</h3>
                    <p className="text-sm text-stone-400">{drink.slug}</p>
                    <p className="mt-2 text-sm text-stone-300">{drink.shortDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatPrice(drink.price)}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        drink.isSoldOut
                          ? "bg-red-900/40 text-red-200"
                          : "bg-emerald-900/40 text-emerald-200"
                      }`}
                    >
                      {drink.isSoldOut ? "Sold Out" : "Available"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(drink.slug)}
                    className="rounded-lg border border-stone-600 px-3 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSoldOut(drink.slug)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      drink.isSoldOut
                        ? "bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                        : "bg-red-300 text-red-950 hover:bg-red-200"
                    }`}
                  >
                    {drink.isSoldOut ? "Mark Available" : "Mark Sold Out"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

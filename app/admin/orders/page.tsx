import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

const statusStyles = {
  PENDING: "bg-amber-300/20 text-amber-200 ring-1 ring-amber-400/30",
  PAID: "bg-sky-300/20 text-sky-200 ring-1 ring-sky-400/30",
  MAKING: "bg-violet-300/20 text-violet-200 ring-1 ring-violet-400/30",
  READY: "bg-emerald-300/20 text-emerald-200 ring-1 ring-emerald-400/30",
  COMPLETED: "bg-stone-300/20 text-stone-100 ring-1 ring-stone-400/30",
  CANCELED: "bg-red-300/20 text-red-200 ring-1 ring-red-400/30",
} as const;

function formatStatusLabel(status: keyof typeof statusStyles) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
            },
          },
          modifiers: {
            orderBy: {
              name: "asc",
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-stone-700 bg-stone-900/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-amber-300">
                ADMIN
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">Incoming Orders</h1>
              <p className="mt-1 text-sm text-stone-300">
                Newest orders first, including line items and selected modifiers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/menu"
                className="rounded-lg border border-stone-600 px-4 py-2 text-sm font-semibold text-stone-100 hover:bg-stone-800"
              >
                Manage Menu
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

        {orders.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/70 p-10 text-center">
            <h2 className="text-xl font-semibold text-white">No orders yet</h2>
            <p className="mt-2 text-sm text-stone-400">
              Once customers place orders, they&apos;ll show up here with item and modifier
              details.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-stone-700 bg-stone-900/80 p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-800 pb-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-mono text-sm text-stone-300">{order.id}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                      >
                        {formatStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone-500">
                          Customer
                        </p>
                        <p className="mt-1 font-medium text-white">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone-500">Phone</p>
                        <p className="mt-1 text-stone-200">{order.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-stone-500">
                          Created
                        </p>
                        <p className="mt-1 text-stone-200">
                          {formatTimestamp(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-stone-500">Notes</p>
                      <p className="mt-1 text-sm text-stone-300">
                        {order.notes?.trim() || "No notes provided."}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-36 rounded-xl bg-stone-950 p-4 text-right">
                    <p className="text-xs uppercase tracking-wide text-stone-500">Total</p>
                    <p className="mt-2 text-2xl font-bold text-amber-300">
                      {formatPrice(Number(order.total))}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-stone-800 bg-stone-950 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {item.menuItem?.name ?? "Menu item unavailable"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-400">
                            <span>Quantity: {item.quantity}</span>
                            <span>Unit Price: {formatPrice(Number(item.unitPrice))}</span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-stone-200">
                          Line Total: {formatPrice(Number(item.unitPrice) * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs uppercase tracking-wide text-stone-500">
                          Modifiers
                        </p>
                        {item.modifiers.length === 0 ? (
                          <p className="mt-2 text-sm text-stone-500">No modifiers selected.</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {item.modifiers.map((modifier) => (
                              <li
                                key={modifier.id}
                                className="flex items-center justify-between rounded-lg bg-stone-900 px-3 py-2 text-sm"
                              >
                                <span className="text-stone-200">{modifier.name}</span>
                                <span className="text-stone-400">
                                  {modifier.priceDelta.toNumber() === 0
                                    ? formatPrice(0)
                                    : `+${formatPrice(Number(modifier.priceDelta))}`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminDashboardPage() {
  const [totalOrders, pendingOrders, completedOrders, completedRevenue, recentOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.order.count({
        where: {
          status: "COMPLETED",
        },
      }),
      prisma.order.aggregate({
        where: {
          status: "COMPLETED",
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          displayOrderNumber: true,
          customerName: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
    ]);

  const summaryCards = [
    {
      label: "Total Orders",
      value: totalOrders.toString(),
      tone: "text-stone-900",
    },
    {
      label: "Pending Orders",
      value: pendingOrders.toString(),
      tone: "text-amber-700",
    },
    {
      label: "Completed Orders",
      value: completedOrders.toString(),
      tone: "text-emerald-700",
    },
    {
      label: "Total Revenue",
      value: formatPrice(Number(completedRevenue._sum.total ?? 0)),
      tone: "text-sky-700",
    },
  ];

  const quickLinks = [
    {
      href: "/admin/orders",
      title: "Order Management",
      description: "Review incoming orders and update their status.",
    },
    {
      href: "/admin/menu",
      title: "Menu Management",
      description: "Order menu items, edit details, and attach modifier templates.",
    },
    {
      href: "/admin/modifiers",
      title: "Modifier Templates",
      description: "Manage shared modifier sets like size, sugar, and ice.",
    },
    {
      href: "/admin/settings",
      title: "Settings",
      description: "Keep a place ready for store-level admin settings.",
    },
  ];

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border border-stone-200 bg-white py-0">
          <CardHeader className="border-b border-stone-200 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-stone-500">
                  ADMIN
                </p>
                <CardTitle className="mt-2 text-3xl font-bold text-stone-900">
                  Dashboard
                </CardTitle>
                <CardDescription className="mt-1 text-stone-600">
                  Quick view of order activity and shortcuts to the main admin tools.
                </CardDescription>
              </div>
              <Link
                href="/menu"
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
              >
                Customer Menu
              </Link>
            </div>
          </CardHeader>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="border border-stone-200 bg-white py-0">
              <CardContent className="px-6 py-5">
                <p className="text-sm text-stone-500">{card.label}</p>
                <p className={`mt-2 text-3xl font-bold ${card.tone}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block">
              <Card className="h-full border border-stone-200 bg-white py-0 transition-colors hover:border-stone-300 hover:bg-stone-50">
                <CardContent className="px-6 py-5">
                  <h2 className="text-lg font-semibold text-stone-900">{link.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <Card className="border border-stone-200 bg-white py-0">
          <CardHeader className="border-b border-stone-200 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-xl font-semibold text-stone-900">
                Recent Orders
              </CardTitle>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                View all orders
              </Link>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-5">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-stone-500">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 transition-colors hover:bg-stone-100"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{order.customerName}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        #{order.displayOrderNumber} · {formatTimestamp(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-900">
                        {formatPrice(Number(order.total))}
                      </p>
                      <p className="mt-1 text-xs font-medium text-stone-500">
                        {order.status}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

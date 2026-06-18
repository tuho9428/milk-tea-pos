import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusVariant(status: string) {
  switch (status) {
    case "PENDING":
      return "warning" as const;
    case "READY":
    case "COMPLETED":
      return "success" as const;
    case "CANCELED":
      return "destructive" as const;
    default:
      return "primary" as const;
  }
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
      detail: "All recorded orders",
      tone: "text-foreground",
    },
    {
      label: "Pending Orders",
      value: pendingOrders.toString(),
      detail: "Awaiting kitchen action",
      tone: "text-primary",
    },
    {
      label: "Completed Orders",
      value: completedOrders.toString(),
      detail: "Finished and fulfilled",
      tone: "text-foreground",
    },
    {
      label: "Total Revenue",
      value: formatPrice(Number(completedRevenue._sum.total ?? 0)),
      detail: "Completed order volume",
      tone: "text-foreground",
    },
  ];

  const quickLinks = [
    {
      href: "/admin/orders",
      title: "Order Management",
      description: "Review incoming orders and update statuses from the list view.",
    },
    {
      href: "/admin/orders/board",
      title: "Kitchen Board",
      description: "Track active orders through the preparation workflow.",
    },
    {
      href: "/admin/menu",
      title: "Menu Management",
      description: "Edit drinks, availability, and item ordering.",
    },
    {
      href: "/admin/modifiers",
      title: "Modifier Templates",
      description: "Maintain shared size, sugar, ice, and topping sets.",
    },
    {
      href: "/admin/settings",
      title: "Store Settings",
      description: "Keep store-level values and tax settings aligned.",
    },
  ];

  const filterLinks = [
    { href: "/admin/orders", label: "All Orders" },
    { href: "/admin/orders/board", label: "Active Queue" },
    { href: "/admin/menu", label: "Menu Items" },
    { href: "/admin/modifiers", label: "Modifiers" },
  ];

  return (
    <main className="page-shell">
      <div className="page-wrap-wide space-y-6">
        <section className="hero-panel px-6 py-7 sm:px-8">
          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-3xl space-y-3">
                <p className="eyebrow">Admin Dashboard</p>
                <div className="space-y-2">
                  <h1 className="page-title">Milk tea operations in one calm workspace.</h1>
                  <p className="page-description">
                    Get a quick read on order activity, jump into the kitchen board,
                    and keep menu configuration consistent.
                  </p>
                </div>
              </div>
              <Link
                href="/menu"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Customer Menu
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {filterLinks.map((link) => (
                <Link key={link.href} href={link.href} className="tab-chip">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                      <p className={cn("mt-2 text-3xl font-semibold tracking-[-0.03em]", card.tone)}>
                        {card.value}
                      </p>
                    </div>
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-accent/70" />
                  </div>
                  <div className="border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">{card.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_1.85fr]">
          <Card className="h-fit">
            <CardHeader className="border-b border-border">
              <div className="space-y-2">
                <p className="eyebrow">Operations</p>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>
                  Core admin areas for managing orders, menu items, and store setup.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="soft-panel block p-4 transition hover:border-primary/18 hover:bg-primary-soft/30"
                >
                  <h2 className="text-base font-semibold text-foreground">{link.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {link.description}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <p className="eyebrow">Recent Orders</p>
                  <CardTitle>Fresh activity</CardTitle>
                  <CardDescription>
                    The latest customer orders coming through the storefront.
                  </CardDescription>
                </div>
                <Link href="/admin/orders" className="action-link">
                  View all orders
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-5">
              {recentOrders.length === 0 ? (
                <div className="soft-panel flex min-h-52 items-center justify-center p-6 text-center">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-foreground">No recent orders</p>
                    <p className="text-sm text-muted-foreground">
                      When customers place orders, they’ll appear here for quick review.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="soft-panel block p-4 transition hover:border-primary/18 hover:bg-primary-soft/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{order.customerName}</p>
                            <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                          </div>
                          <p className="mt-2 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                            #{order.displayOrderNumber}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatTimestamp(order.createdAt)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            Total
                          </p>
                          <p className="mt-1 text-base font-semibold text-foreground">
                            {formatPrice(Number(order.total))}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

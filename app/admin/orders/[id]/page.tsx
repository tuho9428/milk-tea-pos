import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderDetailContent } from "@/app/admin/orders/order-detail-content";
import { getAdminOrderDetail } from "@/app/admin/orders/order-detail-data";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;

  const order = await getAdminOrderDetail(id);

  if (!order) {
    notFound();
  }

  return (
    <main className="page-shell">
      <div className="page-wrap space-y-6">
        <div>
          <Link
            href="/admin/orders"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to Orders
          </Link>
        </div>

        <OrderDetailContent order={order} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderDetailContent } from "@/app/admin/orders/order-detail-content";
import { getAdminOrderDetail } from "@/app/admin/orders/order-detail-data";

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
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
            Back to Orders
          </Link>
        </div>

        <OrderDetailContent order={order} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderDetailContent } from "@/app/admin/orders/order-detail-content";
import { getAdminOrderDetail } from "@/app/admin/orders/order-detail-data";

type AdminOrderModalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderModalPage({
  params,
}: AdminOrderModalPageProps) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 px-4 py-6 backdrop-blur-sm">
      <Link
        href="/admin/orders/board"
        className="absolute inset-0"
        aria-label="Close order details"
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-3 flex justify-end">
          <Link
            href="/admin/orders/board"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
          >
            Close
          </Link>
        </div>

        <OrderDetailContent order={order} mode="modal" />
      </div>
    </div>
  );
}

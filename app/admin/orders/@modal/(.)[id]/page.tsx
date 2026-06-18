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
    <div className="dialog-backdrop">
      <Link
        href="/admin/orders/board"
        className="absolute inset-0"
        aria-label="Close order details"
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-3 flex justify-end">
          <Link href="/admin/orders/board" className="dialog-close">
            Close
          </Link>
        </div>

        <OrderDetailContent order={order} mode="modal" />
      </div>
    </div>
  );
}

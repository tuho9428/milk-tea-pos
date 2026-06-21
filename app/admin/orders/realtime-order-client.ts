import type { AdminOrderListItem } from "@/app/admin/orders/order-serializers";
import type { BoardOrder } from "@/app/admin/orders/board/orders-board-client";

export type RealtimeOrderPayload = {
  order: AdminOrderListItem | null;
  boardOrder: BoardOrder | null;
};

export async function fetchRealtimeOrder(orderId: string) {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return {
      order: null,
      boardOrder: null,
    } satisfies RealtimeOrderPayload;
  }

  if (!response.ok) {
    throw new Error("Unable to load realtime order.");
  }

  return (await response.json()) as RealtimeOrderPayload;
}

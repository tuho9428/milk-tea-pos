import type { AdminOrderListItem } from "@/app/admin/orders/order-serializers";
import type { BoardOrder } from "@/app/admin/orders/board/orders-board-client";

export type RealtimeOrderPayload = {
  order: AdminOrderListItem | null;
  boardOrder: BoardOrder | null;
};

export type AdminOrdersSnapshotPayload = {
  orders: AdminOrderListItem[];
};

export type BoardOrdersSnapshotPayload = {
  orders: BoardOrder[];
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

export async function fetchAdminOrdersSnapshot() {
  const response = await fetch("/api/admin/orders", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load orders snapshot.");
  }

  return (await response.json()) as AdminOrdersSnapshotPayload;
}

export async function fetchBoardOrdersSnapshot() {
  const response = await fetch("/api/admin/orders/board", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load board orders snapshot.");
  }

  return (await response.json()) as BoardOrdersSnapshotPayload;
}

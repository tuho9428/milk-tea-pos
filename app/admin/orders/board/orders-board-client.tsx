"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";

import { updateOrderStatusAction } from "@/app/admin/orders/actions";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

export type BoardColumnStatus = "PENDING" | "MAKING" | "READY" | "COMPLETED";

export type BoardOrder = {
  id: string;
  displayOrderNumber: string;
  customerName: string;
  status: BoardColumnStatus;
  total: number;
  createdAt: string;
  items: Array<{
    quantity: number;
    menuItemName: string | null;
    modifiers: string[];
  }>;
};

type OrdersBoardClientProps = {
  columns: Array<{
    status: BoardColumnStatus;
    title: string;
    tone: string;
  }>;
  initialOrders: BoardOrder[];
};

type BoardAction = {
  label: string;
  status: BoardColumnStatus | "CANCELED";
  tone?: "primary" | "danger";
};

function formatTimestamp(dateInput: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateInput));
}

function getNextActions(status: BoardColumnStatus): readonly BoardAction[] {
  switch (status) {
    case "PENDING":
      return [
        { label: "Start Making", status: "MAKING", tone: "primary" },
        { label: "Cancel", status: "CANCELED", tone: "danger" },
      ];
    case "MAKING":
      return [
        { label: "Mark Ready", status: "READY", tone: "primary" },
        { label: "Cancel", status: "CANCELED", tone: "danger" },
      ];
    case "READY":
      return [
        { label: "Complete", status: "COMPLETED", tone: "primary" },
        { label: "Cancel", status: "CANCELED", tone: "danger" },
      ];
    default:
      return [];
  }
}

function getVisibleItems(items: BoardOrder["items"]) {
  const visibleItems = items.slice(0, 3);
  const hiddenCount = Math.max(items.length - visibleItems.length, 0);

  return {
    visibleItems,
    hiddenCount,
  };
}

export function OrdersBoardClient({
  columns,
  initialOrders,
}: OrdersBoardClientProps) {
  const router = useRouter();
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isMounted = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );

  const ordersByStatus = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [
          column.status,
          initialOrders.filter((order) => order.status === column.status),
        ]),
      ) as Record<BoardColumnStatus, BoardOrder[]>,
    [columns, initialOrders],
  );
  const activeOrder =
    draggedOrderId === null
      ? null
      : initialOrders.find((order) => order.id === draggedOrderId) ?? null;

  async function updateStatus(orderId: string, status: string) {
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("status", status);
    await updateOrderStatusAction(formData);
    router.refresh();
  }

  function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id;
    const orderId = event.active.id;

    setDraggedOrderId(null);

    if (typeof orderId !== "string" || typeof overId !== "string") {
      return;
    }

    const targetStatus = overId as BoardColumnStatus;
    const draggedOrder = initialOrders.find((order) => order.id === orderId);

    if (!draggedOrder || draggedOrder.status === targetStatus) {
      return;
    }

    startTransition(async () => {
      const response = await fetch("/admin/orders/board/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status: targetStatus,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event) => {
        setDraggedOrderId(String(event.active.id));
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setDraggedOrderId(null);
      }}
    >
      <section className="grid gap-4 overflow-x-auto xl:grid-cols-4">
        {columns.map((column) => {
          const columnOrders = ordersByStatus[column.status];

          return (
            <DroppableColumn
              key={column.status}
              status={column.status}
              title={column.title}
              tone={column.tone}
              count={columnOrders.length}
            >
              {columnOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-6 text-sm text-stone-500">
                  No orders in this column.
                </div>
              ) : (
                columnOrders.map((order) => (
                  <DraggableOrderCard
                    key={order.id}
                    order={order}
                    isMounted={isMounted}
                    isPending={isPending}
                    onQuickUpdate={updateStatus}
                  />
                ))
              )}
            </DroppableColumn>
          );
        })}
      </section>

      <DragOverlay>
        {activeOrder ? (
          <BoardCardContent order={activeOrder} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function subscribeToHydration(callback: () => void) {
  callback();
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function DroppableColumn({
  status,
  title,
  tone,
  count,
  children,
}: {
  status: BoardColumnStatus;
  title: string;
  tone: string;
  count: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 rounded-2xl transition-colors ${
        isOver ? "ring-2 ring-stone-300 ring-offset-2" : ""
      }`}
    >
      <div className={`rounded-xl border px-4 py-3 ${tone}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-700">
            {count}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

function DraggableOrderCard({
  order,
  isMounted,
  isPending,
  onQuickUpdate,
}: {
  order: BoardOrder;
  isMounted: boolean;
  isPending: boolean;
  onQuickUpdate: (orderId: string, status: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BoardCardContent
        order={order}
        isMounted={isMounted}
        isPending={isPending}
        isDragging={isDragging}
        dragHandleProps={
          isMounted
            ? {
                ...attributes,
                ...listeners,
              }
            : undefined
        }
        onQuickUpdate={onQuickUpdate}
      />
    </div>
  );
}

function BoardCardContent({
  order,
  isMounted = false,
  isPending = false,
  isDragging = false,
  isOverlay = false,
  dragHandleProps,
  onQuickUpdate,
}: {
  order: BoardOrder;
  isMounted?: boolean;
  isPending?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onQuickUpdate?: (orderId: string, status: string) => Promise<void>;
}) {
  const nextActions = getNextActions(order.status);
  const { visibleItems, hiddenCount } = getVisibleItems(order.items);
  const primaryAction = nextActions.find(
    (action) => "tone" in action && action.tone === "primary",
  );
  const cancelAction = nextActions.find((action) => action.status === "CANCELED");

  return (
    <Card
      className={`border border-stone-200 bg-white py-0 shadow-sm ${
        isDragging ? "opacity-60" : ""
      } ${isOverlay ? "w-[280px] rotate-1 shadow-lg" : ""}`}
    >
      <CardContent className="space-y-4 px-4 py-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-stone-900">{order.customerName}</p>
              <p className="mt-1 font-mono text-xs text-stone-500">
                #{order.displayOrderNumber}
              </p>
            </div>
            <p className="text-sm font-semibold text-stone-900">
              {formatPrice(order.total)}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-stone-500">
              {formatTimestamp(order.createdAt)}
            </p>
            {!isOverlay ? (
              <button
                type="button"
                className="min-h-10 min-w-10 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-600 touch-none hover:bg-stone-100"
                aria-label={`Drag order ${order.displayOrderNumber}`}
                {...(isMounted ? dragHandleProps : undefined)}
              >
                Drag
              </button>
            ) : null}
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-3">
            {visibleItems.length > 0 ? (
              <ul className="space-y-2 text-sm text-stone-700">
                {visibleItems.map((item, index) => (
                  <li key={`${order.id}-${index}`}>
                    <p className="font-medium text-stone-800">
                      {item.quantity} x {item.menuItemName ?? "Item"}
                    </p>
                    {item.modifiers.length > 0 ? (
                      <ul className="mt-1 space-y-1 pl-4 text-xs text-stone-500">
                        {item.modifiers.map((modifier) => (
                          <li key={`${order.id}-${index}-${modifier}`}>{modifier}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No item summary available.</p>
            )}

            {hiddenCount > 0 ? (
              <p className="mt-3 text-xs font-medium text-stone-500">
                and {hiddenCount} more item{hiddenCount === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
        </div>

        {!isOverlay ? (
          <div className="flex flex-wrap gap-2">
            {primaryAction ? (
              <form
                key={primaryAction.status}
                action={async () => {
                  await onQuickUpdate?.(order.id, primaryAction.status);
                }}
              >
                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-11 rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {primaryAction.label}
                </button>
              </form>
            ) : null}

            <Link
              href={`/admin/orders/board?order=${order.id}`}
              className="min-h-11 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
              scroll={false}
            >
              View
            </Link>

            {cancelAction ? (
              <form
                action={async () => {
                  await onQuickUpdate?.(order.id, cancelAction.status);
                }}
              >
                <button
                  type="submit"
                  disabled={isPending}
                  className="min-h-11 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelAction.label}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

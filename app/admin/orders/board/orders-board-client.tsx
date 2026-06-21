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
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { updateOrderStatusAction } from "@/app/admin/orders/actions";
import { HardNavigationButton } from "@/app/admin/orders/hard-navigation-button";
import { fetchBoardOrdersSnapshot, fetchRealtimeOrder } from "@/app/admin/orders/realtime-order-client";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { playNewOrderSound } from "@/lib/audio/play-new-order-sound";
import { formatPrice } from "@/lib/format";
import { formatPaymentStatusLabel, getPaymentStatusVariant, type PaymentStatus } from "@/lib/payment";
import { cn } from "@/lib/utils";
import { useRealtimeOrders, type RealtimeOrderEvent, type RealtimeOrderRow } from "@/hooks/use-realtime-orders";

export type BoardColumnStatus = "PENDING" | "MAKING" | "READY" | "COMPLETED";

export type BoardOrder = {
  id: string;
  displayOrderNumber: string;
  customerName: string;
  status: BoardColumnStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: string;
  paidAt: string | null;
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
    badgeTone: "new" | "progress" | "ready" | "completed";
  }>;
  initialOrders: BoardOrder[];
};

type BoardAction = {
  label: string;
  status: BoardColumnStatus | "CANCELED";
  tone?: "primary" | "danger";
};

const cancellationReasons = [
  "Customer changed mind",
  "Item unavailable",
  "Store issue",
  "Duplicate order",
  "Payment problem",
  "Other",
] as const;

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

function getBadgeClass(tone: OrdersBoardClientProps["columns"][number]["badgeTone"]) {
  switch (tone) {
    case "new":
      return "border-[hsl(34_22%_80%)] bg-[hsl(35_26%_91%)] text-[hsl(28_16%_30%)]";
    case "progress":
      return "border-[hsl(43_24%_76%)] bg-[hsl(43_28%_88%)] text-[hsl(37_28%_34%)]";
    case "ready":
      return "border-[hsl(146_18%_78%)] bg-[hsl(144_20%_90%)] text-[hsl(150_18%_33%)]";
    case "completed":
      return "border-[hsl(118_8%_79%)] bg-[hsl(112_10%_89%)] text-[hsl(112_10%_35%)]";
    default:
      return "";
  }
}

function getWorkflowActionClass(status: BoardColumnStatus) {
  switch (status) {
    case "PENDING":
      return cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "min-w-[7.75rem] justify-center border-primary/35 bg-card text-primary shadow-none hover:border-primary/45 hover:bg-primary/5 hover:text-primary",
      );
    case "MAKING":
      return cn(
        buttonVariants({ variant: "secondary", size: "sm" }),
        "min-w-[7.75rem] justify-center border-primary/12 bg-primary/10 text-primary shadow-none hover:bg-primary/18 hover:text-primary",
      );
    case "READY":
      return cn(
        buttonVariants({ size: "sm" }),
        "min-w-[7.75rem] justify-center shadow-[0_10px_20px_hsl(var(--primary)/0.16)]",
      );
    default:
      return cn(buttonVariants({ size: "sm" }), "min-w-[7.75rem] justify-center");
  }
}

function getCancelTriggerClass() {
  return cn(
    buttonVariants({ variant: "destructive", size: "sm" }),
    "w-full justify-center border-destructive/12 bg-destructive/8 text-destructive shadow-none hover:bg-destructive/12",
  );
}

function isBoardColumnStatus(status: string): status is BoardColumnStatus {
  return status === "PENDING" || status === "MAKING" || status === "READY" || status === "COMPLETED";
}

function sortNewestFirst(orders: BoardOrder[]) {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function shouldShowOnBoard(order: BoardOrder | null): order is BoardOrder {
  return Boolean(order && order.paymentStatus === "PAID" && isBoardColumnStatus(order.status));
}

export function OrdersBoardClient({
  columns,
  initialOrders,
}: OrdersBoardClientProps) {
  const [orders, setOrders] = useState(() => sortNewestFirst(initialOrders));
  const ordersRef = useRef(orders);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const notifiedOrderIds = useRef(new Set(initialOrders.map((order) => order.id)));
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
  const columnStatuses = useMemo(() => new Set(columns.map((column) => column.status)), [columns]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const notifyNewPaidOrder = useCallback((order: RealtimeOrderRow | BoardOrder) => {
    if (notifiedOrderIds.current.has(order.id)) {
      return;
    }

    notifiedOrderIds.current.add(order.id);
    toast("New Order Received", {
      description: `Order #${order.displayOrderNumber ?? "New"}`,
    });
    playNewOrderSound();
  }, []);

  const handleRealtimeOrder = useCallback(
    async (event: RealtimeOrderEvent) => {
      const existingOrderWasPaid = ordersRef.current.some(
        (order) => order.id === event.order.id && order.paymentStatus === "PAID",
      );
      const shouldNotify =
        event.order.paymentStatus === "PAID" &&
        columnStatuses.has(event.order.status as BoardColumnStatus) &&
        (event.type === "INSERT" || !existingOrderWasPaid);

      if (shouldNotify) {
        notifyNewPaidOrder(event.order);
      }

      const payload = await fetchRealtimeOrder(event.order.id);

      setOrders((current) => {
        if (!shouldShowOnBoard(payload.boardOrder)) {
          return current.filter((order) => order.id !== event.order.id);
        }

        const boardOrder = payload.boardOrder;
        const nextOrders = current.some((order) => order.id === boardOrder.id)
          ? current.map((order) => (order.id === boardOrder.id ? boardOrder : order))
          : [boardOrder, ...current];

        return sortNewestFirst(nextOrders);
      });
    },
    [columnStatuses, notifyNewPaidOrder],
  );

  useRealtimeOrders({
    onOrderChange: handleRealtimeOrder,
  });

  useEffect(() => {
    let isMounted = true;

    async function refreshBoardSnapshot() {
      try {
        const payload = await fetchBoardOrdersSnapshot();

        if (!isMounted) {
          return;
        }

        const currentIds = new Set(ordersRef.current.map((order) => order.id));
        for (const order of payload.orders) {
          if (!currentIds.has(order.id)) {
            notifyNewPaidOrder(order);
          }
        }

        setOrders(sortNewestFirst(payload.orders));
      } catch {
        // Keep the current board state if a background snapshot request fails.
      }
    }

    const intervalId = window.setInterval(refreshBoardSnapshot, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [notifyNewPaidOrder]);

  const ordersByStatus = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [
          column.status,
          orders.filter((order) => order.status === column.status),
        ]),
      ) as Record<BoardColumnStatus, BoardOrder[]>,
    [columns, orders],
  );
  const activeOrder =
    draggedOrderId === null
      ? null
      : orders.find((order) => order.id === draggedOrderId) ?? null;

  async function updateStatus(orderId: string, status: string) {
    const formData = new FormData();
    formData.set("orderId", orderId);
    formData.set("status", status);
    await updateOrderStatusAction(formData);
    setOrders((current) => {
      if (!isBoardColumnStatus(status)) {
        return current.filter((order) => order.id !== orderId);
      }

      return sortNewestFirst(
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id;
    const orderId = event.active.id;

    setDraggedOrderId(null);

    if (typeof orderId !== "string" || typeof overId !== "string") {
      return;
    }

    const targetStatus = overId as BoardColumnStatus;
    const draggedOrder = orders.find((order) => order.id === orderId);

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
        setOrders((current) =>
          sortNewestFirst(
            current.map((order) =>
              order.id === orderId ? { ...order, status: targetStatus } : order,
            ),
          ),
        );
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
              badgeTone={column.badgeTone}
              count={columnOrders.length}
            >
              {columnOrders.length === 0 ? (
                <div className="rounded-[calc(var(--radius)*1.05)] border border-dashed border-border/90 bg-card/75 p-5 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
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
        {activeOrder ? <BoardCardContent order={activeOrder} isOverlay /> : null}
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
  badgeTone,
  count,
  children,
}: {
  status: BoardColumnStatus;
  title: string;
  tone: string;
  badgeTone: OrdersBoardClientProps["columns"][number]["badgeTone"];
  count: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-3 rounded-[calc(var(--radius)*1.2)] border border-transparent p-2 transition",
        isOver &&
          "border-border bg-card/55 shadow-[0_14px_28px_rgba(31,26,23,0.06)]",
      )}
    >
      <div
        className={cn(
          "rounded-[calc(var(--radius)*1.05)] border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
          tone,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {status}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <span
            className={cn(
              "inline-flex min-w-9 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold",
              getBadgeClass(badgeTone),
            )}
          >
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
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const primaryAction = nextActions.find(
    (action) => "tone" in action && action.tone === "primary",
  );
  const cancelAction = nextActions.find((action) => action.status === "CANCELED");

  useEffect(() => {
    if (!isCancelDialogOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCancelDialogOpen(false);
        setCancelReason("");
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isCancelDialogOpen]);

  function closeCancelDialog() {
    setIsCancelDialogOpen(false);
    setCancelReason("");
  }

  return (
    <>
      <Card
        className={cn(
          "border-border/90 bg-card py-0 shadow-[0_10px_22px_rgba(31,26,23,0.05)]",
          isDragging &&
            "border-primary/12 bg-card/98 opacity-80 shadow-[0_16px_30px_rgba(31,26,23,0.12)]",
          isOverlay &&
            "w-[292px] -translate-y-1 rotate-[1deg] border-primary/10 shadow-[0_22px_40px_rgba(31,26,23,0.14)]",
        )}
      >
        <CardContent className="space-y-4 px-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{order.customerName}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  #{order.displayOrderNumber}
                </p>
                <div className="mt-2">
                  <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                    {formatPaymentStatusLabel(order.paymentStatus)}
                  </Badge>
                </div>
                {order.paymentStatus === "PAID" && order.paidAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Paid {formatTimestamp(order.paidAt)} via {order.paymentProvider}
                  </p>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatPrice(order.total)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{formatTimestamp(order.createdAt)}</p>
              {!isOverlay ? (
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "touch-none border-border/80 bg-card px-3 shadow-none hover:bg-secondary/70",
                  )}
                  aria-label={`Drag order ${order.displayOrderNumber}`}
                  {...(isMounted ? dragHandleProps : undefined)}
                >
                  Drag
                </button>
              ) : null}
            </div>

            <div className="rounded-[calc(var(--radius)*0.95)] border border-border/90 bg-secondary/38 px-3 py-3">
              {visibleItems.length > 0 ? (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {visibleItems.map((item, index) => (
                    <li key={`${order.id}-${index}`}>
                      <p className="font-medium text-foreground">
                        {item.quantity} x {item.menuItemName ?? "Item"}
                      </p>
                      {item.modifiers.length > 0 ? (
                        <ul className="mt-1 space-y-1 pl-4 text-xs text-muted-foreground">
                          {item.modifiers.map((modifier) => (
                            <li key={`${order.id}-${index}-${modifier}`}>{modifier}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No item summary available.</p>
              )}

              {hiddenCount > 0 ? (
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  and {hiddenCount} more item{hiddenCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          </div>

          {!isOverlay ? (
            <div className="flex flex-col gap-2 pt-1">
              {primaryAction ? (
                <button
                  key={primaryAction.status}
                  type="button"
                  disabled={isPending}
                  onClick={async () => {
                    await onQuickUpdate?.(order.id, primaryAction.status);
                  }}
                  className={cn(getWorkflowActionClass(order.status), "w-full")}
                >
                  {primaryAction.label}
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <HardNavigationButton
                  href={`/admin/orders/board?order=${order.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full justify-center border-border/90 bg-card text-muted-foreground shadow-none hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  View
                </HardNavigationButton>

                {cancelAction ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setIsCancelDialogOpen(true);
                    }}
                    className={getCancelTriggerClass()}
                  >
                    {cancelAction.label}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isCancelDialogOpen && !isOverlay ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`cancel-order-title-${order.id}`}
          aria-describedby={`cancel-order-description-${order.id}`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/28 backdrop-blur-sm"
            aria-label="Close cancellation dialog"
            onClick={closeCancelDialog}
          />

          <div className="relative z-10 w-full max-w-md rounded-[calc(var(--radius)*1.2)] border border-border bg-card p-6 shadow-[0_22px_50px_rgba(31,26,23,0.16)]">
            <div className="space-y-2">
              <h2
                id={`cancel-order-title-${order.id}`}
                className="text-xl font-semibold tracking-[-0.02em] text-foreground"
              >
                Cancel order?
              </h2>
              <p
                id={`cancel-order-description-${order.id}`}
                className="text-sm leading-6 text-muted-foreground"
              >
                This will update the order status to cancelled. Please select a
                reason before continuing.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <label
                htmlFor={`cancel-reason-${order.id}`}
                className="text-sm font-medium text-foreground"
              >
                Cancellation reason
              </label>
              <select
                id={`cancel-reason-${order.id}`}
                value={cancelReason}
                onChange={(event) => {
                  setCancelReason(event.target.value);
                }}
                className="field-select"
                autoFocus
              >
                <option value="">Select a reason</option>
                {cancellationReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelDialog}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={!cancelReason || isPending}
                onClick={async () => {
                  if (!cancelAction || !cancelReason) {
                    return;
                  }

                  await onQuickUpdate?.(order.id, cancelAction.status);
                  closeCancelDialog();
                }}
                className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

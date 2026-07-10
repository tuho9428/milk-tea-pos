"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { formatPaymentStatusLabel, getPaymentStatusVariant, type PaymentStatus } from "@/lib/payment";
import { cn } from "@/lib/utils";
import { useRealtimeOrders, type RealtimeOrderEvent, type RealtimeOrderStatus } from "@/hooks/use-realtime-orders";

export type CustomerOrderStatus = RealtimeOrderStatus;

type OrderTrackingStatusProps = {
  initialPaidAt: string | null;
  initialPaymentStatus: PaymentStatus;
  initialStatus: CustomerOrderStatus;
  orderId: string;
};

type TrackingState = {
  paidAt: string | null;
  paymentStatus: PaymentStatus;
  status: CustomerOrderStatus;
};

type OrderStatusSnapshot = TrackingState & {
  id: string;
  updatedAt: string;
};

const customerOrderEventTypes = ["UPDATE"] as const;
const progressSteps = [
  {
    label: "Order received",
    statuses: ["PENDING", "PAID"],
  },
  {
    label: "Making your drink",
    statuses: ["MAKING"],
  },
  {
    label: "Ready for pickup",
    statuses: ["READY"],
  },
  {
    label: "Completed",
    statuses: ["COMPLETED"],
  },
] as const;

function normalizeStatus(status: CustomerOrderStatus) {
  return status;
}

function getStatusLabel(status: CustomerOrderStatus) {
  switch (normalizeStatus(status)) {
    case "PENDING":
    case "PAID":
      return "Order received";
    case "MAKING":
      return "Making your drink";
    case "READY":
      return "Ready for pickup";
    case "COMPLETED":
      return "Completed";
    case "CANCELED":
      return "Cancelled";
    default:
      return "Order received";
  }
}

function getStatusMessage(status: CustomerOrderStatus) {
  switch (normalizeStatus(status)) {
    case "PENDING":
    case "PAID":
      return "We received your order and the kitchen will start it soon.";
    case "MAKING":
      return "Your drink is being made now.";
    case "READY":
      return "Your order is ready. Please pick it up at the counter.";
    case "COMPLETED":
      return "Your order has been completed. Thank you!";
    case "CANCELED":
      return "This order was cancelled. Please contact the store if you need help.";
    default:
      return "We received your order and the kitchen will start it soon.";
  }
}

function getStatusClassName(status: CustomerOrderStatus) {
  switch (normalizeStatus(status)) {
    case "READY":
    case "COMPLETED":
      return "status-success";
    case "CANCELED":
      return "status-danger";
    default:
      return "status-warning";
  }
}

function getActiveStepIndex(status: CustomerOrderStatus) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "CANCELED") {
    return -1;
  }

  const stepIndex = progressSteps.findIndex((step) =>
    (step.statuses as readonly string[]).includes(normalizedStatus),
  );

  return stepIndex === -1 ? 0 : stepIndex;
}

function formatPaidAt(paidAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(paidAt));
}

function isOrderStatusSnapshot(value: unknown): value is OrderStatusSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<OrderStatusSnapshot>;

  return (
    typeof snapshot.id === "string" &&
    typeof snapshot.status === "string" &&
    typeof snapshot.paymentStatus === "string" &&
    typeof snapshot.updatedAt === "string" &&
    (typeof snapshot.paidAt === "string" || snapshot.paidAt === null)
  );
}

async function fetchOrderStatusSnapshot(orderId: string) {
  const response = await fetch(`/api/orders/${orderId}/status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload: unknown = await response.json();

  return isOrderStatusSnapshot(payload) ? payload : null;
}

export function OrderTrackingStatus({
  initialPaidAt,
  initialPaymentStatus,
  initialStatus,
  orderId,
}: OrderTrackingStatusProps) {
  const [trackingState, setTrackingState] = useState<TrackingState>({
    paidAt: initialPaidAt,
    paymentStatus: initialPaymentStatus,
    status: initialStatus,
  });
  const activeStepIndex = getActiveStepIndex(trackingState.status);

  const patchTrackingState = useCallback((snapshot: TrackingState) => {
    setTrackingState((current) => {
      if (
        current.status === snapshot.status &&
        current.paymentStatus === snapshot.paymentStatus &&
        current.paidAt === snapshot.paidAt
      ) {
        return current;
      }

      return snapshot;
    });
  }, []);

  const handleOrderChange = useCallback(
    (event: RealtimeOrderEvent) => {
      if (event.order.id !== orderId) {
        return;
      }

      patchTrackingState({
        paidAt: event.order.paidAt,
        paymentStatus: event.order.paymentStatus,
        status: event.order.status,
      });
    },
    [orderId, patchTrackingState],
  );

  useRealtimeOrders({
    eventTypes: customerOrderEventTypes,
    onOrderChange: handleOrderChange,
    orderId,
  });

  useEffect(() => {
    let isMounted = true;

    async function refreshStatus() {
      try {
        const snapshot = await fetchOrderStatusSnapshot(orderId);

        if (!isMounted || !snapshot) {
          return;
        }

        patchTrackingState({
          paidAt: snapshot.paidAt,
          paymentStatus: snapshot.paymentStatus,
          status: snapshot.status,
        });
      } catch (error) {
        console.warn(
          "Failed to refresh order tracking status",
          error instanceof Error ? error.message : error,
        );
      }
    }

    void refreshStatus();
    const intervalId = window.setInterval(refreshStatus, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [orderId, patchTrackingState]);

  return (
    <>
      <div className="soft-panel p-4">
        <dt className="eyebrow">Status</dt>
        <dd className="mt-2 space-y-2">
          <span className={cn("status-pill", getStatusClassName(trackingState.status))}>
            {getStatusLabel(trackingState.status)}
          </span>
          <p className="text-sm leading-6 text-muted-foreground">
            {getStatusMessage(trackingState.status)}
          </p>
        </dd>
      </div>

      <div className="soft-panel p-4">
        <dt className="eyebrow">Payment</dt>
        <dd className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={getPaymentStatusVariant(trackingState.paymentStatus)}>
            {formatPaymentStatusLabel(trackingState.paymentStatus)}
          </Badge>
          {trackingState.paidAt ? (
            <span className="text-xs text-muted-foreground">
              Paid {formatPaidAt(trackingState.paidAt)}
            </span>
          ) : null}
        </dd>
      </div>

      <div className="soft-panel p-4 sm:col-span-2">
        <dt className="eyebrow">Progress</dt>
        <dd className="mt-4">
          <ol className="grid gap-3 sm:grid-cols-4">
            {progressSteps.map((step, index) => {
              const isComplete = activeStepIndex >= index;
              const isCurrent = activeStepIndex === index;

              return (
                <li
                  key={step.label}
                  className={cn(
                    "rounded-[calc(var(--radius)*0.9)] border px-3 py-3 text-sm transition-colors",
                    isComplete
                      ? "border-primary/25 bg-primary-soft text-primary"
                      : "border-border/80 bg-card/70 text-muted-foreground",
                    isCurrent && "shadow-[0_8px_18px_hsl(var(--primary)/0.08)]",
                  )}
                >
                  <span
                    className={cn(
                      "mb-2 inline-flex size-6 items-center justify-center rounded-full border text-xs font-semibold",
                      isComplete
                        ? "border-primary/30 bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <p className="font-medium">{step.label}</p>
                </li>
              );
            })}
          </ol>
        </dd>
      </div>
    </>
  );
}

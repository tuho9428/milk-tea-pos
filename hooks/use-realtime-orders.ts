"use client";

import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { PaymentStatus } from "@/lib/payment";

export type RealtimeOrderStatus =
  | "PENDING"
  | "PAID"
  | "MAKING"
  | "READY"
  | "COMPLETED"
  | "CANCELED";

export type RealtimeOrderRow = {
  id: string;
  displayOrderNumber: string | null;
  customerName: string | null;
  status: RealtimeOrderStatus;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RealtimeOrderEvent = {
  type: "INSERT" | "UPDATE";
  order: RealtimeOrderRow;
  oldOrder: Partial<RealtimeOrderRow> | null;
};

type UseRealtimeOrdersOptions = {
  onOrderChange?: (event: RealtimeOrderEvent) => void | Promise<void>;
};

function normalizeOrderRow(row: Record<string, unknown> | null | undefined) {
  if (!row || typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    displayOrderNumber:
      typeof row.displayOrderNumber === "string" ? row.displayOrderNumber : null,
    customerName: typeof row.customerName === "string" ? row.customerName : null,
    status: row.status as RealtimeOrderStatus,
    paymentStatus: row.paymentStatus as PaymentStatus,
    paidAt: typeof row.paidAt === "string" ? row.paidAt : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
  } satisfies RealtimeOrderRow;
}

export function useRealtimeOrders({
  onOrderChange,
}: UseRealtimeOrdersOptions = {}) {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(
    hasSupabaseConfig ? null : "Supabase Realtime is not configured.",
  );

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let isMounted = true;

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => {
      if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") {
        return;
      }

      const order = normalizeOrderRow(payload.new);
      const oldOrder = normalizeOrderRow(payload.old);

      if (!order) {
        return;
      }

      const event: RealtimeOrderEvent = {
        type: payload.eventType,
        order,
        oldOrder,
      };

      void onOrderChange?.(event);
    };

    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Order",
        },
        handlePayload,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
        },
        handlePayload,
      )
      .subscribe((status) => {
        if (!isMounted) {
          return;
        }

        setIsSubscribed(status === "SUBSCRIBED");
        setError(status === "CHANNEL_ERROR" ? "Supabase Realtime subscription failed." : null);
      });

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [hasSupabaseConfig, onOrderChange]);

  return {
    isSubscribed,
    error,
  };
}

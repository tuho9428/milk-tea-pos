"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type RefreshUntilPaidProps = {
  enabled: boolean;
};

export function RefreshUntilPaid({ enabled }: RefreshUntilPaidProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, router]);

  return null;
}

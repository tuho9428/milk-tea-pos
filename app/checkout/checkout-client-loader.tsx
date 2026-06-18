"use client";

import dynamic from "next/dynamic";

const CheckoutClient = dynamic(
  () => import("@/app/checkout/checkout-client").then((module) => module.CheckoutClient),
  { ssr: false },
);

type CheckoutClientLoaderProps = {
  taxRate: number;
};

export function CheckoutClientLoader({ taxRate }: CheckoutClientLoaderProps) {
  return <CheckoutClient taxRate={taxRate} />;
}

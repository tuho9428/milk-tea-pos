export type CheckoutActionState = {
  status: "idle" | "success" | "error";
  message: string;
  redirectUrl: string | null;
  orderId: string | null;
  displayOrderNumber: string | null;
  token: string;
};

export const checkoutActionInitialState: CheckoutActionState = {
  status: "idle",
  message: "",
  redirectUrl: null,
  orderId: null,
  displayOrderNumber: null,
  token: "",
};

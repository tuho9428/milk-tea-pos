import "server-only";

import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.");
  }

  return apiKey;
}

export function getResend() {
  resendClient ??= new Resend(getResendApiKey());

  return resendClient;
}

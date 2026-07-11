import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: "Background email delivery is disabled. Order emails are sent directly with Resend.",
    },
    { status: 410 },
  );
}

export async function POST() {
  return GET();
}

export async function PUT() {
  return GET();
}

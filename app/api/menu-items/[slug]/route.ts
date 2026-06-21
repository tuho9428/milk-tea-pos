import { NextResponse } from "next/server";

import { getProductDetailBySlug } from "@/app/menu/[slug]/product-detail-data";

export const dynamic = "force-dynamic";

type MenuItemApiRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, { params }: MenuItemApiRouteContext) {
  const { slug } = await params;
  const drink = await getProductDetailBySlug(slug);

  if (!drink) {
    return NextResponse.json(
      { message: "Menu item not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ drink });
}

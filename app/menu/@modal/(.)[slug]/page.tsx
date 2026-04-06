import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailContent } from "@/app/menu/[slug]/product-detail-content";
import { getProductDetailBySlug } from "@/app/menu/[slug]/product-detail-data";

type MenuItemModalPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MenuItemModalPage({
  params,
}: MenuItemModalPageProps) {
  const { slug } = await params;
  const drink = await getProductDetailBySlug(slug);

  if (!drink) {
    notFound();
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 px-4 py-6 backdrop-blur-sm">
      <Link
        href="/menu"
        className="absolute inset-0"
        aria-label="Close product details"
        scroll={false}
      />
      <div className="relative mx-auto max-w-4xl">
        <div className="mb-3 flex justify-end">
          <Link
            href="/menu"
            scroll={false}
            className="rounded-lg border border-stone-600 bg-stone-900/90 px-3 py-2 text-sm font-medium text-stone-100 hover:bg-stone-800"
          >
            Close
          </Link>
        </div>

        <ProductDetailContent drink={drink} mode="modal" />
      </div>
    </div>
  );
}

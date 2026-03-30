import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailContent } from "@/app/menu/[slug]/product-detail-content";
import { getProductDetailBySlug } from "@/app/menu/[slug]/product-detail-data";

type DrinkDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DrinkDetailPage({ params }: DrinkDetailPageProps) {
  const { slug } = await params;
  const drink = await getProductDetailBySlug(slug);

  if (!drink) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/menu"
          className="mb-6 inline-flex rounded-lg border border-stone-600 px-3 py-2 text-sm font-medium text-stone-100 hover:bg-stone-800"
        >
          Back to Menu
        </Link>

        <ProductDetailContent drink={drink} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailContent } from "@/app/menu/[slug]/product-detail-content";
import { buttonVariants } from "@/components/ui/button-variants";
import { getProductDetailBySlug } from "@/app/menu/[slug]/product-detail-data";
import { cn } from "@/lib/utils";

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
    <main className="page-shell">
      <div className="page-wrap">
        <Link
          href="/menu"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Back to Menu
        </Link>

        <ProductDetailContent drink={drink} />
      </div>
    </main>
  );
}

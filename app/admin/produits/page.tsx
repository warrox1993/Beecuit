import Link from "next/link";
import { db } from "@/lib/db";
import { products, productTranslations, categories } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/admin/ProductTable";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
      nameFr: productTranslations.name,
      categorySlug: categories.slug,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(products)
    .leftJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "fr")),
    )
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .orderBy(products.createdAt);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-honey font-display text-3xl">Produits</h1>
        <Link href="/admin/produits/nouveau">
          <Button className="bg-honey text-cream hover:bg-honey-dark">+ Nouveau produit</Button>
        </Link>
      </div>
      <div className="border-warm-brown/10 mt-6 rounded-lg border bg-white p-4">
        <ProductTable rows={rows} />
      </div>
    </div>
  );
}

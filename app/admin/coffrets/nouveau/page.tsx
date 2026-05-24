import { db } from "@/lib/db";
import { products, productTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { CoffretForm } from "@/components/admin/CoffretForm";

export const dynamic = "force-dynamic";

export default async function NewCoffretPage() {
  const biscuits = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      name: productTranslations.name,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "fr")),
    )
    .where(and(eq(products.type, "biscuit"), eq(products.isActive, true)))
    .orderBy(products.sku);

  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Nouveau coffret</h1>
      <CoffretForm biscuits={biscuits} />
    </div>
  );
}

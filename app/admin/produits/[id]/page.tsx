import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products, productTranslations, categories, categoryTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/ProductForm";
import type { LocaleTranslations } from "@/components/admin/ProductTranslationTabs";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!prod) notFound();
  const trans = await db.select().from(productTranslations).where(eq(productTranslations.productId, id));
  const cats = await db
    .select({ id: categories.id, slug: categories.slug, nameFr: categoryTranslations.name })
    .from(categories)
    .innerJoin(categoryTranslations, and(eq(categoryTranslations.categoryId, categories.id), eq(categoryTranslations.locale, "fr")))
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);

  const emptyTrans = { name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "", allergens: [] as string[], nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 }, seoTitle: "", seoDescription: "" };
  const byLocale: LocaleTranslations = { fr: { ...emptyTrans }, nl: { ...emptyTrans }, de: { ...emptyTrans }, en: { ...emptyTrans } };
  for (const t of trans) {
    byLocale[t.locale as "fr" | "nl" | "de" | "en"] = {
      name: t.name, slug: t.slug, shortDescription: t.shortDescription, longDescription: t.longDescription,
      ingredients: t.ingredients, allergens: t.allergens, nutritionalFactsPer100g: t.nutritionalFactsPer100g,
      seoTitle: t.seoTitle, seoDescription: t.seoDescription,
    };
  }

  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Édition produit</h1>
      <ProductForm
        initial={{
          id: prod.id, sku: prod.sku, categoryId: prod.categoryId, basePriceCents: prod.basePriceCents,
          weightGrams: prod.weightGrams, stockQuantity: prod.stockQuantity, isActive: prod.isActive, isFeatured: prod.isFeatured,
          translations: byLocale,
        }}
        categories={cats}
      />
    </div>
  );
}

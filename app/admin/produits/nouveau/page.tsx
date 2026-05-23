import { db } from "@/lib/db";
import { categories, categoryTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const cats = await db
    .select({ id: categories.id, slug: categories.slug, nameFr: categoryTranslations.name })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, "fr"),
      ),
    )
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);
  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Nouveau produit</h1>
      <ProductForm categories={cats} />
    </div>
  );
}

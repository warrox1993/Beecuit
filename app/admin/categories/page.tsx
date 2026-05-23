import { db } from "@/lib/db";
import { categories, categoryTranslations } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { CategoryListClient } from "@/components/admin/CategoryListClient";

export const dynamic = "force-dynamic";

type Locale = "fr" | "nl" | "de" | "en";
type Trans = { name: string; description: string };
type LT = Record<Locale, Trans>;

export default async function AdminCategoriesPage() {
  const cats = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      productCount: sql<number>`(SELECT COUNT(*)::int FROM products WHERE category_id = ${categories.id})`,
    })
    .from(categories)
    .orderBy(categories.sortOrder);

  const trans = await db.select().from(categoryTranslations);
  const byCategory = new Map<string, LT>();
  for (const c of cats) {
    byCategory.set(c.id, {
      fr: { name: "", description: "" },
      nl: { name: "", description: "" },
      de: { name: "", description: "" },
      en: { name: "", description: "" },
    });
  }
  for (const t of trans) {
    const lt = byCategory.get(t.categoryId);
    if (lt) lt[t.locale as Locale] = { name: t.name, description: t.description ?? "" };
  }

  const rows = cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount: c.productCount ?? 0,
    translations: byCategory.get(c.id)!,
  }));

  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Catégories</h1>
      <CategoryListClient rows={rows} />
    </div>
  );
}

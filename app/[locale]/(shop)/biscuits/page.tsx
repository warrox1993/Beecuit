import { getTranslations, setRequestLocale } from "next-intl/server";
import { listActiveCategoriesForLocale, listProductsForLocale, type Locale } from "@/lib/queries/catalog";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { locale } = await params;
  const { categorie } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");

  const [cats, prods] = await Promise.all([
    listActiveCategoriesForLocale(locale as Locale),
    listProductsForLocale(locale as Locale, categorie),
  ]);

  const grid = prods.map((p) => ({
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    primaryImageUrl: p.primaryImageUrl,
    basePriceCents: p.basePriceCents,
    stockQuantity: p.stockQuantity,
    outOfStockLabel: t("outOfStock"),
  }));

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-honey font-display mb-2 text-5xl">{t("title")}</h1>
      <p className="text-warm-brown/70 mb-8">{t("intro")}</p>
      <CategoryFilter categories={cats} activeSlug={categorie} allLabel={t("filterAll")} />
      <ProductGrid products={grid} />
    </section>
  );
}

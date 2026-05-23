import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import {
  listActiveCategoriesForLocale,
  listProductsForLocale,
  type Locale,
} from "@/lib/queries/catalog";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductCard } from "@/components/shop/ProductCard";

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

  return (
    <>
      <Section py="md" bg="surface-elev">
        <Container>
          <Eyebrow>{t("pageEyebrow")}</Eyebrow>
          <Heading as="h1" size="h1" className="mt-3">
            {t("title")}
          </Heading>
          <Prose className="mt-4">{t("pageProse")}</Prose>
        </Container>
      </Section>
      <Section py="md">
        <Container>
          <div className="flex flex-col gap-10 md:flex-row">
            <CategoryFilter
              categories={cats}
              activeSlug={categorie}
              allLabel={t("filterAll")}
              variant="sidebar"
            />
            <div className="flex-1">
              <CategoryFilter
                categories={cats}
                activeSlug={categorie}
                allLabel={t("filterAll")}
                variant="chips"
              />
              {prods.length === 0 ? (
                <p className="text-warm-brown/70 py-12 text-center">Aucun biscuit trouvé.</p>
              ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {prods.map((p) => (
                    <ProductCard
                      key={p.id}
                      slug={p.slug}
                      name={p.name}
                      primaryImageUrl={p.primaryImageUrl}
                      categoryName={p.categoryName}
                      basePriceCents={p.basePriceCents}
                      stockQuantity={p.stockQuantity}
                      outOfStockLabel={t("outOfStock")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

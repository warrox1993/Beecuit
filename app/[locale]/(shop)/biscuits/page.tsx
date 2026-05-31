import { Suspense } from "react";
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
import { ProductGridSkeleton } from "@/components/shop/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

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
          {/* Le skeleton vit ici (Suspense interne) plutôt que dans un loading.tsx
              de segment, sinon la frontière Suspense couvrirait aussi /[slug] et
              ferait flusher un statut 200 avant le notFound() des fiches. */}
          <Suspense fallback={<CatalogResultsSkeleton />}>
            <CatalogResults locale={locale} categorie={categorie} />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}

async function CatalogResults({
  locale,
  categorie,
}: {
  locale: string;
  categorie?: string;
}) {
  const t = await getTranslations("catalog");
  const [cats, prods] = await Promise.all([
    listActiveCategoriesForLocale(locale as Locale),
    listProductsForLocale(locale as Locale, categorie),
  ]);

  return (
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
                type={p.type}
                displayedPriceCents={p.displayedPriceCents}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogResultsSkeleton() {
  return (
    <div className="md:flex md:gap-10">
      <div className="hidden md:block md:w-60">
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex-1">
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}

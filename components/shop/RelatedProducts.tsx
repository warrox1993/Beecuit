import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Heading } from "@/components/ui-primitives/Heading";
import { ProductCard } from "./ProductCard";
import { listRelatedProducts, type Locale } from "@/lib/queries/catalog";

export async function RelatedProducts({
  productId,
  locale,
}: {
  productId: string;
  locale: string;
}) {
  const t = await getTranslations("catalog");
  const products = await listRelatedProducts(productId, locale as Locale, 4);
  if (products.length === 0) return null;
  return (
    <Section py="lg" bg="surface-elev">
      <Container>
        <Heading as="h2" size="h2" className="mb-10">
          {t("relatedTitle")}
        </Heading>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {products.map((p) => (
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
      </Container>
    </Section>
  );
}

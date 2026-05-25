import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductBySlug, type Locale } from "@/lib/queries/catalog";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { ProductImages } from "@/components/shop/ProductImages";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { TrustIndicators } from "@/components/shop/TrustIndicators";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import { PairingSuggestions } from "@/components/shop/PairingSuggestions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProductBySlug(locale as Locale, slug);
  if (!p) return {};
  return { title: p.seoTitle, description: p.seoDescription };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const product = await getProductBySlug(locale as Locale, slug);
  if (!product) notFound();

  const priceEur = (product.basePriceCents / 100).toFixed(2);
  const isOut = product.stockQuantity <= 0;

  return (
    <>
      <Section py="md">
        <Container>
          <article className="grid grid-cols-1 gap-12 md:grid-cols-[3fr_2fr]">
            <ProductImages images={product.images} name={product.name} />
            <div className="space-y-6 md:sticky md:top-28 md:self-start">
              <Eyebrow>BISCUITS</Eyebrow>
              <Heading as="h1" size="h1">
                {product.name}
              </Heading>
              <Prose>{product.shortDescription}</Prose>
              <p className="text-honey-dark font-display text-3xl">{priceEur} €</p>
              <AddToCartButton productId={product.id} label={t("addToCart")} outOfStock={isOut} />
              <TrustIndicators />
              <details className="border-warm-brown/10 border-t pt-4">
                <summary className="text-warm-brown cursor-pointer text-sm font-medium">
                  {t("ingredientsTitle")}
                </summary>
                <p className="text-warm-brown/80 mt-3 text-sm">{product.ingredients}</p>
              </details>
              {product.allergens.length > 0 && (
                <details className="border-warm-brown/10 border-t pt-4">
                  <summary className="text-warm-brown cursor-pointer text-sm font-medium">
                    {t("allergensTitle")}
                  </summary>
                  <ul className="text-warm-brown/80 mt-3 list-disc pl-5 text-sm">
                    {product.allergens.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </details>
              )}
              <details className="border-warm-brown/10 border-t pt-4">
                <summary className="text-warm-brown cursor-pointer text-sm font-medium">
                  {t("nutritionTitle")}
                </summary>
                <table className="text-warm-brown/80 mt-3 w-full text-sm">
                  <tbody>
                    <tr>
                      <td>Énergie</td>
                      <td className="text-right">
                        {product.nutritionalFactsPer100g.energy_kcal} kcal
                      </td>
                    </tr>
                    <tr>
                      <td>Matières grasses</td>
                      <td className="text-right">{product.nutritionalFactsPer100g.fat_g} g</td>
                    </tr>
                    <tr>
                      <td>Glucides</td>
                      <td className="text-right">{product.nutritionalFactsPer100g.carbs_g} g</td>
                    </tr>
                    <tr>
                      <td>Protéines</td>
                      <td className="text-right">{product.nutritionalFactsPer100g.protein_g} g</td>
                    </tr>
                    <tr>
                      <td>Sel</td>
                      <td className="text-right">{product.nutritionalFactsPer100g.salt_g} g</td>
                    </tr>
                  </tbody>
                </table>
              </details>
            </div>
          </article>
        </Container>
      </Section>
      <Section py="lg" bg="surface-elev">
        <Container variant="narrow">
          <Heading as="h2" size="h2" className="mb-6">
            {t("storyTitle")}
          </Heading>
          <Prose>{product.longDescription}</Prose>
          <PairingSuggestions categorySlug={product.categorySlug} />
        </Container>
      </Section>
      <RelatedProducts productId={product.id} locale={locale} />
    </>
  );
}

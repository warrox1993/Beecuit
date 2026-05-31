import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getCoffretBySlug } from "@/lib/queries/catalog";
import { CoffretDetailClient } from "@/components/shop/CoffretDetailClient";
import { Container } from "@/components/ui-primitives/Container";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildSlugAlternates } from "@/lib/seo/alternates";
import { getProductLocaleSlugs } from "@/lib/seo/sitemap-data";
import { coffretJsonLd } from "@/lib/seo/structured-data";

type Locale = "fr" | "nl" | "en" | "de";
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const coffret = await getCoffretBySlug(locale as Locale, slug);
  if (!coffret) return {};
  const meta = buildPageMetadata({
    title: coffret.seoTitle || coffret.name,
    description: coffret.seoDescription || coffret.shortDescription || "",
    path: `/coffrets/${slug}`,
    locale,
    image: coffret.images[0]?.url,
  });
  const slugs = await getProductLocaleSlugs(coffret.id);
  meta.alternates = buildSlugAlternates(locale, "/coffrets", slugs);
  return meta;
}

export default async function CoffretDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const coffret = await getCoffretBySlug(locale as Locale, slug);
  if (!coffret) notFound();

  const jsonLd = coffretJsonLd(
    {
      id: coffret.id,
      sku: coffret.sku,
      name: coffret.name,
      slug: coffret.slug,
      shortDescription: coffret.shortDescription,
      seoDescription: coffret.seoDescription,
      basePriceCents: coffret.price.totalCents,
      stockQuantity: coffret.availability.available ? 1 : 0,
      images: coffret.images,
      weightGrams: coffret.weightGrams,
    },
    locale as "fr" | "nl" | "de" | "en",
  );

  const totalUnits = coffret.price.breakdown.reduce(
    (a, b) => a + b.quantity,
    0,
  );

  return (
    <Container className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
        <div className="bg-cookie/30 aspect-square rounded-2xl overflow-hidden">
          {coffret.images[0]?.url ? (
            <Image
              src={coffret.images[0].url}
              alt={coffret.images[0].altText ?? coffret.name}
              width={800}
              height={800}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-9xl opacity-30">
              📦
            </div>
          )}
        </div>

        <CoffretDetailClient coffret={coffret} />
      </div>

      <section className="mt-16">
        <p className="text-xs uppercase tracking-widest text-warm-brown/60 mb-2">
          Ce coffret contient
        </p>
        <h2 className="text-2xl font-display text-warm-brown mb-6">
          {totalUnits} biscuits sélectionnés
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {coffret.price.breakdown.map((b) => (
            <div
              key={b.biscuitId}
              className="bg-white rounded-xl overflow-hidden border border-cookie/40"
            >
              <div className="relative aspect-[4/3] bg-cookie/30">
                {b.primaryImageUrl ? (
                  <Image
                    src={b.primaryImageUrl}
                    alt={b.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl opacity-30">
                    🍪
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm text-warm-brown">
                  {b.name}
                </div>
                <div className="text-xs text-warm-brown/70">
                  ×{b.quantity} ·{" "}
                  {(b.unitPriceCents / 100).toFixed(2).replace(".", ",")} €
                  l&apos;unité
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}

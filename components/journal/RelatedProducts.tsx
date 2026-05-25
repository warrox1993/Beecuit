import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ProseMirrorNode } from "@/lib/journal/prosemirror-types";

type Locale = "fr" | "nl" | "en" | "de";

function extractProductSlugs(node: ProseMirrorNode): string[] {
  if (node.type === "product-card") return [node.attrs.productSlug];
  if ("content" in node && Array.isArray(node.content)) {
    return node.content.flatMap(extractProductSlugs);
  }
  return [];
}

export async function RelatedProducts({
  body,
  featured,
  category,
  locale,
}: {
  body: ProseMirrorNode;
  featured: string[];
  category: "recettes" | "savoir-faire" | "saisons" | "atelier";
  locale: Locale;
}) {
  const fromBody = extractProductSlugs(body);
  const allSlugs = Array.from(new Set([...featured, ...fromBody])).slice(0, 3);
  if (allSlugs.length === 0) return null;

  const t = await getTranslations("journal.relatedProducts");
  // Lazy import to avoid env loading issues in tests (matches InlineProductCard pattern)
  const { getProductBySlug } = await import("@/lib/queries/catalog");
  const products = (
    await Promise.all(
      allSlugs.map(async (slug) => ({ slug, p: await getProductBySlug(locale, slug) })),
    )
  ).filter((x): x is { slug: string; p: NonNullable<typeof x.p> } => x.p !== null);

  if (products.length === 0) return null;

  const heading = category === "recettes" ? t("recettes") : t("default");

  return (
    <section className="bg-cream/60 my-16 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-warm-brown font-display mb-8 text-center text-3xl">{heading}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {products.map(({ slug, p }) => (
            <Link
              key={slug}
              href={`/${locale}/biscuits/${slug}`}
              className="border-warm-brown/10 hover:border-honey/40 block overflow-hidden rounded-lg border bg-white p-6 transition hover:shadow-md"
            >
              <div className="text-warm-brown font-display text-xl">{p.name}</div>
              <div className="text-warm-brown/60 mt-2 text-sm">Découvrir →</div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href={`/${locale}/biscuits`} className="text-honey-dark text-sm underline">
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}

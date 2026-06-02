/**
 * JSON-LD builders for Au Fil des Saveurs.
 *
 * Each function returns a plain object meant to be JSON-serialised inside a
 * `<script type="application/ld+json">` tag. Keep the output strict to the
 * schema.org spec so Google Rich Results can pick everything up.
 */
import {
  BUSINESS_ADDRESS,
  BUSINESS_CONTACT,
  BUSINESS_GEO,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SOCIAL_LINKS,
  type SupportedLocale,
} from "./site";

type ProductLike = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  seoDescription?: string | null;
  basePriceCents: number;
  stockQuantity: number;
  images: { url: string; altText?: string | null }[];
  weightGrams?: number | null;
};

/**
 * `Organization` JSON-LD — sitewide, emitted from the root layout.
 *
 * Includes brand identity, logo, social profiles, postal address and a
 * customer service contact point so Google Knowledge Graph can wire the
 * brand panel.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "Au Fil des Saveurs Biscuiterie",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    description: SITE_TAGLINE,
    sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.facebook],
    address: {
      "@type": "PostalAddress",
      ...BUSINESS_ADDRESS,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: BUSINESS_CONTACT.email,
      // Only publish the phone once a real number replaces the placeholder —
      // emitting a fake telephone as structured data is worse than omitting it.
      ...(isRealPhone(BUSINESS_CONTACT.telephone)
        ? { telephone: BUSINESS_CONTACT.telephone }
        : {}),
      availableLanguage: ["French", "Dutch", "German", "English"],
      areaServed: ["BE", "FR", "LU", "NL", "DE"],
    },
  } as const;
}

/**
 * A telephone is "real" once it drops the placeholder's `000` run. A run of
 * 3+ consecutive zeros doesn't occur in real Belgian numbers (no area code or
 * subscriber segment is `000`), so it cleanly flags the `+32 4 000 00 00`
 * placeholder without false-positives on legit numbers like `+32 2 800 00 12`.
 */
function isRealPhone(phone: string): boolean {
  return !/0{3,}/.test(phone);
}

/**
 * `LocalBusiness` (typed as `Bakery`) — emit on the homepage when the site has
 * a single primary brick-and-mortar location in Liège. This is the schema that
 * feeds Google's local pack / Maps panel and is one of the most heavily used
 * entity types by generative engines for "near me" / city-scoped answers.
 *
 * Guards:
 *  - the placeholder telephone (`+32 4 000 00 00`) is omitted until a real
 *    number is supplied (emitting a fake phone is worse than omitting it);
 *  - opening hours are omitted until confirmed by the client — publishing wrong
 *    hours is actively harmful in the local pack.
 */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    description: SITE_TAGLINE,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    priceRange: "€€",
    currenciesAccepted: "EUR",
    servesCuisine: "Bakery",
    ...(isRealPhone(BUSINESS_CONTACT.telephone)
      ? { telephone: BUSINESS_CONTACT.telephone }
      : {}),
    email: BUSINESS_CONTACT.email,
    address: {
      "@type": "PostalAddress",
      ...BUSINESS_ADDRESS,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_GEO.latitude,
      longitude: BUSINESS_GEO.longitude,
    },
    areaServed: [
      { "@type": "City", name: "Liège" },
      { "@type": "Country", name: "Belgique" },
    ],
    sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.facebook],
  } as const;
}

/**
 * `Product` JSON-LD — emit on every product (biscuit + coffret) detail page.
 *
 * Conforms to Google Merchant + Rich Results expectations:
 * - SKU/MPN
 * - Brand
 * - Offers (price, EUR, availability, itemCondition)
 * - Absolute image URLs
 */
export function productJsonLd(product: ProductLike, locale: SupportedLocale) {
  const url = `${SITE_URL}/${locale}/biscuits/${product.slug}`;
  const priceEur = (product.basePriceCents / 100).toFixed(2);
  const availability =
    product.stockQuantity > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description:
      product.seoDescription || product.shortDescription || product.name,
    sku: product.sku,
    mpn: product.sku,
    image: product.images.map((i) => toAbsoluteUrl(i.url)),
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: priceEur,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        "@id": `${SITE_URL}/#organization`,
      },
    },
    ...(product.weightGrams
      ? {
          weight: {
            "@type": "QuantitativeValue",
            value: product.weightGrams,
            unitCode: "GRM",
          },
        }
      : {}),
  } as const;
}

/**
 * `Product` JSON-LD variant for coffrets — same shape, different URL prefix.
 */
export function coffretJsonLd(product: ProductLike, locale: SupportedLocale) {
  const url = `${SITE_URL}/${locale}/coffrets/${product.slug}`;
  const priceEur = (product.basePriceCents / 100).toFixed(2);
  const availability =
    product.stockQuantity > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description:
      product.seoDescription || product.shortDescription || product.name,
    sku: product.sku,
    mpn: product.sku,
    image: product.images.map((i) => toAbsoluteUrl(i.url)),
    brand: { "@type": "Brand", name: SITE_NAME },
    category: "Gift Box",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: priceEur,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
        "@id": `${SITE_URL}/#organization`,
      },
    },
  } as const;
}

/**
 * `FAQPage` JSON-LD — accepts genuine question/answer pairs.
 *
 * Note: as of mid-2026 Google no longer renders FAQ rich snippets for most
 * sites, but generative engines (ChatGPT, Perplexity, Gemini, Claude) still
 * actively parse FAQPage markup when extracting answers — so it remains a
 * high-value GEO signal. Keep answers factual and free of marketing copy.
 */
export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } as const;
}

export type BreadcrumbItem = { name: string; url: string };

/**
 * `BreadcrumbList` JSON-LD — accepts a flat list of breadcrumb items, each
 * with an absolute or root-relative URL.
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: toAbsoluteUrl(item.url),
    })),
  } as const;
}

function toAbsoluteUrl(url: string): string {
  if (!url) return SITE_URL;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

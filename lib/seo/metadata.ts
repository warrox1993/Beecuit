import type { Metadata } from "next";
import { buildAlternates } from "./alternates";
import {
  OG_LOCALE_MAP,
  SITE_NAME,
  SITE_URL,
  type SupportedLocale,
} from "./site";

type BuildPageMetadataInput = {
  /** Page-specific title — the SITE_NAME suffix is appended automatically. */
  title: string;
  description: string;
  /** Path WITHOUT the locale segment (e.g. `/biscuits` or `""` for home). */
  path: string;
  locale: string;
  /**
   * Optional OG image. Absolute URL preferred; relative URLs are resolved
   * against `SITE_URL`.
   */
  image?: string;
  /** Override the og:type. Defaults to `"website"`. */
  type?: "website" | "article";
  /** Disable the "| Au Fil des Saveurs" suffix when the title already carries the brand. */
  appendSiteName?: boolean;
};

const DEFAULT_OG_IMAGE = "/opengraph-image";

/**
 * Build a complete Next.js `Metadata` object for a public page.
 *
 * Includes:
 *  - title (with site suffix unless disabled)
 *  - description
 *  - canonical + hreflang alternates (for all 4 locales)
 *  - OpenGraph (title, description, url, type, locale, alternateLocale, images)
 *  - Twitter card (summary_large_image)
 *  - metadataBase pointing at the deployment hostname
 */
export function buildPageMetadata({
  title,
  description,
  path,
  locale,
  image,
  type = "website",
  appendSiteName = true,
}: BuildPageMetadataInput): Metadata {
  const safeLocale = (locale as SupportedLocale) || "fr";
  const fullTitle =
    appendSiteName && !title.includes(SITE_NAME)
      ? `${title} | ${SITE_NAME}`
      : title;

  const alternates = buildAlternates(locale, path);

  // Resolve image URL. If the caller passes a relative path, it will be
  // resolved against SITE_URL automatically via metadataBase, but OG
  // consumers benefit from absolute URLs so we materialise them here.
  const ogImageUrl = toAbsoluteUrl(image ?? DEFAULT_OG_IMAGE);
  const pageUrl = `${SITE_URL}/${safeLocale}${normalisePath(path)}`;

  const alternateLocales = Object.values(OG_LOCALE_MAP).filter(
    (l) => l !== OG_LOCALE_MAP[safeLocale],
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: fullTitle,
    description,
    alternates,
    openGraph: {
      title: fullTitle,
      description,
      type,
      url: pageUrl,
      siteName: SITE_NAME,
      locale: OG_LOCALE_MAP[safeLocale],
      alternateLocale: alternateLocales,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function normalisePath(path: string): string {
  if (!path) return "";
  if (path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

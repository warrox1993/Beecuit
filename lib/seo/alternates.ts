import type { Metadata } from "next";
import { SUPPORTED_LOCALES, type SupportedLocale } from "./site";

type Alternates = NonNullable<Metadata["alternates"]>;

/**
 * Build a Next.js `alternates` config (canonical + hreflang languages) for a
 * page that lives at the same path in every locale.
 *
 * @param locale  the locale currently being rendered (drives `canonical`)
 * @param path    the path AFTER the locale segment, e.g. `/biscuits` or
 *                `/biscuits/spéculoos-gros-200g`. Use `""` for the locale
 *                root (`/fr`).
 */
export function buildAlternates(locale: string, path: string): Alternates {
  const cleanPath = normalisePath(path);
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    languages[l] = `/${l}${cleanPath}`;
  }
  // `x-default` points search engines to the canonical locale fallback.
  languages["x-default"] = `/${(locale as SupportedLocale) || "fr"}${cleanPath}`;

  return {
    canonical: `/${locale}${cleanPath}`,
    languages,
  };
}

/**
 * Build `alternates` for a localized detail page whose slug DIFFERS per locale
 * (products, coffrets). Unlike {@link buildAlternates}, each hreflang points at
 * the locale-specific slug so Google links the right translations together.
 *
 * @param locale        the locale being rendered (drives `canonical`)
 * @param prefix        the path prefix WITHOUT locale, e.g. `/biscuits`
 * @param slugByLocale  map of locale → slug (omit locales without a translation)
 */
export function buildSlugAlternates(
  locale: string,
  prefix: string,
  slugByLocale: Partial<Record<SupportedLocale, string>>,
): Alternates {
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    const s = slugByLocale[l];
    if (s) languages[l] = `/${l}${prefix}/${s}`;
  }
  const currentSlug =
    slugByLocale[(locale as SupportedLocale)] ??
    Object.values(slugByLocale)[0] ??
    "";
  const canonical = `/${locale}${prefix}/${currentSlug}`;
  languages["x-default"] = slugByLocale.fr
    ? `/fr${prefix}/${slugByLocale.fr}`
    : canonical;

  return { canonical, languages };
}

function normalisePath(path: string): string {
  if (!path) return "";
  if (path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

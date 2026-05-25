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

function normalisePath(path: string): string {
  if (!path) return "";
  if (path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

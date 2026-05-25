/**
 * Centralised SEO constants for Au Fil des Saveurs.
 *
 * The site URL is resolved at runtime so that preview deployments and
 * production share the same code. Prefer `NEXT_PUBLIC_APP_URL`; fall back
 * to the well-known Vercel preview hostname and finally to the canonical
 * domain placeholder.
 *
 * TODO(prod): replace the default once the final aufildessaveurs.be domain
 * is wired up.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://beecuit.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Au Fil des Saveurs";
export const SITE_TAGLINE = "Biscuiterie Fine & Gourmet";
export const SITE_DESCRIPTION =
  "Boutique artisanale de biscuits liégeois — coffrets cadeaux, abonnement et cartes cadeaux. Fabriqués à la main à Liège, Belgique.";

export const SUPPORTED_LOCALES = ["fr", "nl", "de", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "fr";

/** OpenGraph locale tags expected by Open Graph spec (with region). */
export const OG_LOCALE_MAP: Record<SupportedLocale, string> = {
  fr: "fr_BE",
  nl: "nl_BE",
  de: "de_BE",
  en: "en_US",
};

/** Social profiles for `sameAs` JSON-LD. */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/aufildessaveurs.be",
  facebook: "https://www.facebook.com/aufildessaveurs.be",
};

/** Postal address — used by Organization + LocalBusiness JSON-LD. */
export const BUSINESS_ADDRESS = {
  streetAddress: "Rue de la Cathédrale 1",
  addressLocality: "Liège",
  postalCode: "4000",
  addressCountry: "BE",
  addressRegion: "Liège",
};

export const BUSINESS_GEO = {
  latitude: 50.6451,
  longitude: 5.5719,
};

export const BUSINESS_CONTACT = {
  email: "hello@aufildessaveurs.be",
  telephone: "+32 4 000 00 00",
};

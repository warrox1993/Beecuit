import type { MetadataRoute } from "next";
import { SITE_URL, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/seo/site";
import {
  listBiscuitSitemapRows,
  listCoffretSitemapRows,
} from "@/lib/seo/sitemap-data";

// We rebuild on each request — the catalog is small (<100 SKUs × 4 locales).
export const dynamic = "force-dynamic";
export const revalidate = 3600; // soft cap if Next decides to cache

type StaticEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

// Path is appended AFTER the locale segment. `""` means the locale root.
const STATIC_ENTRIES: StaticEntry[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/biscuits", changeFrequency: "daily", priority: 0.9 },
  { path: "/coffrets", changeFrequency: "weekly", priority: 0.9 },
  { path: "/abonnement", changeFrequency: "weekly", priority: 0.85 },
  { path: "/cartes-cadeaux", changeFrequency: "monthly", priority: 0.8 },
  { path: "/entreprises", changeFrequency: "monthly", priority: 0.7 },
  { path: "/notre-histoire", changeFrequency: "yearly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/sign-in", changeFrequency: "yearly", priority: 0.3 },
  // Legal
  { path: "/cgv", changeFrequency: "yearly", priority: 0.3 },
  { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
  { path: "/confidentialite", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
];

/**
 * Build per-locale alternate language map for a given path.
 * Returned shape is consumed by Next's MetadataRoute.Sitemap `alternates.languages`.
 */
function languagesFor(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    out[l] = `${SITE_URL}/${l}${path}`;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1) Static pages × 4 locales (each entry advertises hreflang alternates).
  const staticEntries: MetadataRoute.Sitemap = [];
  for (const entry of STATIC_ENTRIES) {
    for (const locale of SUPPORTED_LOCALES) {
      staticEntries.push({
        url: `${SITE_URL}/${locale}${entry.path}`,
        lastModified: now,
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
        alternates: { languages: languagesFor(entry.path) },
      });
    }
  }

  // 2) Dynamic pages — biscuits and coffrets.
  // We need to pair each (productId, locale) slug with the slugs in OTHER
  // locales for the same product so hreflang stays accurate (slugs differ).
  const [biscuitRows, coffretRows] = await Promise.all([
    listBiscuitSitemapRows(),
    listCoffretSitemapRows(),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [];

  const groupAndEmit = (
    rows: typeof biscuitRows,
    pathPrefix: "/biscuits" | "/coffrets",
  ) => {
    const byProduct = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = byProduct.get(r.productId) ?? [];
      list.push(r);
      byProduct.set(r.productId, list);
    }
    for (const group of byProduct.values()) {
      const slugByLocale: Partial<Record<SupportedLocale, string>> = {};
      for (const r of group) slugByLocale[r.locale] = r.slug;

      for (const r of group) {
        const languages: Record<string, string> = {};
        for (const l of SUPPORTED_LOCALES) {
          // Fall back to the canonical locale slug if a translation is missing.
          const slug = slugByLocale[l] ?? r.slug;
          languages[l] = `${SITE_URL}/${l}${pathPrefix}/${encodeURIComponent(slug)}`;
        }
        dynamicEntries.push({
          url: `${SITE_URL}/${r.locale}${pathPrefix}/${encodeURIComponent(r.slug)}`,
          lastModified: r.updatedAt,
          changeFrequency: "weekly",
          priority: pathPrefix === "/biscuits" ? 0.75 : 0.7,
          alternates: { languages },
        });
      }
    }
  };

  groupAndEmit(biscuitRows, "/biscuits");
  groupAndEmit(coffretRows, "/coffrets");

  return [...staticEntries, ...dynamicEntries];
}

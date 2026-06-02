import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalArticles, journalArticleTranslations } from "@/lib/db/schema";
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
  { path: "/journal", changeFrequency: "weekly", priority: 0.6 },
  // Journal category index pages (static slugs, localized hreflang).
  { path: "/journal/categorie/recettes", changeFrequency: "weekly", priority: 0.5 },
  { path: "/journal/categorie/savoir-faire", changeFrequency: "weekly", priority: 0.5 },
  { path: "/journal/categorie/saisons", changeFrequency: "weekly", priority: 0.5 },
  { path: "/journal/categorie/atelier", changeFrequency: "weekly", priority: 0.5 },
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

  // 3) Journal articles — one entry per (published article × translated locale),
  // each advertising hreflang alternates to its sibling-locale URLs.
  const articleRows = await db
    .select({
      id: journalArticles.id,
      slug: journalArticles.slug,
      updatedAt: journalArticles.updatedAt,
      locale: journalArticleTranslations.locale,
    })
    .from(journalArticles)
    .innerJoin(
      journalArticleTranslations,
      eq(journalArticleTranslations.articleId, journalArticles.id),
    )
    .where(eq(journalArticles.status, "published"));

  const articlesById = new Map<
    string,
    { slug: string; updatedAt: Date; locales: SupportedLocale[] }
  >();
  for (const row of articleRows) {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(row.locale)) continue;
    const existing = articlesById.get(row.id) ?? {
      slug: row.slug,
      updatedAt: row.updatedAt,
      locales: [] as SupportedLocale[],
    };
    existing.locales.push(row.locale as SupportedLocale);
    articlesById.set(row.id, existing);
  }

  const journalEntries: MetadataRoute.Sitemap = [];
  for (const { slug, updatedAt, locales } of articlesById.values()) {
    const languages: Record<string, string> = {};
    for (const l of locales) {
      languages[l] = `${SITE_URL}/${l}/journal/${encodeURIComponent(slug)}`;
    }
    for (const locale of locales) {
      journalEntries.push({
        url: `${SITE_URL}/${locale}/journal/${encodeURIComponent(slug)}`,
        lastModified: updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      });
    }
  }

  return [...staticEntries, ...dynamicEntries, ...journalEntries];
}

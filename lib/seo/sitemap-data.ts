import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, productTranslations } from "@/lib/db/schema";
import { SUPPORTED_LOCALES, type SupportedLocale } from "./site";

export type SitemapSlugRow = {
  productId: string;
  locale: SupportedLocale;
  slug: string;
  updatedAt: Date;
};

/**
 * Returns one row per (product, locale) for every active biscuit, with the
 * locale-specific slug and the underlying product `updatedAt` (used for
 * `<lastmod>`).
 */
export async function listBiscuitSitemapRows(): Promise<SitemapSlugRow[]> {
  const rows = await db
    .select({
      productId: products.id,
      locale: productTranslations.locale,
      slug: productTranslations.slug,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      eq(productTranslations.productId, products.id),
    )
    .where(and(eq(products.isActive, true), sql`${products.type} = 'biscuit'`));
  return rows
    .filter((r): r is SitemapSlugRow =>
      (SUPPORTED_LOCALES as readonly string[]).includes(r.locale),
    );
}

/**
 * Returns the locale → slug map for a single product (biscuit or coffret),
 * used to build correct per-locale hreflang alternates on detail pages.
 */
export async function getProductLocaleSlugs(
  productId: string,
): Promise<Partial<Record<SupportedLocale, string>>> {
  const rows = await db
    .select({
      locale: productTranslations.locale,
      slug: productTranslations.slug,
    })
    .from(productTranslations)
    .where(eq(productTranslations.productId, productId));
  const out: Partial<Record<SupportedLocale, string>> = {};
  for (const r of rows) {
    if ((SUPPORTED_LOCALES as readonly string[]).includes(r.locale)) {
      out[r.locale as SupportedLocale] = r.slug;
    }
  }
  return out;
}

/**
 * Returns one row per (coffret, locale) for every active coffret.
 */
export async function listCoffretSitemapRows(): Promise<SitemapSlugRow[]> {
  const rows = await db
    .select({
      productId: products.id,
      locale: productTranslations.locale,
      slug: productTranslations.slug,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      eq(productTranslations.productId, products.id),
    )
    .where(and(eq(products.isActive, true), sql`${products.type} = 'coffret'`));
  return rows.filter((r): r is SitemapSlugRow =>
    (SUPPORTED_LOCALES as readonly string[]).includes(r.locale),
  );
}

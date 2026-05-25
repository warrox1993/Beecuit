import "server-only";
import { db } from "@/lib/db";
import {
  products,
  productTranslations,
  productImages,
  categories,
  categoryTranslations,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { computeCoffretPrice } from "@/lib/coffret/pricing";
import { isCoffretAvailable } from "@/lib/coffret/availability";

export type Locale = "fr" | "nl" | "de" | "en";

export async function listActiveCategoriesForLocale(locale: Locale) {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categoryTranslations.name,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, locale),
      ),
    )
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);
}

export async function listProductsForLocale(locale: Locale, categorySlug?: string) {
  // Exclude gift_card type from the biscuits/coffrets catalog listing
  // (gift cards have their own page /cartes-cadeaux)
  const baseWhere = and(
    eq(products.isActive, true),
    sql`${products.type} IN ('biscuit', 'coffret')`,
  );
  const where = categorySlug
    ? and(
        baseWhere,
        sql`${products.categoryId} = (SELECT id FROM categories WHERE slug = ${categorySlug})`,
      )
    : baseWhere;

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      type: products.type,
      basePriceCents: products.basePriceCents,
      discountPercent: products.discountPercent,
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      categoryName: sql<
        string | null
      >`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(where)
    .orderBy(products.createdAt);

  return Promise.all(
    rows.map(async (r) => {
      if (r.type === "coffret") {
        const p = await computeCoffretPrice(r.id, locale);
        return { ...r, displayedPriceCents: p.totalCents };
      }
      return { ...r, displayedPriceCents: r.basePriceCents };
    }),
  );
}

export async function listFeaturedProducts(locale: Locale, limit = 3) {
  const featured = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      categoryName: sql<
        string | null
      >`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .orderBy(products.createdAt)
    .limit(limit);

  if (featured.length >= limit) return featured;

  const rest = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      categoryName: sql<
        string | null
      >`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(eq(products.isActive, true))
    .orderBy(products.createdAt)
    .limit(limit);

  const seen = new Set(featured.map((f) => f.id));
  for (const r of rest) {
    if (!seen.has(r.id) && featured.length < limit) featured.push(r);
  }
  return featured;
}

export async function getProductBySlug(locale: Locale, slug: string) {
  const [row] = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      weightGrams: products.weightGrams,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      longDescription: productTranslations.longDescription,
      ingredients: productTranslations.ingredients,
      allergens: productTranslations.allergens,
      nutritionalFactsPer100g: productTranslations.nutritionalFactsPer100g,
      seoTitle: productTranslations.seoTitle,
      seoDescription: productTranslations.seoDescription,
      // Phase 4G: expose categorySlug to drive PairingSuggestions content
      categorySlug: sql<
        string | null
      >`(SELECT slug FROM categories WHERE id = ${products.categoryId} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(and(eq(products.isActive, true), eq(productTranslations.slug, slug)))
    .limit(1);
  if (!row) return null;
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.id))
    .orderBy(productImages.sortOrder);
  return { ...row, images };
}

export async function listRelatedProducts(productId: string, locale: Locale, limit = 4) {
  const [src] = await db
    .select({ categoryId: products.categoryId })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!src?.categoryId) {
    return db
      .select({
        id: products.id,
        sku: products.sku,
        basePriceCents: products.basePriceCents,
        stockQuantity: products.stockQuantity,
        name: productTranslations.name,
        slug: productTranslations.slug,
        primaryImageUrl: sql<
          string | null
        >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
        categoryName: sql<
          string | null
        >`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
      )
      .where(and(eq(products.isActive, true), sql`${products.id} != ${productId}`))
      .orderBy(products.createdAt)
      .limit(limit);
  }

  return db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      categoryName: sql<
        string | null
      >`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(
      and(
        eq(products.isActive, true),
        eq(products.categoryId, src.categoryId),
        sql`${products.id} != ${productId}`,
      ),
    )
    .orderBy(products.createdAt)
    .limit(limit);
}

export async function listCoffretsForLocale(locale: Locale) {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      discountPercent: products.discountPercent,
      isFeatured: products.isFeatured,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(and(eq(products.isActive, true), eq(products.type, "coffret")))
    .orderBy(products.createdAt);

  return Promise.all(
    rows.map(async (r) => {
      const price = await computeCoffretPrice(r.id, locale);
      const avail = await isCoffretAvailable(r.id, 1, locale);
      // Expose up to 3 biscuit names for the Phase 4C CoffretCard hover reveal.
      const breakdownNames = price.breakdown.slice(0, 3).map((b) => b.name);
      return { ...r, price, available: avail.available, breakdownNames };
    }),
  );
}

export async function getCoffretBySlug(locale: Locale, slug: string) {
  const [row] = await db
    .select({
      id: products.id,
      sku: products.sku,
      discountPercent: products.discountPercent,
      weightGrams: products.weightGrams,
      isFeatured: products.isFeatured,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      longDescription: productTranslations.longDescription,
      seoTitle: productTranslations.seoTitle,
      seoDescription: productTranslations.seoDescription,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(
      and(
        eq(products.isActive, true),
        eq(products.type, "coffret"),
        eq(productTranslations.slug, slug),
      ),
    )
    .limit(1);
  if (!row) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.id))
    .orderBy(productImages.sortOrder);

  const price = await computeCoffretPrice(row.id, locale);
  const avail = await isCoffretAvailable(row.id, 1, locale);

  return { ...row, images, price, availability: avail };
}

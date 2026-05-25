import { db } from "@/lib/db";
import {
  categories,
  categoryTranslations,
  products,
  productTranslations,
  productImages,
  shippingRates,
  users,
} from "@/lib/db/schema";
import { CATEGORIES, PRODUCTS, SHIPPING_RATES, ADMIN_EMAIL } from "./data";
import { toSlug } from "@/lib/slug";
import { sql } from "drizzle-orm";

const LOCALES = ["fr", "nl", "de", "en"] as const;

async function ensureSequence() {
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;`);
}

async function seedCategories() {
  for (const c of CATEGORIES) {
    const [row] = await db
      .insert(categories)
      .values({ slug: c.slug, sortOrder: 0, isActive: true })
      .onConflictDoUpdate({ target: categories.slug, set: { isActive: true } })
      .returning();
    if (!row) throw new Error(`Failed upsert category ${c.slug}`);
    for (const loc of LOCALES) {
      await db
        .insert(categoryTranslations)
        .values({ categoryId: row.id, locale: loc, name: c.names[loc] })
        .onConflictDoUpdate({
          target: [categoryTranslations.categoryId, categoryTranslations.locale],
          set: { name: c.names[loc] },
        });
    }
  }
}

async function seedProducts() {
  const cats = await db.select().from(categories);
  const catBySlug = new Map(cats.map((c) => [c.slug, c.id] as const));

  for (const p of PRODUCTS) {
    const categoryId = catBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Missing category ${p.categorySlug}`);

    const [prod] = await db
      .insert(products)
      .values({
        type: "biscuit",
        sku: p.sku,
        categoryId,
        basePriceCents: p.basePriceCents,
        weightGrams: p.weightGrams,
        stockQuantity: p.stockQuantity,
        isFeatured: p.isFeatured,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          basePriceCents: p.basePriceCents,
          weightGrams: p.weightGrams,
          stockQuantity: p.stockQuantity,
          categoryId,
          isFeatured: p.isFeatured,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!prod) throw new Error(`Failed upsert product ${p.sku}`);

    for (const loc of LOCALES) {
      const t = p.translations[loc];
      await db
        .insert(productTranslations)
        .values({
          productId: prod.id,
          locale: loc,
          name: t.name,
          slug: toSlug(t.name),
          shortDescription: t.shortDescription,
          longDescription: t.longDescription,
          ingredients: t.ingredients,
          allergens: t.allergens,
          nutritionalFactsPer100g: p.nutritionalFactsPer100g,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        })
        .onConflictDoUpdate({
          target: [productTranslations.productId, productTranslations.locale],
          set: {
            name: t.name,
            shortDescription: t.shortDescription,
            longDescription: t.longDescription,
            ingredients: t.ingredients,
            allergens: t.allergens,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
          },
        });
    }

    // Replace any existing images with the curated list from data.ts
    // (idempotent: re-seeding always reflects the source of truth).
    await db.delete(productImages).where(sql`${productImages.productId} = ${prod.id}`);
    for (let i = 0; i < p.images.length; i++) {
      const img = p.images[i]!;
      await db.insert(productImages).values({
        productId: prod.id,
        url: img.url,
        altText: img.altText,
        sortOrder: i,
        isPrimary: i === 0,
      });
    }
  }
}

async function seedShipping() {
  for (const r of SHIPPING_RATES) {
    await db.insert(shippingRates).values(r).onConflictDoNothing();
  }
}

async function promoteAdmin() {
  await db
    .update(users)
    .set({ role: "admin" })
    .where(sql`${users.email} = ${ADMIN_EMAIL}`);
  console.log(
    `If ${ADMIN_EMAIL} has not yet signed in via magic link, no row was updated — sign in first, then re-run pnpm seed.`,
  );
}

async function main() {
  await ensureSequence();
  await seedCategories();
  await seedProducts();
  await seedShipping();
  await promoteAdmin();
  console.log("✓ Seed complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

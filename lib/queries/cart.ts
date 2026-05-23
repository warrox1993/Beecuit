import "server-only";
import { db } from "@/lib/db";
import { carts, cartItems, products, productTranslations } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { Locale } from "./catalog";

export async function getOrCreateCartForSessionToken(sessionToken: string) {
  const [existing] = await db
    .select()
    .from(carts)
    .where(eq(carts.sessionToken, sessionToken))
    .limit(1);
  if (existing) return existing;
  const [created] = await db.insert(carts).values({ sessionToken }).returning();
  if (!created) throw new Error("Failed to create cart");
  return created;
}

export async function getOrCreateCartForUser(userId: string) {
  const [existing] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(carts).values({ userId }).returning();
  if (!created) throw new Error("Failed to create cart");
  return created;
}

export async function getCartContents(cartId: string, locale: Locale) {
  return db
    .select({
      cartItemId: cartItems.id,
      productId: products.id,
      quantity: cartItems.quantity,
      unitPriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      weightGrams: products.weightGrams,
      name: productTranslations.name,
      slug: productTranslations.slug,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(eq(cartItems.cartId, cartId));
}

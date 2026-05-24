import "server-only";
import { db } from "@/lib/db";
import { carts, cartItems, products, productTranslations } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { Locale } from "./catalog";
import { computeCoffretPrice, type CoffretPrice } from "@/lib/coffret/pricing";
import { PREMIUM_PACKAGING_SURCHARGE_CENTS } from "@/lib/coffret/constants";

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

export type CartLineMetadata =
  | {
      type?: "coffret";
      giftMessage?: string | null;
      packagingTier?: "standard" | "premium";
    }
  | {
      type: "gift_card";
      recipientEmail: string;
      recipientName: string | null;
      message: string | null;
      deliveryAt: string;
    }
  | null;

export type CartLine = {
  cartItemId: string;
  productId: string;
  sku: string;
  type: "biscuit" | "coffret" | "gift_card";
  quantity: number;
  unitPriceCents: number; // for coffrets: computed price + premium surcharge (if applicable)
  stockQuantity: number;
  weightGrams: number;
  name: string;
  slug: string;
  primaryImageUrl: string | null;
  metadata: CartLineMetadata;
  coffretDiscountPercent?: number;
  coffretBreakdown?: CoffretPrice["breakdown"];
};

export async function getCartContents(cartId: string, locale: Locale): Promise<CartLine[]> {
  const rows = await db
    .select({
      cartItemId: cartItems.id,
      productId: products.id,
      sku: products.sku,
      type: products.type,
      quantity: cartItems.quantity,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      weightGrams: products.weightGrams,
      name: productTranslations.name,
      slug: productTranslations.slug,
      metadata: cartItems.metadata,
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

  return Promise.all(
    rows.map(async (r): Promise<CartLine> => {
      let unitPriceCents = r.basePriceCents;
      let coffretBreakdown: CartLine["coffretBreakdown"];
      let coffretDiscountPercent: number | undefined;
      if (r.type === "coffret") {
        const p = await computeCoffretPrice(r.productId, locale);
        unitPriceCents = p.totalCents;
        coffretBreakdown = p.breakdown;
        coffretDiscountPercent = p.discountPercent;
        // Narrow metadata to coffret variant (gift_card variant has no packagingTier)
        if (
          r.metadata &&
          "packagingTier" in r.metadata &&
          r.metadata.packagingTier === "premium"
        ) {
          unitPriceCents += PREMIUM_PACKAGING_SURCHARGE_CENTS;
        }
      }
      // gift_card lines: basePriceCents is already the amount; no special logic needed
      return {
        cartItemId: r.cartItemId,
        productId: r.productId,
        sku: r.sku,
        type: r.type as "biscuit" | "coffret" | "gift_card",
        quantity: r.quantity,
        unitPriceCents,
        stockQuantity: r.stockQuantity,
        weightGrams: r.weightGrams,
        name: r.name,
        slug: r.slug,
        primaryImageUrl: r.primaryImageUrl,
        metadata: r.metadata as CartLine["metadata"],
        coffretDiscountPercent,
        coffretBreakdown,
      };
    }),
  );
}

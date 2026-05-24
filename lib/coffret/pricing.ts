import "server-only";
import { db } from "@/lib/db";
import { coffretContents, products, productTranslations } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { Locale } from "@/lib/queries/catalog";

export type CoffretPrice = {
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  totalCents: number;
  breakdown: Array<{
    biscuitId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineCents: number;
    primaryImageUrl: string | null;
  }>;
};

export async function computeCoffretPrice(coffretId: string, locale: Locale): Promise<CoffretPrice> {
  const rows = await db
    .select({
      biscuitId: coffretContents.biscuitId,
      name: productTranslations.name,
      quantity: coffretContents.quantity,
      unitPriceCents: products.basePriceCents,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(coffretContents)
    .innerJoin(products, eq(products.id, coffretContents.biscuitId))
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(eq(coffretContents.coffretId, coffretId));

  if (rows.length === 0) {
    throw new Error(`Coffret ${coffretId} is empty (no contents)`);
  }
  const [coffret] = await db
    .select({ discountPercent: products.discountPercent })
    .from(products)
    .where(eq(products.id, coffretId))
    .limit(1);
  const discountPercent: number = coffret?.discountPercent ?? 0;

  const breakdown = rows.map((r) => ({
    biscuitId: r.biscuitId,
    name: r.name,
    quantity: r.quantity,
    unitPriceCents: r.unitPriceCents,
    lineCents: r.unitPriceCents * r.quantity,
    primaryImageUrl: r.primaryImageUrl,
  }));
  const subtotalCents = breakdown.reduce((a, b) => a + b.lineCents, 0);
  const discountCents = Math.ceil((subtotalCents * discountPercent) / 100);
  const totalCents = subtotalCents - discountCents;

  return { subtotalCents, discountPercent, discountCents, totalCents, breakdown };
}

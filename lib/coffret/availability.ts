import "server-only";
import { db } from "@/lib/db";
import { coffretContents, products, productTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export type CoffretAvailability =
  | { available: true; maxOrderable: number }
  | {
      available: false;
      blockingBiscuit: { id: string; name: string; needed: number; inStock: number };
    };

export async function isCoffretAvailable(
  coffretId: string,
  requestedQty = 1,
): Promise<CoffretAvailability> {
  const rows = await db
    .select({
      biscuitId: products.id,
      name: productTranslations.name,
      needed: coffretContents.quantity,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
    })
    .from(coffretContents)
    .innerJoin(products, eq(products.id, coffretContents.biscuitId))
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "fr")),
    )
    .where(eq(coffretContents.coffretId, coffretId));

  if (rows.length === 0) {
    return {
      available: false,
      blockingBiscuit: { id: "", name: "(coffret vide)", needed: 0, inStock: 0 },
    };
  }

  let maxOrderable = Infinity;
  let blocking: { id: string; name: string; needed: number; inStock: number } | null = null;
  for (const r of rows) {
    if (!r.isActive) {
      return {
        available: false,
        blockingBiscuit: { id: r.biscuitId, name: r.name, needed: r.needed, inStock: 0 },
      };
    }
    const canMake = Math.floor(r.stockQuantity / r.needed);
    if (canMake < maxOrderable) {
      maxOrderable = canMake;
      blocking = {
        id: r.biscuitId,
        name: r.name,
        needed: r.needed,
        inStock: r.stockQuantity,
      };
    }
  }

  if (maxOrderable >= requestedQty) {
    return { available: true, maxOrderable };
  }
  return { available: false, blockingBiscuit: blocking! };
}

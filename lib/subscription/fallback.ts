import "server-only";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Composes a box of N biscuits from best-sellers + 1 newest item.
// V1: "best-sellers" proxy = top by stockQuantity (high-stock items move).
// Improve later with real sales data.
export async function fallbackBoxComposition(
  boxSize: number,
): Promise<Array<{ biscuitId: string; quantity: number }>> {
  const bestSellers = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.type, "biscuit"), eq(products.isActive, true)))
    .orderBy(desc(products.stockQuantity))
    .limit(5);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newest = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.type, "biscuit"),
        eq(products.isActive, true),
        sql`${products.createdAt} >= ${thirtyDaysAgo}`,
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(1);

  const pool: string[] = [];
  const seen = new Set<string>();
  for (const b of newest) {
    if (!seen.has(b.id)) {
      pool.push(b.id);
      seen.add(b.id);
    }
  }
  for (const b of bestSellers) {
    if (!seen.has(b.id)) {
      pool.push(b.id);
      seen.add(b.id);
    }
  }

  if (pool.length === 0) {
    throw new Error("fallback: no active biscuits available");
  }

  const counts: Record<string, number> = {};
  for (let i = 0; i < boxSize; i++) {
    const id = pool[i % pool.length]!;
    counts[id] = (counts[id] ?? 0) + 1;
  }

  return Object.entries(counts).map(([biscuitId, quantity]) => ({
    biscuitId,
    quantity,
  }));
}

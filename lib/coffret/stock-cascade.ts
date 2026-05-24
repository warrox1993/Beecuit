import "server-only";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

type CoffretSnapshotBiscuit = { biscuitId: string; quantity: number };

type CoffretOrderItemMetadata = {
  type?: string;
  snapshot?: {
    biscuits?: CoffretSnapshotBiscuit[];
  };
};

type OrderItemForCascade = {
  quantity: number;
  metadata: unknown;
};

// Decrements biscuit stocks for every coffret order_item, cascading through the snapshot.
// Safe to call on a mixed order — biscuit items are skipped.
export async function decrementCoffretStockCascade(
  items: OrderItemForCascade[],
): Promise<void> {
  for (const item of items) {
    const meta = item.metadata as CoffretOrderItemMetadata | null;
    if (meta?.type !== "coffret" || !meta.snapshot?.biscuits) continue;
    for (const b of meta.snapshot.biscuits) {
      await db
        .update(products)
        .set({
          stockQuantity: sql`GREATEST(0, ${products.stockQuantity} - ${b.quantity * item.quantity})`,
        })
        .where(eq(products.id, b.biscuitId));
    }
  }
}

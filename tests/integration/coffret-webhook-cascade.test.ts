import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrementCoffretStockCascade } from "@/lib/coffret/stock-cascade";

vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: "test-cascade", role: "customer" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let biscuitId: string;
let initialStock: number;

beforeAll(async () => {
  const [b] = await db
    .select()
    .from(products)
    .where(eq(products.type, "biscuit"))
    .limit(1);
  if (!b) throw new Error("Need a biscuit in DB");
  biscuitId = b.id;
  initialStock = b.stockQuantity;
  await db.update(products).set({ stockQuantity: 100 }).where(eq(products.id, biscuitId));
});

afterAll(async () => {
  await db
    .update(products)
    .set({ stockQuantity: initialStock })
    .where(eq(products.id, biscuitId));
});

describe("decrementCoffretStockCascade", () => {
  it("decrements biscuit stock by snapshot.qty × order_item.qty for each coffret item", async () => {
    await decrementCoffretStockCascade([
      {
        quantity: 2,
        metadata: {
          type: "coffret",
          snapshot: {
            biscuits: [{ biscuitId, quantity: 3 }],
          },
        },
      },
    ]);
    const [updated] = await db
      .select()
      .from(products)
      .where(eq(products.id, biscuitId))
      .limit(1);
    expect(updated!.stockQuantity).toBe(100 - 2 * 3); // 94
  });

  it("ignores non-coffret items", async () => {
    // Reset
    await db.update(products).set({ stockQuantity: 50 }).where(eq(products.id, biscuitId));
    await decrementCoffretStockCascade([
      { quantity: 5, metadata: null },
      { quantity: 5, metadata: { type: "biscuit" } as unknown },
    ]);
    const [updated] = await db
      .select()
      .from(products)
      .where(eq(products.id, biscuitId))
      .limit(1);
    expect(updated!.stockQuantity).toBe(50); // untouched
  });

  it("clamps to 0 if cascade would go negative", async () => {
    await db.update(products).set({ stockQuantity: 2 }).where(eq(products.id, biscuitId));
    await decrementCoffretStockCascade([
      {
        quantity: 1,
        metadata: {
          type: "coffret",
          snapshot: { biscuits: [{ biscuitId, quantity: 99 }] },
        },
      },
    ]);
    const [updated] = await db
      .select()
      .from(products)
      .where(eq(products.id, biscuitId))
      .limit(1);
    expect(updated!.stockQuantity).toBe(0);
  });
});

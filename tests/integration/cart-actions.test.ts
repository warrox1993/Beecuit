import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { products, carts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateCartForSessionToken } from "@/lib/queries/cart";

const TEST_TOKEN = "test-token-cart-actions";

beforeAll(async () => {
  const [p] = await db.select().from(products).limit(1);
  if (!p) throw new Error("Run `pnpm seed` before integration tests");
  await db.delete(carts).where(eq(carts.sessionToken, TEST_TOKEN));
});

describe("cart queries", () => {
  it("getOrCreateCartForSessionToken creates then returns same cart", async () => {
    const c1 = await getOrCreateCartForSessionToken(TEST_TOKEN);
    const c2 = await getOrCreateCartForSessionToken(TEST_TOKEN);
    expect(c1.id).toBe(c2.id);
    await db.delete(carts).where(eq(carts.id, c1.id));
  });

  // Note: the previous "cart_items UNIQUE(cart_id, product_id) merges on conflict" test was
  // removed when Phase 2 dropped that unique index (migration 0004 — coffrets with different
  // gift messages must coexist as separate rows). Biscuit-without-metadata dedup logic is
  // now implemented in cart.actions.ts and covered by coffret-add-to-cart.test.ts.
});

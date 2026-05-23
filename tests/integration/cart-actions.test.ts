import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { products, cartItems, carts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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

  it("cart_items UNIQUE(cart_id, product_id) merges on conflict", async () => {
    const cart = await getOrCreateCartForSessionToken(TEST_TOKEN);
    const [p] = await db.select().from(products).limit(1);
    if (!p) throw new Error("no product");
    await db.insert(cartItems).values({ cartId: cart.id, productId: p.id, quantity: 1 });
    await db
      .insert(cartItems)
      .values({ cartId: cart.id, productId: p.id, quantity: 2 })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: { quantity: sql`${cartItems.quantity} + 2` },
      });
    const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
    expect(items).toHaveLength(1);
    expect(items[0]!.quantity).toBe(3);
    await db.delete(carts).where(eq(carts.id, cart.id));
  });
});

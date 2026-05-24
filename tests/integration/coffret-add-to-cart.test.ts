import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { products, cartItems, carts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const userId = "test-user-coffret-cart";
vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: userId, role: "customer" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let coffretId: string;
let cartId: string;

beforeAll(async () => {
  const [row] = await db.select({ id: products.id }).from(products).where(eq(products.type, "coffret")).limit(1);
  if (!row) throw new Error("Need at least 1 coffret in DB");
  coffretId = row.id;
  // Ensure test user exists (FK target for carts.user_id)
  await db.delete(users).where(eq(users.id, userId));
  await db.insert(users).values({ id: userId, email: `${userId}@test.local`, role: "customer" });
});

afterAll(async () => {
  if (cartId) await db.delete(carts).where(eq(carts.id, cartId));
  await db.delete(users).where(eq(users.id, userId));
});

describe("addToCart with coffret metadata (integration)", () => {
  it("stores metadata (giftMessage, packagingTier) in cart_items", async () => {
    const { addToCart } = await import("@/lib/actions/cart.actions");
    await addToCart({
      productId: coffretId,
      quantity: 1,
      metadata: { type: "coffret", giftMessage: "Joyeux anniv !", packagingTier: "premium" },
    });
    const rows = await db.select().from(cartItems).innerJoin(carts, eq(carts.id, cartItems.cartId)).where(eq(carts.userId, userId));
    expect(rows).toHaveLength(1);
    cartId = rows[0]!.carts.id;
    expect(rows[0]!.cart_items.metadata).toEqual({ type: "coffret", giftMessage: "Joyeux anniv !", packagingTier: "premium" });
  });

  it("creates 2 separate rows when same coffret added with different metadata", async () => {
    const { addToCart } = await import("@/lib/actions/cart.actions");
    await addToCart({
      productId: coffretId,
      quantity: 1,
      metadata: { type: "coffret", giftMessage: "Pour papa", packagingTier: "standard" },
    });
    const rows = await db.select().from(cartItems).innerJoin(carts, eq(carts.id, cartItems.cartId)).where(eq(carts.userId, userId));
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });
});

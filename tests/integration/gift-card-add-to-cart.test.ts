import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { products, cartItems, carts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const userId = "test-user-gift-cart";
vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: userId, role: "customer", email: "buyer@test.com" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let cartId: string | undefined;

beforeAll(async () => {
  await db.insert(users).values({ id: userId, email: "buyer@test.com" }).onConflictDoNothing();
  await db.delete(carts).where(eq(carts.userId, userId));
});

afterAll(async () => {
  if (cartId) await db.delete(carts).where(eq(carts.id, cartId));
  await db.delete(users).where(eq(users.id, userId));
});

describe("addGiftCardToCart (integration)", () => {
  it("inserts a cart_item with type=gift_card metadata + correct GIFT-XXX SKU lookup", async () => {
    const { addGiftCardToCart } = await import("@/lib/actions/cart.actions");
    await addGiftCardToCart({
      amountCents: 5000,
      recipientEmail: "recipient@test.com",
      recipientName: "Marie",
      message: "Joyeux anniversaire !",
      deliveryAt: "2026-12-25T08:00:00.000Z",
    });
    const rows = await db
      .select()
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .innerJoin(products, eq(products.id, cartItems.productId))
      .where(eq(carts.userId, userId));
    expect(rows).toHaveLength(1);
    cartId = rows[0]!.carts.id;
    expect(rows[0]!.products.sku).toBe("GIFT-050");
    expect(rows[0]!.cart_items.metadata).toMatchObject({
      type: "gift_card",
      recipientEmail: "recipient@test.com",
      recipientName: "Marie",
      message: "Joyeux anniversaire !",
      deliveryAt: "2026-12-25T08:00:00.000Z",
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { orders, orderItems, giftCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createGiftCardsForOrder } from "@/lib/stripe/gift-card-webhook";

vi.mock("@/lib/auth", () => ({ auth: async () => null }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let orderId: string;
let itemId: string;
let createdGiftCardId: string | undefined;

beforeAll(async () => {
  const [o] = await db
    .insert(orders)
    .values({
      orderNumber: "TEST-GC-WH-CREATE",
      status: "pending",
      subtotalCents: 5000,
      totalCents: 5000,
      guestEmail: "buyer@test.com",
    })
    .returning();
  orderId = o!.id;
  const [oi] = await db
    .insert(orderItems)
    .values({
      orderId,
      productId: null,
      productNameSnapshot: "Carte cadeau 50 €",
      productSkuSnapshot: "GIFT-050",
      unitPriceCentsSnapshot: 5000,
      quantity: 1,
      lineTotalCents: 5000,
      metadata: {
        type: "gift_card",
        recipientEmail: "recipient@test.com",
        recipientName: null,
        message: "Bonne fête",
        deliveryAt: "2026-12-25T09:00:00.000Z",
      },
    })
    .returning();
  itemId = oi!.id;
});

afterAll(async () => {
  if (createdGiftCardId)
    await db.delete(giftCards).where(eq(giftCards.id, createdGiftCardId));
  await db.delete(orderItems).where(eq(orderItems.id, itemId));
  await db.delete(orders).where(eq(orders.id, orderId));
});

describe("createGiftCardsForOrder", () => {
  it("creates one gift_cards row per gift_card order_item with code + balance", async () => {
    await createGiftCardsForOrder(orderId, "buyer@test.com");
    const cards = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.purchaseOrderId, orderId));
    expect(cards).toHaveLength(1);
    createdGiftCardId = cards[0]!.id;
    expect(cards[0]!.code).toMatch(/^BC-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(cards[0]!.initialAmountCents).toBe(5000);
    expect(cards[0]!.remainingAmountCents).toBe(5000);
    expect(cards[0]!.recipientEmail).toBe("recipient@test.com");
    expect(cards[0]!.deliveryAt.toISOString()).toBe("2026-12-25T09:00:00.000Z");
    expect(cards[0]!.deliveredAt).toBeNull();
    expect(cards[0]!.expiresAt.toISOString()).toBe("2027-12-25T09:00:00.000Z");
  });

  it("is idempotent (calling twice doesn't double-insert)", async () => {
    await createGiftCardsForOrder(orderId, "buyer@test.com");
    const cards = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.purchaseOrderId, orderId));
    expect(cards).toHaveLength(1);
  });
});

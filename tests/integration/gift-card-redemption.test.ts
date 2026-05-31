import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { orders, giftCards, giftCardRedemptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { applyGiftCardRedemption } from "@/lib/stripe/gift-card-webhook";

vi.mock("@/lib/auth", () => ({ auth: async () => null }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let orderId: string;
let cardId: string;

beforeAll(async () => {
  const [gc] = await db
    .insert(giftCards)
    .values({
      code: "BC-RED1-TEST-CODE",
      initialAmountCents: 5000,
      // Balance already RESERVED at checkout (5000 - 2000): applyGiftCardRedemption
      // now only RECORDS the redemption, it must NOT decrement again.
      remainingAmountCents: 3000,
      currency: "EUR",
      purchaserEmail: "buyer@test.com",
      recipientEmail: "user@test.com",
      deliveryAt: new Date("2026-01-01"),
      deliveredAt: new Date("2026-01-01"),
      expiresAt: new Date("2027-01-01"),
      isActive: true,
    })
    .returning();
  cardId = gc!.id;
  const [o] = await db
    .insert(orders)
    .values({
      orderNumber: "TEST-GC-RED-1",
      status: "pending",
      subtotalCents: 3000,
      totalCents: 1000,
      guestEmail: "user@test.com",
      metadata: {
        giftCardId: cardId,
        giftCardDeductionCents: 2000,
        stripeCouponId: "cpn_test",
      },
    })
    .returning();
  orderId = o!.id;
});

afterAll(async () => {
  await db
    .delete(giftCardRedemptions)
    .where(eq(giftCardRedemptions.giftCardId, cardId));
  await db.delete(orders).where(eq(orders.id, orderId));
  await db.delete(giftCards).where(eq(giftCards.id, cardId));
});

describe("applyGiftCardRedemption (record-only — balance reserved at checkout)", () => {
  it("creates redemption row + sets orders.gift_card_redemption_id WITHOUT re-debiting", async () => {
    await applyGiftCardRedemption(orderId);
    const [c] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    // Balance must stay at the already-reserved value (no second decrement).
    expect(c!.remainingAmountCents).toBe(3000);
    const reds = await db
      .select()
      .from(giftCardRedemptions)
      .where(eq(giftCardRedemptions.giftCardId, cardId));
    expect(reds).toHaveLength(1);
    expect(reds[0]!.amountCents).toBe(2000);
    expect(reds[0]!.stripeCouponId).toBe("cpn_test");
    const [o] = await db.select().from(orders).where(eq(orders.id, orderId));
    expect(o!.giftCardRedemptionId).toBe(reds[0]!.id);
  });

  it("is idempotent (calling twice doesn't create a second redemption)", async () => {
    await applyGiftCardRedemption(orderId);
    const [c] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    expect(c!.remainingAmountCents).toBe(3000);
    const reds = await db
      .select()
      .from(giftCardRedemptions)
      .where(eq(giftCardRedemptions.giftCardId, cardId));
    expect(reds).toHaveLength(1);
  });
});

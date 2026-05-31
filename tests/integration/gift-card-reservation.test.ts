import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  reserveGiftCardBalance,
  refundGiftCardBalance,
} from "@/lib/gift-cards/reservation";

let cardId: string;

async function seedCard(remaining: number): Promise<string> {
  const [gc] = await db
    .insert(giftCards)
    .values({
      code: `BC-RSV1-TEST-${Math.floor(remaining)}`,
      initialAmountCents: 5000,
      remainingAmountCents: remaining,
      currency: "EUR",
      purchaserEmail: "buyer@test.com",
      recipientEmail: "user@test.com",
      deliveryAt: new Date("2026-01-01"),
      deliveredAt: new Date("2026-01-01"),
      expiresAt: new Date("2027-01-01"),
      isActive: true,
    })
    .returning();
  return gc!.id;
}

afterAll(async () => {
  if (cardId) await db.delete(giftCards).where(eq(giftCards.id, cardId));
});

describe("gift card balance reservation (double-spend protection)", () => {
  beforeEach(async () => {
    if (cardId) await db.delete(giftCards).where(eq(giftCards.id, cardId));
    cardId = await seedCard(5000);
  });

  it("reserves when the balance covers the amount and debits it", async () => {
    const ok = await reserveGiftCardBalance(cardId, 2000);
    expect(ok).toBe(true);
    const [c] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    expect(c!.remainingAmountCents).toBe(3000);
  });

  it("refuses (returns false) and does NOT debit when balance is insufficient", async () => {
    const ok = await reserveGiftCardBalance(cardId, 6000);
    expect(ok).toBe(false);
    const [c] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    expect(c!.remainingAmountCents).toBe(5000);
  });

  it("prevents double-spend: a second full reservation on the same card fails", async () => {
    // First checkout reserves the full balance...
    const first = await reserveGiftCardBalance(cardId, 5000);
    expect(first).toBe(true);
    // ...a concurrent second checkout for the same amount must NOT succeed.
    const second = await reserveGiftCardBalance(cardId, 5000);
    expect(second).toBe(false);
    const [c] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    expect(c!.remainingAmountCents).toBe(0);
  });

  it("refund re-credits an abandoned reservation", async () => {
    await reserveGiftCardBalance(cardId, 2000);
    await refundGiftCardBalance(cardId, 2000);
    const [c] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    expect(c!.remainingAmountCents).toBe(5000);
  });
});

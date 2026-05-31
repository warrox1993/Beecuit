import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";

/**
 * Atomically reserve (debit) `amountCents` from a gift card, but only if the
 * remaining balance still covers it. The single conditional UPDATE serializes
 * concurrent checkouts: at most one of N simultaneous requests for the same card
 * can debit a given amount, which is what prevents the double-spend where each
 * checkout would otherwise receive a full Stripe coupon for the same balance.
 *
 * @returns true if the balance was reserved, false if insufficient/contended.
 */
export async function reserveGiftCardBalance(
  cardId: string,
  amountCents: number,
): Promise<boolean> {
  const rows = await db
    .update(giftCards)
    .set({
      remainingAmountCents: sql`${giftCards.remainingAmountCents} - ${amountCents}`,
    })
    .where(
      sql`${giftCards.id} = ${cardId} AND ${giftCards.remainingAmountCents} >= ${amountCents}`,
    )
    .returning({ id: giftCards.id });
  return rows.length > 0;
}

/**
 * Re-credit a previously reserved amount when a checkout is abandoned, fails, or
 * expires before payment, so a legitimate customer never loses their balance.
 */
export async function refundGiftCardBalance(
  cardId: string,
  amountCents: number,
): Promise<void> {
  await db
    .update(giftCards)
    .set({
      remainingAmountCents: sql`${giftCards.remainingAmountCents} + ${amountCents}`,
    })
    .where(eq(giftCards.id, cardId));
}

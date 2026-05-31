import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, giftCards, giftCardRedemptions } from "@/lib/db/schema";
import { generateGiftCardCode } from "@/lib/gift-cards/code";
import { EXPIRATION_MONTHS } from "@/lib/gift-cards/constants";

// Add N months to a date (works without date-fns: clamps day-of-month to last day of target month)
function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  // If overflow (e.g. Jan 31 + 1 month = Mar 3 in JS), clamp to last day of intended month
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0);
  }
  return d;
}

type GiftCardItemMetadata = {
  type: "gift_card";
  recipientEmail: string;
  recipientName: string | null;
  message: string | null;
  deliveryAt: string;
};

export async function createGiftCardsForOrder(
  orderId: string,
  purchaserEmail: string,
  purchaserUserId?: string | null,
): Promise<void> {
  // Idempotent: if any gift cards were already created for this order, skip.
  const existing = await db
    .select()
    .from(giftCards)
    .where(eq(giftCards.purchaseOrderId, orderId));
  if (existing.length > 0) return;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    const meta = item.metadata as { type?: string } | null;
    if (meta?.type !== "gift_card") continue;
    const gcMeta = item.metadata as GiftCardItemMetadata;
    const deliveryAt = new Date(gcMeta.deliveryAt);
    const expiresAt = addMonths(deliveryAt, EXPIRATION_MONTHS);

    // Retry up to 3× on rare code collision
    let attempt = 0;
    let inserted = false;
    while (!inserted && attempt < 3) {
      try {
        await db.insert(giftCards).values({
          code: generateGiftCardCode(),
          initialAmountCents: item.unitPriceCentsSnapshot,
          remainingAmountCents: item.unitPriceCentsSnapshot,
          currency: "EUR",
          purchaserEmail,
          purchaserUserId: purchaserUserId ?? null,
          recipientEmail: gcMeta.recipientEmail,
          recipientName: gcMeta.recipientName,
          message: gcMeta.message,
          deliveryAt,
          expiresAt,
          purchaseOrderId: orderId,
          isActive: true,
        });
        inserted = true;
      } catch (e) {
        attempt++;
        if (attempt >= 3) throw e;
      }
    }
  }
}

export async function applyGiftCardRedemption(orderId: string): Promise<void> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;
  // Idempotent
  if (order.giftCardRedemptionId) return;

  const meta = order.metadata as
    | { giftCardId?: string; giftCardDeductionCents?: number; stripeCouponId?: string }
    | undefined;
  if (!meta?.giftCardId || !meta?.giftCardDeductionCents) return;

  const cardId = meta.giftCardId;
  const deductionCents = meta.giftCardDeductionCents;

  // The balance was already RESERVED (debited) at checkout, before the Stripe
  // coupon was issued (see createCheckoutSession). On successful payment we only
  // need to RECORD the redemption — decrementing again would double-charge the
  // card. Idempotency is guaranteed by the `order.giftCardRedemptionId` guard
  // above plus the webhook-event dedup table.
  const [red] = await db
    .insert(giftCardRedemptions)
    .values({
      giftCardId: cardId,
      orderId,
      amountCents: deductionCents,
      stripeCouponId: meta.stripeCouponId ?? null,
    })
    .returning();

  await db
    .update(orders)
    .set({ giftCardRedemptionId: red!.id })
    .where(eq(orders.id, orderId));
}

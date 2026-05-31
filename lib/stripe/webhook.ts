import "server-only";
import type Stripe from "stripe";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, products, stripeWebhookEvents } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/client";
import { OrderConfirmation } from "@/lib/email/templates/OrderConfirmation";
import { decrementCoffretStockCascade } from "@/lib/coffret/stock-cascade";
import { refundGiftCardBalance } from "@/lib/gift-cards/reservation";
import {
  createGiftCardsForOrder,
  applyGiftCardRedemption,
} from "@/lib/stripe/gift-card-webhook";

/**
 * `checkout.session.expired` — a checkout was abandoned and Stripe expired it.
 * Re-credit any gift-card balance that was RESERVED at checkout (and never
 * redeemed) so a legitimate customer doesn't lose their balance, and cancel the
 * still-pending order. Idempotent via the webhook-event dedup table.
 */
export async function handleCheckoutExpired(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<void> {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  try {
    await db.insert(stripeWebhookEvents).values({
      id: eventId,
      eventType: "checkout.session.expired",
      orderId,
    });
  } catch {
    return; // duplicate event — already processed
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.status !== "pending" || order.giftCardRedemptionId) return;

  // Atomically claim the cancellation: the conditional UPDATE only matches while
  // the order is still pending. This serializes against a racing
  // checkout.session.completed (possible with async Belgian methods like
  // Bancontact/iDEAL): if payment already flipped the order to paid, we match 0
  // rows and must NOT re-credit the balance.
  const cancelled = await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });
  if (cancelled.length === 0) return;

  const meta = order.metadata as
    | { giftCardId?: string; giftCardDeductionCents?: number }
    | undefined;
  if (meta?.giftCardId && meta?.giftCardDeductionCents) {
    await refundGiftCardBalance(meta.giftCardId, meta.giftCardDeductionCents);
  }
}

export async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.error("[webhook] missing metadata.order_id", { eventId: event.id });
    return;
  }

  try {
    await db.insert(stripeWebhookEvents).values({
      id: event.id,
      eventType: event.type,
      orderId,
    });
  } catch {
    // Duplicate event — already processed (idempotency guard)
    return;
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) {
    console.error("[webhook] order not found", { orderId });
    return;
  }
  if (order.status !== "pending") {
    return;
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    })
    .where(eq(orders.id, orderId));

  for (const item of items) {
    if (!item.productId) continue;
    // For coffret rows, the coffret product itself has stockQuantity=0 (ignored).
    // The cascade below decrements each included biscuit instead.
    await db
      .update(products)
      .set({ stockQuantity: sql`GREATEST(${products.stockQuantity} - ${item.quantity}, 0)` })
      .where(eq(products.id, item.productId));
  }

  // Cascade: for coffret order_items, decrement each biscuit by snapshot.qty × order_item.qty.
  await decrementCoffretStockCascade(items);

  const recipient =
    order.guestEmail ??
    (typeof session.customer_details?.email === "string" ? session.customer_details.email : null);

  // Gift cards: issue cards purchased in this order, then finalize a redemption (if any).
  // Pass order.userId so authenticated purchasers see their gift cards in /compte/cartes-cadeaux.
  await createGiftCardsForOrder(orderId, recipient ?? order.guestEmail ?? "", order.userId);
  await applyGiftCardRedemption(orderId);

  if (recipient) {
    try {
      await sendEmail({
        to: recipient,
        subject: `Ta commande Au Fil des Saveurs #${order.orderNumber} est confirmée`,
        react: OrderConfirmation({
          orderNumber: order.orderNumber,
          totalCents: order.totalCents,
          items: items.map((i) => ({
            name: i.productNameSnapshot,
            quantity: i.quantity,
            lineTotalCents: i.lineTotalCents,
            metadata: i.metadata as Parameters<
              typeof OrderConfirmation
            >[0]["items"][number]["metadata"],
          })),
        }),
      });
    } catch (e) {
      console.error("[webhook] email send failed", e);
    }
  }
}

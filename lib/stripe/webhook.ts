import "server-only";
import type Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, products, stripeWebhookEvents } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/client";
import { OrderConfirmation } from "@/lib/email/templates/OrderConfirmation";

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
    await db
      .update(products)
      .set({ stockQuantity: sql`GREATEST(${products.stockQuantity} - ${item.quantity}, 0)` })
      .where(eq(products.id, item.productId));
  }

  const recipient = order.guestEmail ?? (typeof session.customer_details?.email === "string" ? session.customer_details.email : null);
  if (recipient) {
    try {
      await sendEmail({
        to: recipient,
        subject: `Ta commande BeeCuit #${order.orderNumber} est confirmée`,
        react: OrderConfirmation({
          orderNumber: order.orderNumber,
          totalCents: order.totalCents,
          items: items.map((i) => ({
            name: i.productNameSnapshot,
            quantity: i.quantity,
            lineTotalCents: i.lineTotalCents,
          })),
        }),
      });
    } catch (e) {
      console.error("[webhook] email send failed", e);
    }
  }
}

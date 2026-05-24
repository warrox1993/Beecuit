import "server-only";
import type Stripe from "stripe";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  subscriptions,
  subscriptionBoxes,
  subscriptionBoxItems,
  orders,
  orderItems,
  products,
} from "@/lib/db/schema";
import { currentYearMonth, compositionDeadlineFor } from "@/lib/subscription/dates";

function addMonths(d: Date, months: number): Date {
  const dd = new Date(d.getTime());
  dd.setUTCMonth(dd.getUTCMonth() + months);
  return dd;
}

export async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const meta = (sub.metadata ?? {}) as {
    userId?: string;
    format?: string;
    engagement_months?: string;
  };
  if (!meta.userId || !meta.format || meta.engagement_months === undefined) {
    console.error("[subscription.created] missing metadata", sub.id);
    return;
  }
  const engagementMonths = Number(meta.engagement_months);
  const startedAt = new Date(sub.created * 1000);
  const engagementEndsAt = engagementMonths > 0 ? addMonths(startedAt, engagementMonths) : null;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  await db
    .insert(subscriptions)
    .values({
      userId: meta.userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      format: meta.format as "mini" | "classique" | "famille",
      engagementMonths,
      status: "trialing",
      startedAt,
      engagementEndsAt,
      shippingAddressSnapshot: {},
    })
    .onConflictDoNothing();
}

export async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({ status: "expired", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));
}

export async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  let next: "active" | "paused" | "cancelled" | "past_due" | null = null;
  if (sub.pause_collection) next = "paused";
  else if (sub.status === "past_due" || sub.status === "unpaid") next = "past_due";
  else if (sub.cancel_at_period_end) next = "cancelled";
  else if (sub.status === "active") next = "active";

  if (next) {
    await db
      .update(subscriptions)
      .set({ status: next, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
  }
}

export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Stripe SDK v22+ moved `subscription` off the typed Invoice; cast to access
  const invAny = invoice as unknown as {
    subscription?: string | { id: string };
    payment_intent?: string | { id: string };
  };
  const subId =
    typeof invAny.subscription === "string"
      ? invAny.subscription
      : invAny.subscription?.id;
  if (!subId) return;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subId))
    .limit(1);
  if (!sub) {
    console.error("[invoice.paid] subscription not found", subId);
    return;
  }

  await db
    .update(subscriptions)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));

  const periodStart = new Date(invoice.period_start * 1000);
  const cycleYearMonth = currentYearMonth(periodStart);

  let [box] = await db
    .select()
    .from(subscriptionBoxes)
    .where(
      and(
        eq(subscriptionBoxes.subscriptionId, sub.id),
        eq(subscriptionBoxes.cycleYearMonth, cycleYearMonth),
      ),
    )
    .limit(1);

  if (!box) {
    const [created] = await db
      .insert(subscriptionBoxes)
      .values({
        subscriptionId: sub.id,
        cycleYearMonth,
        status: "locked",
        compositionDeadline: compositionDeadlineFor(cycleYearMonth),
        composedBy: "fallback",
      })
      .returning();
    box = created!;
  }

  if (box.status === "shipped") return;

  const items = await db
    .select()
    .from(subscriptionBoxItems)
    .where(eq(subscriptionBoxItems.boxId, box.id));

  const orderNumber = `BCT-SUB-${cycleYearMonth}-${sub.id.slice(0, 6)}`;
  const paidAt = invoice.status_transitions.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : new Date();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: sub.userId,
      guestEmail: null,
      status: "paid",
      subtotalCents: invoice.amount_paid,
      shippingCents: 0,
      taxCents: 0,
      totalCents: invoice.amount_paid,
      currency: "EUR",
      locale: "fr",
      shippingAddressSnapshot: sub.shippingAddressSnapshot,
      billingAddressSnapshot: sub.shippingAddressSnapshot,
      shippingMethod: "bpost_express_24h",
      stripePaymentIntentId:
        typeof invAny.payment_intent === "string" ? invAny.payment_intent : null,
      subscriptionBoxId: box.id,
      paidAt,
    })
    .returning();
  if (!order) return;

  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.biscuitId,
      productNameSnapshot: "(subscription box item)",
      productSkuSnapshot: "(snapshot)",
      unitPriceCentsSnapshot: 0,
      quantity: item.quantity,
      lineTotalCents: 0,
    });
    await db
      .update(products)
      .set({
        stockQuantity: sql`GREATEST(${products.stockQuantity} - ${item.quantity}, 0)`,
      })
      .where(eq(products.id, item.biscuitId));
  }

  await db
    .update(subscriptionBoxes)
    .set({ status: "shipped", shippingOrderId: order.id })
    .where(eq(subscriptionBoxes.id, box.id));
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Stripe SDK v22+ moved `subscription` off the typed Invoice; cast to access
  const invAny = invoice as unknown as {
    subscription?: string | { id: string };
    payment_intent?: string | { id: string };
  };
  const subId =
    typeof invAny.subscription === "string"
      ? invAny.subscription
      : invAny.subscription?.id;
  if (!subId) return;
  await db
    .update(subscriptions)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, subId));
}

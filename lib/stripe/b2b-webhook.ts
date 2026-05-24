import "server-only";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { b2bQuoteRequests } from "@/lib/db/schemas/b2b";
import { orders } from "@/lib/db/schemas/orders";
import { sendB2BPaymentConfirmation } from "@/lib/email/send-b2b";

export async function handleB2BPaymentCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const quoteId = session.metadata?.b2b_quote_id;
  if (!quoteId) return;

  const quote = (
    await db.select().from(b2bQuoteRequests).where(eq(b2bQuoteRequests.id, quoteId)).limit(1)
  )[0];
  if (!quote) {
    console.warn("[b2b webhook] quote not found", quoteId);
    return;
  }
  if (quote.status === "paid") {
    return;
  }

  const paidAt = new Date();
  await db
    .update(b2bQuoteRequests)
    .set({ status: "paid", paidAt, updatedAt: paidAt })
    .where(eq(b2bQuoteRequests.id, quoteId));

  const orderNumber = `B2B-${quoteId.slice(0, 8).toUpperCase()}`;
  const totalCents = quote.quotedAmountCents ?? session.amount_total ?? 0;
  try {
    await db.insert(orders).values({
      orderNumber,
      guestEmail: quote.email,
      status: "paid",
      subtotalCents: totalCents,
      shippingCents: 0,
      taxCents: 0,
      totalCents,
      currency: "EUR",
      locale: quote.locale,
      shippingAddressSnapshot: (quote.shippingAddress as Record<string, unknown>) ?? null,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      b2bQuoteId: quoteId,
      paidAt,
      metadata: { source: "b2b" },
    });
  } catch (e) {
    // UNIQUE constraint on orders.b2b_quote_id catches concurrent webhook replays.
    // 23505 = unique_violation. If we hit it, another invocation already inserted; we're done.
    const code = (e as { code?: string } | null)?.code;
    if (code === "23505") {
      console.log("[b2b webhook] duplicate insert prevented by UNIQUE constraint", quoteId);
      return;
    }
    throw e;
  }

  await sendB2BPaymentConfirmation({
    to: quote.email,
    contactName: quote.contactName,
    amountCents: totalCents,
  }).catch((e) => console.error("[b2b webhook] confirmation email failed", e));
}

import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import { handleCheckoutCompleted, handleCheckoutExpired } from "@/lib/stripe/webhook";
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
} from "@/lib/stripe/subscription-webhook";
import { handleB2BPaymentCompleted } from "@/lib/stripe/b2b-webhook";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing signature", { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("[webhook] signature verify failed", e);
    return new NextResponse("invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.b2b_quote_id) {
        await handleB2BPaymentCompleted(session);
      } else {
        await handleCheckoutCompleted(event);
      }
    } else if (event.type === "checkout.session.expired") {
      // Re-credit reserved gift-card balance on abandoned checkouts (self-guards
      // on metadata.order_id, so B2B/subscription sessions are no-ops).
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session, event.id);
    } else if (event.type === "customer.subscription.created") {
      await handleSubscriptionCreated(event.data.object);
    } else if (event.type === "customer.subscription.updated") {
      await handleSubscriptionUpdated(event.data.object);
    } else if (event.type === "customer.subscription.deleted") {
      await handleSubscriptionDeleted(event.data.object);
    } else if (event.type === "invoice.paid") {
      await handleInvoicePaid(event.data.object);
    } else if (event.type === "invoice.payment_failed") {
      await handleInvoicePaymentFailed(event.data.object);
    }
  } catch (e) {
    console.error("[webhook] handler error", e);
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

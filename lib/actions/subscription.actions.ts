"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions, subscriptionBoxes, subscriptionBoxItems } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import { getOrCreateStripeCustomer } from "@/lib/subscription/stripe-customer";
import { getStripePriceId } from "@/lib/subscription/pricing";
import { nextFirstOfMonth } from "@/lib/subscription/dates";
import { FORMAT_SIZES } from "@/lib/subscription/constants";
import {
  CreateSubscriptionCheckoutSchema,
  ComposeBoxSchema,
  UpdateSubscriptionAddressSchema,
} from "@/lib/validators/subscription";

export async function createSubscriptionCheckout(
  raw: unknown,
  locale: "fr" | "nl" | "de" | "en" = "fr",
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect(`/${locale}/sign-in?return=${encodeURIComponent("/" + locale + "/abonnement")}`);
  }
  const input = CreateSubscriptionCheckoutSchema.parse(raw);

  const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email);
  const priceId = getStripePriceId(input.format, input.engagement);
  const anchor = Math.floor(nextFirstOfMonth().getTime() / 1000);

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      billing_cycle_anchor: anchor,
      proration_behavior: "none",
      metadata: {
        format: input.format,
        engagement_months: String(input.engagement),
        userId: session.user.id,
      },
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/compte/abonnement?welcome=1`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/abonnement`,
  });
  redirect(stripeSession.url!);
}

async function getOwnedSubscription(subId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Auth required");
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subId)).limit(1);
  if (!sub) throw new Error("Subscription not found");
  if (sub.userId !== session.user.id) throw new Error("Forbidden");
  return sub;
}

export async function pauseSubscription(subscriptionId: string) {
  const sub = await getOwnedSubscription(subscriptionId);
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    pause_collection: { behavior: "void" },
  });
  await db
    .update(subscriptions)
    .set({ status: "paused", pausedAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));
  revalidatePath("/", "layout");
}

export async function resumeSubscription(subscriptionId: string) {
  const sub = await getOwnedSubscription(subscriptionId);
  // Stripe accepts `null` to clear pause_collection; "" is silently ignored.
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    pause_collection: null,
  });
  await db
    .update(subscriptions)
    .set({ status: "active", pausedAt: null, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));
  revalidatePath("/", "layout");
}

export async function cancelSubscription(subscriptionId: string) {
  const sub = await getOwnedSubscription(subscriptionId);
  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));
  revalidatePath("/", "layout");
}

export async function updateSubscriptionAddress(raw: unknown) {
  const input = UpdateSubscriptionAddressSchema.parse(raw);
  const sub = await getOwnedSubscription(input.subscriptionId);
  await db
    .update(subscriptions)
    .set({
      shippingAddressSnapshot: input.shippingAddress as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));
  revalidatePath("/", "layout");
}

export async function composeBox(raw: unknown) {
  const input = ComposeBoxSchema.parse(raw);
  const session = await auth();
  if (!session?.user?.id) throw new Error("Auth required");

  const [box] = await db
    .select()
    .from(subscriptionBoxes)
    .where(eq(subscriptionBoxes.id, input.boxId))
    .limit(1);
  if (!box) throw new Error("Box not found");
  if (box.status !== "composing") {
    throw new Error("Box deadline passed (status: " + box.status + ")");
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, box.subscriptionId))
    .limit(1);
  if (!sub || sub.userId !== session.user.id) throw new Error("Forbidden");

  const totalQty = input.items.reduce((s, x) => s + x.quantity, 0);
  if (totalQty !== FORMAT_SIZES[sub.format]) {
    throw new Error(
      `Composition must total ${FORMAT_SIZES[sub.format]} biscuits, got ${totalQty}`,
    );
  }

  // Re-read box right before mutation to catch lock-phase cron flip (composing → locked).
  // This narrows but doesn't eliminate the race; without transactions on neon-http we accept
  // last-write-wins semantics for two concurrent user submissions (rare for a once-monthly action).
  const [recheck] = await db
    .select({ status: subscriptionBoxes.status })
    .from(subscriptionBoxes)
    .where(eq(subscriptionBoxes.id, box.id))
    .limit(1);
  if (!recheck || recheck.status !== "composing") {
    throw new Error("Box was locked, please refresh and retry");
  }

  await db.delete(subscriptionBoxItems).where(eq(subscriptionBoxItems.boxId, box.id));
  await db.insert(subscriptionBoxItems).values(
    input.items.map((item) => ({
      boxId: box.id,
      biscuitId: item.biscuitId,
      quantity: item.quantity,
    })),
  );
  await db
    .update(subscriptionBoxes)
    .set({ composedBy: "user" })
    .where(eq(subscriptionBoxes.id, box.id));
  revalidatePath("/", "layout");
}

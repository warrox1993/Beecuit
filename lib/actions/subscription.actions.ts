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

  // Compute the billing cycle anchor (1st of next month UTC). If we're within the last
  // minute before the new month starts, the anchor we computed could become "in the past"
  // by the time Stripe processes the API call. Bump by 1 hour in that window — Stripe
  // still bills on the 1st and no harm is done.
  const anchorDate = nextFirstOfMonth();
  if (anchorDate.getTime() - Date.now() < 60_000) {
    anchorDate.setUTCHours(anchorDate.getUTCHours() + 1);
  }
  const anchor = Math.floor(anchorDate.getTime() / 1000);

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    shipping_address_collection: { allowed_countries: ["BE", "FR", "NL", "LU", "DE"] },
    phone_number_collection: { enabled: true },
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

  // 1. Read box including updatedAt (the CAS guard).
  const [box] = await db
    .select()
    .from(subscriptionBoxes)
    .where(eq(subscriptionBoxes.id, input.boxId))
    .limit(1);
  if (!box) throw new Error("Box not found");

  // 2. Validate status and ownership.
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
      `Composition must total ${FORMAT_SIZES[sub.format]} sachets, got ${totalQty}`,
    );
  }

  // 3. Compare-and-swap on (id, updated_at, status). This single SQL statement is
  // atomic even on neon-http: it serializes concurrent writers because only one
  // session's UPDATE will match the row's current updated_at.
  const claimed = await db
    .update(subscriptionBoxes)
    .set({ updatedAt: new Date(), composedBy: "user" })
    .where(
      and(
        eq(subscriptionBoxes.id, box.id),
        eq(subscriptionBoxes.updatedAt, box.updatedAt),
        eq(subscriptionBoxes.status, "composing"),
      ),
    )
    .returning({ id: subscriptionBoxes.id });

  // 4. If CAS lost (empty returning), another request modified the box.
  if (claimed.length === 0) {
    throw new Error("Box was modified by another request, please refresh and retry");
  }

  // 5. Now safe to mutate the children: DELETE old items + batch INSERT new ones.
  await db.delete(subscriptionBoxItems).where(eq(subscriptionBoxItems.boxId, box.id));
  await db.insert(subscriptionBoxItems).values(
    input.items.map((item) => ({
      boxId: box.id,
      biscuitId: item.biscuitId,
      quantity: item.quantity,
    })),
  );
  revalidatePath("/", "layout");
}

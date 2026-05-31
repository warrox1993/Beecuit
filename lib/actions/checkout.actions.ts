"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, orders, orderItems, shippingRates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { checkAuthRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import {
  reserveGiftCardBalance,
  refundGiftCardBalance,
} from "@/lib/gift-cards/reservation";
import { env } from "@/lib/env";
import { CheckoutSchema } from "@/lib/validators/checkout";
import { computeOrderTotals } from "@/lib/totals";
import { pickShippingRate, type ShippingRate } from "@/lib/shipping/bpost";
import { getCartContents, type CartLine } from "@/lib/queries/cart";
import { formatOrderNumber } from "@/lib/order-number";
import { createStripeCheckoutSession } from "@/lib/stripe/checkout";
import { isCoffretAvailable } from "@/lib/coffret/availability";

// Narrow CartLine metadata for coffret rows and build the order_items.metadata jsonb.
function buildOrderItemMetadata(i: CartLine) {
  if (i.type === "coffret") {
    const m = i.metadata && "packagingTier" in (i.metadata ?? {}) ? i.metadata : null;
    const giftMessage = m && "giftMessage" in m ? m.giftMessage ?? null : null;
    const packagingTier = m && "packagingTier" in m ? m.packagingTier ?? "standard" : "standard";
    return {
      type: "coffret" as const,
      giftMessage,
      packagingTier,
      snapshot: {
        discountPercent: i.coffretDiscountPercent ?? 0,
        biscuits: (i.coffretBreakdown ?? []).map((b) => ({
          biscuitId: b.biscuitId,
          name: b.name,
          quantity: b.quantity,
          unitPriceCents: b.unitPriceCents,
        })),
      },
    };
  }
  if (i.type === "gift_card" && i.metadata && i.metadata.type === "gift_card") {
    return {
      type: "gift_card" as const,
      recipientEmail: i.metadata.recipientEmail,
      recipientName: i.metadata.recipientName,
      message: i.metadata.message,
      deliveryAt: i.metadata.deliveryAt,
    };
  }
  return null;
}

function lineItemName(i: CartLine): string {
  if (i.type === "coffret" && i.metadata && "packagingTier" in i.metadata && i.metadata.packagingTier === "premium") {
    return `${i.name} (emballage premium)`;
  }
  return i.name;
}

export async function calculateShipping(weightGrams: number, subtotalCents: number) {
  const rates = await db.select().from(shippingRates).where(eq(shippingRates.country, "BE"));
  const r: ShippingRate[] = rates.map((x) => ({
    method: x.method,
    country: x.country,
    weightGramsMax: x.weightGramsMax,
    priceCents: x.priceCents,
    freeShippingThresholdCents: x.freeShippingThresholdCents,
  }));
  return pickShippingRate(r, weightGrams, subtotalCents);
}

export async function createCheckoutSession(rawInput: unknown, locale: "fr" | "nl" | "de" | "en") {
  const input = CheckoutSchema.parse(rawInput);
  const session = await auth();
  const store = await cookies();
  const sessionToken = store.get("cart_session_token")?.value;

  const [cart] = session?.user?.id
    ? await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1)
    : sessionToken
      ? await db.select().from(carts).where(eq(carts.sessionToken, sessionToken)).limit(1)
      : [];
  if (!cart) throw new Error("Cart not found");

  const items = await getCartContents(cart.id, locale);
  if (items.length === 0) throw new Error("Cart is empty");

  for (const i of items) {
    if (i.type === "coffret") {
      const avail = await isCoffretAvailable(i.productId, i.quantity, locale);
      if (!avail.available) {
        throw new Error(
          `Coffret « ${i.name} » indisponible (rupture sur ${avail.blockingBiscuit.name})`,
        );
      }
    } else if (i.quantity > i.stockQuantity) {
      throw new Error(`Stock insuffisant pour ${i.name}`);
    }
  }

  const totalWeight = items.reduce((s, i) => s + i.weightGrams * i.quantity, 0);
  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  // Gift-card-only orders ship "by email" — skip physical shipping.
  const allGiftCards = items.every((i) => i.type === "gift_card");
  let shippingCents = 0;
  if (!allGiftCards) {
    const rate = await calculateShipping(totalWeight, subtotalCents);
    if (!rate) throw new Error("Poids excède la livraison disponible");
    shippingCents = rate.priceCents;
  }

  const totals = computeOrderTotals({
    lines: items.map((i) => ({ unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
    shippingCents,
    vatPercentInclusive: 6,
  });

  // Gift card redemption (cannot apply a card to an order that BUYS a gift card).
  // Validate eagerly but defer coupon creation until just before createStripeCheckoutSession
  // to minimize the orphaned-coupon window.
  const hasGiftCardItem = items.some((i) => i.type === "gift_card");
  let giftCardValidation:
    | { cardId: string; deductionCents: number; code: string }
    | undefined;
  if (input.giftCardCode && !hasGiftCardItem) {
    // Rate-limit code validation by IP to prevent online brute-forcing of
    // financially-valuable codes.
    const ip = getClientIp(await headers());
    const rl = await checkAuthRateLimit({ action: "gift-card", ip });
    if (!rl.ok) {
      throw new Error("Trop de tentatives de carte cadeau, réessaie dans quelques minutes");
    }
    const { validateGiftCardCode } = await import("@/lib/gift-cards/validation");
    const v = await validateGiftCardCode(input.giftCardCode);
    if (!v.valid) throw new Error(v.error);
    const deductionCents = Math.min(v.amountAvailableCents, totals.totalCents);
    giftCardValidation = {
      cardId: v.cardId,
      deductionCents,
      code: input.giftCardCode,
    };
  } else if (input.giftCardCode && hasGiftCardItem) {
    throw new Error("Tu ne peux pas utiliser une carte cadeau pour acheter une carte cadeau");
  }

  const seqResult = await db.execute(sql`SELECT nextval('order_number_seq') AS n`);
  const seqUnknown = seqResult as unknown;
  const rows =
    (seqUnknown as { rows?: Array<{ n: string | number }> }).rows ??
    (seqUnknown as Array<{ n: string | number }>);
  const n = Number(
    Array.isArray(rows)
      ? (rows[0] as { n: string | number } | undefined)?.n
      : (seqUnknown as { n: string | number }).n,
  );
  const orderNumber = formatOrderNumber(n);

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: session?.user?.id ?? null,
      guestEmail: input.email,
      status: "pending",
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      taxCents: totals.vatCents,
      totalCents: totals.totalCents,
      currency: "EUR",
      locale,
      shippingAddressSnapshot: input.shippingAddress,
      billingAddressSnapshot: input.billingSameAsShipping
        ? input.shippingAddress
        : input.billingAddress!,
      shippingMethod: "bpost_express_24h",
    })
    .returning();
  if (!order) throw new Error("Order creation failed");

  await db.insert(orderItems).values(
    items.map((i) => ({
      orderId: order.id,
      productId: i.productId,
      productNameSnapshot: i.name,
      productSkuSnapshot: i.sku,
      unitPriceCentsSnapshot: i.unitPriceCents,
      quantity: i.quantity,
      lineTotalCents: i.unitPriceCents * i.quantity,
      metadata: buildOrderItemMetadata(i),
    })),
  );

  // Create the Stripe coupon JIT, then the Checkout Session; if either fails,
  // delete the coupon to prevent orphans in the Stripe account.
  let couponId: string | undefined;
  let reservedGiftCard = false;
  let stripeSession: { id: string; url: string | null };
  try {
    if (giftCardValidation) {
      // Atomically RESERVE the balance BEFORE issuing the Stripe coupon. Without
      // this, N concurrent checkouts each pass validation and each get a full
      // coupon for the same card (double-spend). An abandoned/failed checkout
      // re-credits below (and on checkout.session.expired).
      const ok = await reserveGiftCardBalance(
        giftCardValidation.cardId,
        giftCardValidation.deductionCents,
      );
      if (!ok) {
        throw new Error("Carte cadeau : solde insuffisant ou utilisée simultanément");
      }
      reservedGiftCard = true;

      const { stripe } = await import("@/lib/stripe/client");
      const coupon = await stripe.coupons.create({
        amount_off: giftCardValidation.deductionCents,
        currency: "eur",
        duration: "once",
        name: `Carte cadeau ${giftCardValidation.code}`,
      });
      couponId = coupon.id;
    }

    stripeSession = await createStripeCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      email: input.email,
      locale,
      lineItems: items.map((i) => ({
        name: lineItemName(i),
        unitPriceCents: i.unitPriceCents,
        quantity: i.quantity,
      })),
      shippingCents: totals.shippingCents,
      appBaseUrl: env.NEXT_PUBLIC_APP_URL,
      couponId,
    });

    // Persist the gift-card reservation link on the order INSIDE the try: if this
    // write fails the catch re-credits the reserved balance. Writing it after the
    // try would leak the reservation (no giftCardId metadata → never re-credited
    // nor redeemed).
    await db
      .update(orders)
      .set({
        stripeSessionId: stripeSession.id,
        metadata:
          giftCardValidation && couponId
            ? {
                giftCardId: giftCardValidation.cardId,
                giftCardDeductionCents: giftCardValidation.deductionCents,
                stripeCouponId: couponId,
              }
            : {},
      })
      .where(eq(orders.id, order.id));
  } catch (e) {
    if (couponId) {
      const { stripe } = await import("@/lib/stripe/client");
      await stripe.coupons.del(couponId).catch((delErr) =>
        console.error("[checkout] failed to delete orphan coupon", couponId, delErr),
      );
    }
    // Re-credit the reserved balance: this checkout never reached Stripe, so the
    // card must not stay debited.
    if (reservedGiftCard && giftCardValidation) {
      await refundGiftCardBalance(
        giftCardValidation.cardId,
        giftCardValidation.deductionCents,
      ).catch((rcErr) =>
        console.error("[checkout] failed to re-credit gift card reservation", rcErr),
      );
    }
    throw e;
  }

  redirect(stripeSession.url!);
}

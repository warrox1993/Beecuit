"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, orders, orderItems, shippingRates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { CheckoutSchema } from "@/lib/validators/checkout";
import { computeOrderTotals } from "@/lib/totals";
import { pickShippingRate, type ShippingRate } from "@/lib/shipping/bpost";
import { getCartContents } from "@/lib/queries/cart";
import { formatOrderNumber } from "@/lib/order-number";
import { createStripeCheckoutSession } from "@/lib/stripe/checkout";

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
    if (i.quantity > i.stockQuantity) {
      throw new Error(`Stock insuffisant pour ${i.name}`);
    }
  }

  const totalWeight = items.reduce((s, i) => s + i.weightGrams * i.quantity, 0);
  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const rate = await calculateShipping(totalWeight, subtotalCents);
  if (!rate) throw new Error("Poids excède la livraison disponible");

  const totals = computeOrderTotals({
    lines: items.map((i) => ({ unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
    shippingCents: rate.priceCents,
    vatPercentInclusive: 6,
  });

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
      productSkuSnapshot: i.productId,
      unitPriceCentsSnapshot: i.unitPriceCents,
      quantity: i.quantity,
      lineTotalCents: i.unitPriceCents * i.quantity,
    })),
  );

  const stripeSession = await createStripeCheckoutSession({
    orderId: order.id,
    orderNumber: order.orderNumber,
    email: input.email,
    locale,
    lineItems: items.map((i) => ({
      name: i.name,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
    })),
    shippingCents: totals.shippingCents,
    appBaseUrl: env.NEXT_PUBLIC_APP_URL,
  });

  await db.update(orders).set({ stripeSessionId: stripeSession.id }).where(eq(orders.id, order.id));

  redirect(stripeSession.url!);
}

import "server-only";
import { stripe } from "./client";
import { env } from "@/lib/env";

export type CheckoutLineItem = {
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export async function createStripeCheckoutSession(args: {
  orderId: string;
  orderNumber: string;
  email: string;
  locale: "fr" | "nl" | "de" | "en";
  lineItems: CheckoutLineItem[];
  shippingCents: number;
  appBaseUrl: string;
  couponId?: string;
}) {
  const productLineItems: Array<{
    price_data: {
      currency: string;
      product_data: { name: string };
      unit_amount: number;
      tax_behavior: "inclusive";
    };
    quantity: number;
    tax_rates: string[];
  }> = args.lineItems.map((li) => ({
    price_data: {
      currency: "eur",
      product_data: { name: li.name },
      unit_amount: li.unitPriceCents,
      tax_behavior: "inclusive",
    },
    quantity: li.quantity,
    tax_rates: [env.STRIPE_TAX_RATE_ID],
  }));

  if (args.shippingCents > 0) {
    productLineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Livraison bpost Express 24h" },
        unit_amount: args.shippingCents,
        tax_behavior: "inclusive",
      },
      quantity: 1,
      tax_rates: [env.STRIPE_TAX_RATE_ID],
    });
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "bancontact"],
    locale:
      args.locale === "en"
        ? "en"
        : args.locale === "nl"
          ? "nl"
          : args.locale === "de"
            ? "de"
            : "fr",
    customer_email: args.email,
    line_items: productLineItems,
    discounts: args.couponId ? [{ coupon: args.couponId }] : undefined,
    success_url: `${args.appBaseUrl}/${args.locale}/commande-confirmee/${args.orderNumber}`,
    cancel_url: `${args.appBaseUrl}/${args.locale}/checkout`,
    metadata: { order_id: args.orderId, order_number: args.orderNumber },
  });
}

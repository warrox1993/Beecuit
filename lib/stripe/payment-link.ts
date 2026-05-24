import "server-only";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";

interface CreateB2BPaymentLinkArgs {
  quoteId: string;
  shortId: string;
  amountCents: number;
  description: string;
  customerEmail: string;
}

export async function createB2BPaymentLink(args: CreateB2BPaymentLinkArgs): Promise<{
  productId: string;
  priceId: string;
  paymentLinkId: string;
  paymentLinkUrl: string;
}> {
  const product = await stripe.products.create({
    name: `Devis BeeCuit #${args.shortId}`,
    description: args.description.slice(0, 500),
    metadata: { b2b_quote_id: args.quoteId },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: args.amountCents,
    currency: "eur",
    tax_behavior: "inclusive",
  });

  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { b2b_quote_id: args.quoteId },
    after_completion: {
      type: "redirect",
      redirect: { url: `${baseUrl}/fr/devis/${args.quoteId}/confirme` },
    },
    customer_creation: "always",
    allow_promotion_codes: false,
  });

  return {
    productId: product.id,
    priceId: price.id,
    paymentLinkId: link.id,
    paymentLinkUrl: link.url,
  };
}

export async function deactivateB2BPaymentLink(paymentLinkId: string): Promise<void> {
  try {
    await stripe.paymentLinks.update(paymentLinkId, { active: false });
  } catch (e) {
    console.error("[b2b] deactivate payment link failed", paymentLinkId, e);
  }
}

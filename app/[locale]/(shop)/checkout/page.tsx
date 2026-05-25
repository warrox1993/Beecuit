import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getCartContents } from "@/lib/queries/cart";
import { calculateShipping } from "@/lib/actions/checkout.actions";
import { computeOrderTotals } from "@/lib/totals";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { CheckoutStepper } from "@/components/shop/CheckoutStepper";
import { CheckoutTrustBadges } from "@/components/shop/CheckoutTrustBadges";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const store = await cookies();
  const token = store.get("cart_session_token")?.value;
  const [cart] = session?.user?.id
    ? await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1)
    : token
      ? await db.select().from(carts).where(eq(carts.sessionToken, token)).limit(1)
      : [];
  if (!cart) redirect({ href: "/panier", locale });
  const items = await getCartContents(cart!.id, locale as "fr" | "nl" | "de" | "en");
  if (items.length === 0) redirect({ href: "/panier", locale });

  const weight = items.reduce((s, i) => s + i.weightGrams * i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const rate = await calculateShipping(weight, subtotal);
  const totals = computeOrderTotals({
    lines: items.map((i) => ({ unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
    shippingCents: rate?.priceCents ?? 0,
    vatPercentInclusive: 6,
  });

  return (
    <Section py="md">
      <Container>
        <Eyebrow>PAIEMENT</Eyebrow>
        <Heading as="h1" size="h1" className="mt-3 mb-6">
          Finalise ta commande
        </Heading>
        <CheckoutStepper activeStep={1} />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_360px]">
          <div>
            <CheckoutForm
              defaultEmail={session?.user?.email ?? ""}
              locale={locale as "fr" | "nl" | "de" | "en"}
            />
          </div>
          <aside className="md:sticky md:top-28 md:self-start">
            <OrderSummary
              lines={items.map((i) => ({
                name: i.name,
                unitPriceCents: i.unitPriceCents,
                quantity: i.quantity,
              }))}
              shippingCents={totals.shippingCents}
              totalCents={totals.totalCents}
              vatCents={totals.vatCents}
            />
            <CheckoutTrustBadges />
          </aside>
        </div>
      </Container>
    </Section>
  );
}

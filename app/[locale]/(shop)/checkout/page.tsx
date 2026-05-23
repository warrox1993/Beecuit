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
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-honey font-display mb-8 text-4xl">Checkout</h1>
        <CheckoutForm
          defaultEmail={session?.user?.email ?? ""}
          locale={locale as "fr" | "nl" | "de" | "en"}
        />
      </div>
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
    </section>
  );
}

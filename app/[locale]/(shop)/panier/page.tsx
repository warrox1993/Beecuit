import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCartContents } from "@/lib/queries/cart";
import type { Locale } from "@/lib/queries/catalog";
import { CartItemRow } from "@/components/shop/CartItemRow";

export const dynamic = "force-dynamic";

async function findCartId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) {
    const [c] = await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1);
    return c?.id ?? null;
  }
  const store = await cookies();
  const token = store.get("cart_session_token")?.value;
  if (!token) return null;
  const [c] = await db.select().from(carts).where(eq(carts.sessionToken, token)).limit(1);
  return c?.id ?? null;
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  const cartId = await findCartId();
  const items = cartId ? await getCartContents(cartId, locale as Locale) : [];

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-honey font-display mb-4 text-4xl">{t("label")}</h1>
        <p className="text-warm-brown/70 mb-8">{t("empty")}</p>
        <Link href="/biscuits">
          <Button className="bg-honey text-cream hover:bg-honey-dark">Découvrir nos biscuits</Button>
        </Link>
      </section>
    );
  }

  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const subtotalEur = (subtotalCents / 100).toFixed(2);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-honey font-display mb-8 text-4xl">{t("label")}</h1>
      <div className="divide-warm-brown/10 divide-y">
        {items.map((i) => (
          <CartItemRow
            key={i.cartItemId}
            cartItemId={i.cartItemId}
            name={i.name}
            unitPriceCents={i.unitPriceCents}
            quantity={i.quantity}
            stockQuantity={i.stockQuantity}
            primaryImageUrl={i.primaryImageUrl}
          />
        ))}
      </div>
      <div className="border-warm-brown/10 mt-6 flex items-center justify-between border-t pt-6">
        <span className="text-warm-brown text-lg">{t("subtotal")}</span>
        <span className="text-honey-dark font-mono text-2xl">{subtotalEur} €</span>
      </div>
      <p className="text-warm-brown/60 mt-2 text-right text-xs">Livraison et TVA calculées au checkout</p>
      <div className="mt-8 flex justify-between gap-4">
        <Link href="/biscuits" className="text-warm-brown text-sm underline">
          Continuer mes achats
        </Link>
        <Link href="/checkout">
          <Button className="bg-honey text-cream hover:bg-honey-dark">{t("checkout")}</Button>
        </Link>
      </div>
    </section>
  );
}

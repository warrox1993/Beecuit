import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  const eur = (c: number) => (c / 100).toFixed(2);
  const isPending = order.status === "pending";

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-honey font-display mb-3 text-4xl">
        {isPending ? "Traitement en cours…" : "Merci !"}
      </h1>
      <p className="text-warm-brown text-lg">
        {isPending
          ? `Ta commande ${orderNumber} est en cours de validation. Tu recevras un email de confirmation dans quelques instants.`
          : `Ta commande #${orderNumber} est confirmée.`}
      </p>
      <div className="border-warm-brown/10 mt-8 rounded-lg border bg-white p-6 text-left">
        <ul className="divide-warm-brown/10 divide-y">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between py-2 text-sm">
              <span>{i.productNameSnapshot} × {i.quantity}</span>
              <span className="font-mono">{eur(i.lineTotalCents)} €</span>
            </li>
          ))}
        </ul>
        <div className="border-warm-brown/10 mt-3 flex justify-between border-t pt-3 text-base font-medium">
          <span>Total</span>
          <span className="font-mono">{eur(order.totalCents)} €</span>
        </div>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/biscuits">
          <Button className="bg-honey text-cream hover:bg-honey-dark">Continuer mes achats</Button>
        </Link>
        <Link href="/compte/commandes">
          <Button variant="outline">Voir mes commandes</Button>
        </Link>
      </div>
    </section>
  );
}

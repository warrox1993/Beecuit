import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Check } from "lucide-react";

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
    <Section py="lg">
      <Container variant="narrow" className="text-center">
        <div className="bg-honey/10 mx-auto flex h-24 w-24 items-center justify-center rounded-full">
          <Check className="text-honey-dark h-12 w-12" />
        </div>
        <Heading as="h1" size="h1" className="mt-8">
          {isPending ? "Traitement en cours…" : "Merci !"}
        </Heading>
        <Prose className="mx-auto mt-4">
          {isPending
            ? `Ta commande ${orderNumber} est en cours de validation. Tu recevras un email de confirmation dans quelques instants.`
            : `Ta commande #${orderNumber} est confirmée. On t'envoie l'email de confirmation à l'instant.`}
        </Prose>
        <div className="border-warm-brown/10 mt-10 rounded-2xl border bg-white p-6 text-left">
          <ul className="divide-warm-brown/10 divide-y">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between py-3 text-sm">
                <span className="text-warm-brown">{i.productNameSnapshot} × {i.quantity}</span>
                <span className="text-warm-brown font-mono">{eur(i.lineTotalCents)} €</span>
              </li>
            ))}
          </ul>
          <div className="border-warm-brown/10 mt-3 flex justify-between border-t pt-3 text-base">
            <span className="text-warm-brown font-display">Total</span>
            <span className="text-honey-dark font-display text-xl">{eur(order.totalCents)} €</span>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/biscuits"><Button className="bg-honey text-cream hover:bg-honey-dark px-6 py-6 text-base">Continuer mes achats</Button></Link>
          <Link href="/compte/commandes"><Button variant="outline" className="px-6 py-6 text-base">Voir mes commandes</Button></Link>
        </div>
      </Container>
    </Section>
  );
}

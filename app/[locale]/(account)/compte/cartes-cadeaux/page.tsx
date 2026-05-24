import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  listPurchasedByUser,
  listReceivedByEmail,
} from "@/lib/queries/gift-cards";
import { GiftCardReveal } from "@/components/shop/GiftCardReveal";
import { Container } from "@/components/ui-primitives/Container";

export const dynamic = "force-dynamic";

export default async function CompteCartesCadeauxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect(`/${locale}/sign-in`);
  }

  const [purchased, received] = await Promise.all([
    listPurchasedByUser(session.user.id),
    listReceivedByEmail(session.user.email),
  ]);

  const fmt = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;
  const dt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("fr-BE") : "—";

  return (
    <Container className="py-12 space-y-12">
      <header>
        <h1 className="text-3xl font-display text-warm-brown">
          Mes cartes cadeaux
        </h1>
      </header>

      <section>
        <h2 className="text-xl font-display text-warm-brown mb-4">
          Cartes que j&apos;ai reçues
        </h2>
        {received.length === 0 ? (
          <p className="text-warm-brown/60 text-sm">
            Aucune carte reçue pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {received.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-cookie/30 rounded-xl p-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm text-warm-brown/60">
                      De {c.purchaserEmail}
                    </p>
                    <p className="font-display text-warm-brown text-lg">
                      {fmt(c.remainingAmountCents)} restants
                    </p>
                    <p className="text-xs text-warm-brown/60">
                      sur {fmt(c.initialAmountCents)} · expire le{" "}
                      {dt(c.expiresAt)}
                    </p>
                  </div>
                  <GiftCardReveal code={c.code} />
                </div>
                {c.message && (
                  <p className="mt-3 text-sm italic text-warm-brown/80">
                    « {c.message} »
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-display text-warm-brown mb-4">
          Cartes que j&apos;ai offertes
        </h2>
        {purchased.length === 0 ? (
          <p className="text-warm-brown/60 text-sm">Aucune carte achetée.</p>
        ) : (
          <div className="space-y-2">
            {purchased.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-white border border-cookie/30 rounded-xl p-4 flex-wrap gap-2"
              >
                <div>
                  <p className="text-sm text-warm-brown">
                    Pour {c.recipientEmail}
                  </p>
                  <p className="text-xs text-warm-brown/60">
                    {fmt(c.initialAmountCents)} · envoi prévu{" "}
                    {dt(c.deliveryAt)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    c.deliveredAt
                      ? "bg-honey/20 text-honey-dark"
                      : "bg-cookie/40 text-warm-brown"
                  }`}
                >
                  {c.deliveredAt
                    ? `Envoyée ${dt(c.deliveredAt)}`
                    : "En attente d'envoi"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}

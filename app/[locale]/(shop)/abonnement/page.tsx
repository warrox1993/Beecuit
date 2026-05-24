import { setRequestLocale } from "next-intl/server";
import { SubscriptionPricingTable } from "@/components/shop/SubscriptionPricingTable";
import { Container } from "@/components/ui-primitives/Container";

export default async function AbonnementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-12">
      <header className="mb-10 text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-warm-brown/60 mb-2">
          Abonnement mensuel
        </p>
        <h1 className="text-4xl md:text-5xl font-display text-warm-brown">
          Ta box BeeCuit chaque mois
        </h1>
        <p className="mt-3 text-warm-brown/70">
          Choisis ta formule, compose ta box chaque mois, on livre.
          Tous les abonnés reçoivent leur box le 1er du mois.
        </p>
      </header>
      <SubscriptionPricingTable locale={locale} />
    </Container>
  );
}

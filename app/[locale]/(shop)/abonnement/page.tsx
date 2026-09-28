import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SubscriptionPricingTable } from "@/components/shop/SubscriptionPricingTable";
import { Container } from "@/components/ui-primitives/Container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.abonnement" });
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/abonnement",
    locale,
  });
}

export default async function AbonnementPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-12">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-warm-brown/60 mb-2 text-xs tracking-widest uppercase">
          Abonnement mensuel
        </p>
        <h1 className="font-display text-warm-brown text-4xl md:text-5xl">
          Ta box Au Fil des Saveurs chaque mois
        </h1>
        <p className="text-warm-brown/70 mt-3">
          Choisis ta formule, compose ta box chaque mois, on livre. Tous les abonnés reçoivent leur
          box le 1er du mois.
        </p>
      </header>
      <SubscriptionPricingTable locale={locale} />
    </Container>
  );
}

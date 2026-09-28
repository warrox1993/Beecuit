import type { Metadata } from "next";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { GiftCardForm } from "@/components/shop/GiftCardForm";
import { Container } from "@/components/ui-primitives/Container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.cartesCadeaux" });
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/cartes-cadeaux",
    locale,
  });
}

export default async function CartesCadeauxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-12">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-warm-brown/60 mb-2 text-xs tracking-widest uppercase">Cartes cadeaux</p>
        <h1 className="font-display text-warm-brown text-4xl md:text-5xl">
          Offre Au Fil des Saveurs
        </h1>
        <p className="text-warm-brown/70 mt-3">
          Une carte cadeau numérique pour faire goûter nos biscuits liégeois. Envoyée par email à la
          date que tu choisis. Valable 12 mois.
        </p>
      </header>
      <div className="relative mx-auto mb-10 aspect-[16/7] max-w-3xl overflow-hidden rounded-2xl shadow-lg">
        <Image
          src="https://images.unsplash.com/photo-1589948516895-db76617cb753?fm=jpg&q=75&w=1600&auto=format&fit=crop"
          alt="Enveloppe cadeau et biscuits artisanaux"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="bg-cream/40 mx-auto max-w-xl rounded-2xl p-6 md:p-8">
        <GiftCardForm />
      </div>
    </Container>
  );
}

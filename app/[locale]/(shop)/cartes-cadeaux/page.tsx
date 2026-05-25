import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { GiftCardForm } from "@/components/shop/GiftCardForm";
import { Container } from "@/components/ui-primitives/Container";

export default async function CartesCadeauxPage({
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
          Cartes cadeaux
        </p>
        <h1 className="text-4xl md:text-5xl font-display text-warm-brown">
          Offre Au Fil des Saveurs
        </h1>
        <p className="mt-3 text-warm-brown/70">
          Une carte cadeau numérique pour faire goûter nos biscuits liégeois.
          Envoyée par email à la date que tu choisis. Valable 12 mois.
        </p>
      </header>
      <div className="relative aspect-[16/7] max-w-3xl mx-auto mb-10 rounded-2xl overflow-hidden shadow-lg">
        <Image
          src="https://images.unsplash.com/photo-1589948516895-db76617cb753?fm=jpg&q=75&w=1600&auto=format&fit=crop"
          alt="Enveloppe cadeau et biscuits artisanaux"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="max-w-xl mx-auto bg-cream/40 rounded-2xl p-6 md:p-8">
        <GiftCardForm />
      </div>
    </Container>
  );
}

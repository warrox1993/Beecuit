import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { listCoffretsForLocale, type Locale } from "@/lib/queries/catalog";
import { CoffretCard } from "@/components/shop/CoffretCard";
import { CoffretGridSkeleton } from "@/components/shop/CoffretCardSkeleton";
import { Container } from "@/components/ui-primitives/Container";

export default async function CoffretsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-12">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-warm-brown/60 mb-2">
          Nos coffrets
        </p>
        <h1 className="text-4xl md:text-5xl font-display text-warm-brown">
          Coffrets cadeaux
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-warm-brown/70">
          Des sélections de biscuits artisanaux à offrir, assemblées à la
          commande dans nos ateliers de Liège.
        </p>
      </header>

      {/* Suspense interne (et non loading.tsx de segment) pour ne pas couvrir
          /coffrets/[slug] — sinon un statut 200 serait flushé avant notFound(). */}
      <Suspense fallback={<CoffretGridSkeleton count={3} />}>
        <CoffretsGrid locale={locale} />
      </Suspense>
    </Container>
  );
}

async function CoffretsGrid({ locale }: { locale: string }) {
  const coffrets = await listCoffretsForLocale(locale as Locale);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {coffrets.map((c) => (
        <CoffretCard key={c.id} locale={locale} coffret={c} />
      ))}
    </div>
  );
}

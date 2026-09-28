import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { listCoffretsForLocale, type Locale } from "@/lib/queries/catalog";
import { CoffretCard } from "@/components/shop/CoffretCard";
import { CoffretGridSkeleton } from "@/components/shop/CoffretCardSkeleton";
import { Container } from "@/components/ui-primitives/Container";
import { EmptyState } from "@/components/common/EmptyState";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.coffrets" });
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/coffrets",
    locale,
  });
}

export default async function CoffretsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-12">
      <header className="mb-10 text-center">
        <p className="text-warm-brown/60 mb-2 text-xs tracking-widest uppercase">Nos coffrets</p>
        <h1 className="font-display text-warm-brown text-4xl md:text-5xl">Coffrets cadeaux</h1>
        <p className="text-warm-brown/70 mx-auto mt-3 max-w-2xl">
          Des sélections de biscuits artisanaux à offrir, assemblées à la commande dans nos ateliers
          de Liège.
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

  if (coffrets.length === 0) {
    return (
      <EmptyState
        title="Aucun coffret disponible"
        description="Nos coffrets reviennent bientôt — en attendant, découvrez nos biscuits à l'unité."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {coffrets.map((c) => (
        <CoffretCard key={c.id} locale={locale} coffret={c} />
      ))}
    </div>
  );
}

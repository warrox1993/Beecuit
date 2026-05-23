import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { listFeaturedProducts, type Locale } from "@/lib/queries/catalog";

export async function FeaturedProducts({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  const products = await listFeaturedProducts(locale as Locale, 3);
  return (
    <Section py="lg">
      <Container>
        <div className="text-center">
          <Eyebrow>{t("featuredEyebrow")}</Eyebrow>
          <Heading as="h2" size="h2" className="mt-3">
            {t("featuredTitle")}
          </Heading>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/biscuits/${p.slug}`} className="group block">
              <div className="bg-cookie/30 aspect-[4/5] overflow-hidden rounded-xl">
                {p.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.primaryImageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-7xl opacity-30">🍪</div>
                )}
              </div>
              <div className="mt-4 space-y-1">
                {p.categoryName && <Eyebrow>{p.categoryName}</Eyebrow>}
                <p className="text-warm-brown font-display text-xl">{p.name}</p>
                <p className="text-honey-dark font-display text-lg">{(p.basePriceCents / 100).toFixed(2)} €</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/biscuits" className="text-warm-brown hover:text-honey-dark text-sm font-medium underline underline-offset-4">
            {t("featuredCta")} →
          </Link>
        </div>
      </Container>
    </Section>
  );
}

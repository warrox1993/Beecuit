import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Button } from "@/components/ui/button";
import { DotFlourish, RopeDivider, CornerScallop } from "@/components/brand/Ornaments";
import { Reveal } from "@/components/motion/Reveal";

const SECTIONS = [
  {
    key: "section1",
    image:
      "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    alt: "Mains qui pétrissent la pâte",
    side: "left" as const,
  },
  {
    key: "section2",
    image:
      "https://images.unsplash.com/photo-1483546363825-7ebf25fb7513?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    alt: "Ingrédients étalés sur un plan de travail",
    side: "right" as const,
  },
  {
    key: "section3",
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    alt: "Coffret cadeau emballé à la main",
    side: "left" as const,
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.histoire" });
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/notre-histoire",
    locale,
  });
}

export default async function NotreHistoirePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("histoire");

  return (
    <>
      {/* — Hero — */}
      <Section py="lg">
        <Container variant="narrow" className="text-center">
          <RopeDivider variant="straight" className="text-honey-dark/70 mx-auto mb-5 w-16" />
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <p
            aria-hidden
            className="text-honey-dark font-script mt-4 -mb-3 text-[clamp(3rem,7vw,5rem)] leading-[0.9]"
          >
            {t("scriptAccent")}
          </p>
          <Heading as="h1" size="display">
            {t("title")}
          </Heading>
          <DotFlourish className="text-honey-dark/55 mx-auto mt-6 h-2 w-16" />
          <Prose className="mx-auto mt-6 max-w-2xl">{t("lead")}</Prose>
        </Container>
      </Section>

      {/* — Alternating sections — */}
      {SECTIONS.map(({ key, image, alt, side }, idx) => (
        <Reveal key={key} delay={0.05 * idx}>
          <Section py="md" bg={idx % 2 === 0 ? "elevated" : "default"}>
            <Container>
              <div
                className={`grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 ${
                  side === "right" ? "md:[direction:rtl]" : ""
                }`}
              >
                <div className="relative md:[direction:ltr]">
                  <div className="bg-cookie/40 relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-[0_24px_50px_-30px_rgba(44,24,16,0.45)]">
                    <Image
                      src={image}
                      alt={alt}
                      fill
                      sizes="(min-width: 768px) 45vw, 100vw"
                      className="object-cover"
                    />
                    <CornerScallop
                      corner={side === "left" ? "tr" : "tl"}
                      className="text-cream-gold absolute top-3 h-7 w-7"
                      // tailwind ne peut pas conditionnellement set left/right via prop, handle inline
                    />
                  </div>
                </div>
                <div className="space-y-5 md:[direction:ltr]">
                  <Heading as="h2" size="h2">
                    {t(`${key}Title` as "section1Title")}
                  </Heading>
                  <Prose>{t(`${key}Body` as "section1Body")}</Prose>
                  <figure className="mt-4 max-w-[40ch]">
                    <RopeDivider
                      variant="straight"
                      className="text-honey-dark/50 w-14"
                    />
                    <blockquote className="text-warm-brown/90 font-display mt-3 text-[1.25rem] leading-snug italic md:text-[1.4rem]">
                      « {t(`${key}Quote` as "section1Quote")} »
                    </blockquote>
                  </figure>
                </div>
              </div>
            </Container>
          </Section>
        </Reveal>
      ))}

      {/* — Signature + CTA — */}
      <Section py="lg" bg="elevated">
        <Container variant="narrow" className="text-center">
          <DotFlourish className="text-honey-dark/55 mx-auto mb-6 h-2 w-16" />
          <p className="text-honey-dark font-script text-4xl leading-snug">{t("signature")}</p>
          <RopeDivider variant="wave" className="text-honey-dark/45 mx-auto mt-10 max-w-md" />
          <div className="mt-10">
            <Heading as="h2" size="h3">
              {t("ctaTitle")}
            </Heading>
            <p className="text-warm-brown/75 mt-2">{t("ctaSubtitle")}</p>
            <Link href="/biscuits" className="mt-6 inline-block">
              <Button className="bg-cta-primary text-cream hover:bg-cta-primary-hover h-auto rounded-full px-7 py-4 text-base">
                Découvrir nos biscuits →
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}

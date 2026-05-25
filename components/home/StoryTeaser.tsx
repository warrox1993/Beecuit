import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { DotFlourish, RopeDivider } from "@/components/brand/Ornaments";

/**
 * StoryTeaser — Au Fil des Saveurs (Phase 4B magazine editorial).
 *
 * Asymmetric: image left in a tall portrait card, text right aligned bottom,
 * with a pull-quote separator (Fraunces italic) and a Pinyon Script signature.
 */
export async function StoryTeaser() {
  const t = await getTranslations("home");
  return (
    <Section py="lg" bg="elevated">
      <Container>
        <div className="grid grid-cols-1 items-end gap-12 md:grid-cols-[5fr_6fr] md:gap-16">
          {/* — Image column — */}
          <div className="relative">
            <div className="bg-cookie/40 relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-[0_20px_50px_-30px_rgba(44,24,16,0.4)]">
              <Image
                src="https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?fm=jpg&q=75&w=1200&auto=format&fit=crop"
                alt="Mains d'artisan boulanger pétrissant la pâte"
                fill
                sizes="(min-width: 768px) 42vw, 100vw"
                className="object-cover"
              />
              <div className="from-brand-chocolate/15 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
            </div>
            {/* Vertical accent line in honey-dark on left edge */}
            <div className="bg-honey-dark/40 absolute top-12 -left-2 hidden h-24 w-px md:block" />
          </div>

          {/* — Text column — */}
          <div className="space-y-7">
            <div className="flex items-center gap-3">
              <Eyebrow>{t("storyEyebrow")}</Eyebrow>
              <DotFlourish className="text-honey-dark/60 h-2 w-12" />
            </div>

            <Heading as="h2" size="h2" className="leading-[1.15]">
              {t("storyTitle")}
            </Heading>

            <Prose className="max-w-[52ch]">{t("storyProse")}</Prose>

            {/* Pull-quote */}
            <figure className="my-8 max-w-[44ch]">
              <RopeDivider variant="straight" className="text-honey-dark/50 w-16" />
              <blockquote className="text-warm-brown/90 font-display mt-4 text-[1.35rem] leading-snug italic md:text-[1.5rem]">
                « {t("storyPullQuote")} »
              </blockquote>
              <figcaption className="text-honey-dark font-script mt-2 text-2xl">
                {t("storyPullQuoteSignature")}
              </figcaption>
            </figure>

            <Link
              href="/notre-histoire"
              className="text-warm-brown hover:text-honey-dark group inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-colors"
            >
              <span className="border-warm-brown/40 group-hover:border-honey-dark border-b pb-0.5 transition-colors">
                {t("storyCta")}
              </span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

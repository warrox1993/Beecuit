import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Prose } from "@/components/ui-primitives/Prose";
import { Button } from "@/components/ui/button";
import { CornerScallop, RopeDivider } from "@/components/brand/Ornaments";

/**
 * Hero — Au Fil des Saveurs (Phase 4B editorial asymmetric).
 *
 * Layout: 7/5 split (text dominant) with Pinyon Script "Saveurs" as a poetic
 * accent above the main title. Image is framed with a gold inner ring and a
 * top-right scallop ornament — feels like a presentation card on the page.
 */
export async function Hero({ locale: _locale }: { locale: string }) {
  const t = await getTranslations("home");
  return (
    <section className="bg-surface relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[7fr_5fr] md:gap-16">
          {/* — Text column — */}
          <div className="relative">
            {/* Mini rope flourish above the eyebrow */}
            <RopeDivider
              variant="straight"
              className="text-honey-dark/70 mb-4 w-12"
            />
            <p className="text-text-accent text-[0.7rem] font-semibold tracking-[0.22em] uppercase">
              {t("heroSubEyebrow")}
            </p>

            {/* Pinyon Script accent — single-word rule */}
            <p
              aria-hidden
              className="text-honey-dark font-script mt-6 -mb-2 text-[clamp(3.5rem,9vw,6.5rem)] leading-[0.9] md:-mb-4"
              style={{ marginLeft: "-0.04em" }}
            >
              {t("heroScriptAccent")}
            </p>

            <h1 className="font-display text-text-primary text-[clamp(2.5rem,5.8vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.02em]">
              {t("heroTitle")}
              <br />
              <span className="text-warm-brown/85">{t("heroTitleAccent")}</span>
            </h1>

            <div className="mt-7 max-w-[44ch]">
              <Prose>{t("heroProse")}</Prose>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/biscuits">
                <Button className="bg-cta-primary text-cream hover:bg-cta-primary-hover h-auto rounded-full px-7 py-4 text-[0.95rem] font-medium tracking-wide shadow-[0_8px_24px_-12px_rgba(44,24,16,0.35)] transition-all">
                  {t("heroCtaPrimary")}
                  <span aria-hidden className="ml-1 inline-block">
                    →
                  </span>
                </Button>
              </Link>
              <Link href="/notre-histoire">
                <Button
                  variant="outline"
                  className="border-warm-brown/25 text-warm-brown hover:bg-warm-brown/5 h-auto rounded-full px-7 py-4 text-[0.95rem] font-medium tracking-wide"
                >
                  {t("heroCtaSecondary")}
                </Button>
              </Link>
            </div>
          </div>

          {/* — Image column — */}
          <div className="relative">
            {/* Outer gold offset frame */}
            <div className="border-cream-gold/45 pointer-events-none absolute top-2 right-2 bottom-[-12px] left-[-12px] rounded-[1.25rem] border md:bottom-[-16px] md:left-[-16px]" />
            <div className="bg-cookie/40 relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-[0_30px_60px_-30px_rgba(44,24,16,0.45)]">
              <Image
                src="https://images.unsplash.com/photo-1522237825450-a0c44eecddb4?fm=jpg&q=75&w=1200&auto=format&fit=crop"
                alt="Biscuits artisanaux belges sortant du four"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
              {/* Subtle warm-tint scrim for cohesion */}
              <div className="from-brand-chocolate/25 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
              {/* Top-right scallop corner ornament */}
              <CornerScallop
                corner="tr"
                className="text-cream-gold absolute top-3 right-3 h-7 w-7 md:h-9 md:w-9"
              />
            </div>
            {/* Floating signature script on bottom-left of image */}
            <p
              aria-hidden
              className="text-cream-gold font-script absolute -bottom-5 left-3 text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] md:left-5 md:text-3xl"
            >
              Maison
            </p>
          </div>
        </div>
      </Container>

      {/* Decorative bottom-right diagonal flourish, very subtle */}
      <div
        aria-hidden
        className="text-cream-gold/15 pointer-events-none absolute -right-12 -bottom-16 hidden h-56 w-56 rotate-12 md:block"
      >
        <RopeDivider variant="wave" className="h-3 w-56" />
      </div>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Button } from "@/components/ui/button";
import { RopeDivider } from "@/components/brand/Ornaments";

/**
 * CoffretsTeaser — Au Fil des Saveurs (Phase 4B horizontal premium).
 *
 * Left: title + script accent + CTA. Right: 4 mini "gift-box" cards with a
 * gold ribbon ornament. Hover reveals the composition teaser. Snap-scroll on
 * mobile. Static placeholder data — DB wire-up scheduled in Phase 4C item 10.
 */
export async function CoffretsTeaser() {
  const t = await getTranslations("home");
  const coffrets = [1, 2, 3, 4].map((i) => ({
    name: t(`coffretsList.name${i}` as "coffretsList.name1"),
    teaser: t(`coffretsList.teaser${i}` as "coffretsList.teaser1"),
  }));
  return (
    <Section py="lg">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[3fr_8fr] md:items-center md:gap-14">
          {/* — Left: editorial title block — */}
          <div className="space-y-5">
            <Eyebrow>{t("coffretsListEyebrow")}</Eyebrow>
            <Heading as="h2" size="h2" className="leading-[1.1]">
              {t("coffretsTitle")}{" "}
              <span className="text-honey-dark font-script ml-1 text-[1.4em] leading-none">
                {t("coffretsListScriptAccent")}
              </span>
            </Heading>
            <p className="text-warm-brown/75 max-w-[28ch] text-[0.95rem] leading-relaxed">
              {t("coffretsListSubtitle")}
            </p>
            <Link href="/coffrets" className="inline-block pt-2">
              <Button
                variant="outline"
                className="border-warm-brown/30 text-warm-brown hover:border-honey-dark hover:text-honey-dark hover:bg-warm-brown/0 h-auto rounded-full px-6 py-3 text-sm font-medium tracking-wide"
              >
                {t("coffretsListCta")} →
              </Button>
            </Link>
          </div>

          {/* — Right: 4 mini gift-box cards, horizontal scroll on mobile — */}
          <div
            className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0"
            role="list"
          >
            {coffrets.map((c, i) => (
              <article
                key={i}
                role="listitem"
                className="group bg-cream-light border-warm-brown/8 hover:border-honey-dark/30 relative flex w-[68%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border shadow-[0_8px_24px_-16px_rgba(44,24,16,0.25)] transition-all duration-300 hover:shadow-[0_16px_40px_-20px_rgba(44,24,16,0.35)] md:w-auto"
              >
                {/* Visual placeholder: gift-box stylized */}
                <div className="bg-cookie/25 relative aspect-[3/4] w-full overflow-hidden">
                  <div className="from-cookie/40 to-honey/20 absolute inset-0 bg-gradient-to-br" />
                  {/* Gift-box body */}
                  <div className="border-cream-gold/40 absolute top-1/4 right-[18%] bottom-1/4 left-[18%] rounded-md border-2 bg-gradient-to-b from-[#4a332a]/85 to-[#2c1810]/95 shadow-inner" />
                  {/* Gold horizontal ribbon */}
                  <div className="bg-cream-gold absolute top-1/2 right-[10%] left-[10%] h-1.5 -translate-y-1/2 rounded-sm shadow-[0_2px_4px_rgba(0,0,0,0.25)]" />
                  {/* Vertical ribbon */}
                  <div className="bg-cream-gold absolute top-[18%] bottom-[18%] left-1/2 w-1.5 -translate-x-1/2 rounded-sm shadow-[0_0_4px_rgba(0,0,0,0.18)]" />
                  {/* Bow circle */}
                  <div className="bg-cream-gold border-honey-dark/40 absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border" />
                </div>
                {/* Card body */}
                <div className="flex-1 p-4 md:p-5">
                  <h3 className="text-warm-brown font-display text-[1.05rem] leading-snug">
                    {c.name}
                  </h3>
                  <p
                    className="text-warm-brown/70 mt-2 max-h-0 overflow-hidden text-[0.8rem] leading-snug opacity-0 transition-all duration-400 ease-out group-hover:max-h-20 group-hover:opacity-100 motion-reduce:max-h-20 motion-reduce:opacity-100"
                  >
                    {c.teaser}
                  </p>
                </div>
                {/* Bottom rope */}
                <RopeDivider
                  variant="scallop"
                  className="text-cream-gold/50 -mt-1 px-4 pb-3"
                />
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

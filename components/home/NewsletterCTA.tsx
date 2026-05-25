import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { NewsletterFormRefined } from "@/components/common/NewsletterFormRefined";
import { DotFlourish, RopeDivider } from "@/components/brand/Ornaments";

/**
 * NewsletterCTA — Au Fil des Saveurs (Phase 4B oval ornamental pillule).
 *
 * A wide rounded "pillule" container on cream-light surface, surrounded by
 * rope-wave dividers (top + bottom) and a centered dot flourish. The form
 * uses the refined underline variant.
 */
export async function NewsletterCTA() {
  const t = await getTranslations("home");
  return (
    <Section py="lg">
      <Container variant="narrow">
        <div className="bg-surface-elevated border-warm-brown/8 relative mx-auto max-w-3xl rounded-[2.75rem] border px-8 py-14 text-center shadow-[0_30px_60px_-40px_rgba(44,24,16,0.3)] md:px-16 md:py-20">
          {/* Top rope flourish */}
          <RopeDivider
            variant="wave"
            className="text-honey-dark/55 absolute top-6 right-12 left-12 md:right-20 md:left-20"
          />

          {/* Top centered dot flourish */}
          <DotFlourish className="text-honey-dark/70 mx-auto mb-5 h-2 w-16" />

          <h2 className="font-display text-text-primary text-[clamp(1.6rem,3.5vw,2.4rem)] leading-[1.2]">
            {t("newsletterIntro")}{" "}
            <span className="text-honey-dark font-script text-[1.55em] leading-[0.9]">
              {t("newsletterScriptAccent")}
            </span>
          </h2>

          <p className="text-warm-brown/75 mt-4 text-[1.05rem]">
            <span className="text-text-accent font-semibold">{t("newsletterAccent")}</span>{" "}
            {t("newsletterTaglineSuffix")}
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <NewsletterFormRefined />
          </div>

          <p className="text-warm-brown/70 mt-5 text-xs">{t("newsletterDisclaimer")}</p>

          {/* Bottom rope flourish */}
          <RopeDivider
            variant="wave"
            className="text-honey-dark/55 absolute right-12 bottom-6 left-12 md:right-20 md:left-20"
          />
        </div>
      </Container>
    </Section>
  );
}

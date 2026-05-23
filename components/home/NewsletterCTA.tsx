import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Heading } from "@/components/ui-primitives/Heading";
import { NewsletterForm } from "@/components/common/NewsletterForm";

export async function NewsletterCTA() {
  const t = await getTranslations("home");
  return (
    <Section py="lg" bg="cookie">
      <Container variant="narrow" className="text-center">
        <Heading as="h2" size="h2">
          {t("newsletterTitle")} <em className="text-honey-dark not-italic font-display">{t("newsletterAccent")}</em> {t("newsletterTaglineSuffix")}
        </Heading>
        <div className="mx-auto mt-8 max-w-md">
          <NewsletterForm />
        </div>
        <p className="text-warm-brown/60 mt-4 text-xs">{t("newsletterDisclaimer")}</p>
      </Container>
    </Section>
  );
}

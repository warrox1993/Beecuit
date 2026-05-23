import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Button } from "@/components/ui/button";

export async function ComingSoonPage({ pageKey }: { pageKey: string }) {
  const t = await getTranslations("comingSoon");
  return (
    <Section py="lg">
      <Container variant="narrow" className="text-center">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h1" size="h1" className="mt-3">
          {t(`pages.${pageKey}.title`)}
        </Heading>
        <Prose className="mx-auto mt-6">
          {t(`pages.${pageKey}.description`)}
        </Prose>
        <p className="text-honey-dark mt-8 text-sm font-medium">
          {t("when")} {t(`pages.${pageKey}.when`)}
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button variant="outline" className="border-warm-brown/20 text-warm-brown hover:bg-warm-brown/5">
            ← {t("backHome")}
          </Button>
        </Link>
      </Container>
    </Section>
  );
}

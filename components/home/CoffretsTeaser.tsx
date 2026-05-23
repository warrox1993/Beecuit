import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Button } from "@/components/ui/button";

export async function CoffretsTeaser() {
  const t = await getTranslations("home");
  return (
    <Section py="lg">
      <Container variant="narrow" className="text-center">
        <Eyebrow>{t("coffretsEyebrow")}</Eyebrow>
        <Heading as="h2" size="h2" className="mt-3">{t("coffretsTitle")}</Heading>
        <Prose className="mx-auto mt-4">{t("coffretsProse")}</Prose>
        <Button
          disabled
          className="bg-warm-brown/10 text-warm-brown/50 mt-8 cursor-not-allowed px-6 py-6 text-base"
        >
          {t("coffretsCta")}
        </Button>
        <div className="mt-12 flex justify-center">
          <div className="relative h-32 w-40 [transform:rotateX(15deg)_rotateY(-25deg)] [transform-style:preserve-3d]">
            <div className="bg-cookie border-warm-brown/20 absolute inset-0 rounded border shadow-lg" />
            <div className="bg-honey/80 absolute -top-2 inset-x-0 h-4 origin-bottom rounded-t [transform:rotateX(60deg)]" />
          </div>
        </div>
      </Container>
    </Section>
  );
}

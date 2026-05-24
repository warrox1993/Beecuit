import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";

export async function StoryTeaser() {
  const t = await getTranslations("home");
  return (
    <Section py="lg" bg="surface-elev">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="relative bg-cookie/40 aspect-square w-full overflow-hidden rounded-2xl">
            <Image
              src="https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?fm=jpg&q=75&w=1200&auto=format&fit=crop"
              alt="Mains d'artisan boulanger pétrissant la pâte"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="space-y-6">
            <Eyebrow>{t("storyEyebrow")}</Eyebrow>
            <Heading as="h2" size="h2">
              {t("storyTitle")}
            </Heading>
            <Prose>{t("storyProse")}</Prose>
            <Link
              href="/notre-histoire"
              className="text-warm-brown hover:text-honey-dark inline-block text-sm font-medium underline underline-offset-4"
            >
              {t("storyCta")} →
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

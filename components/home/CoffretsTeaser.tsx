import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1449049607083-e29383d58423?fm=jpg&q=75&w=1200&auto=format&fit=crop"
              alt="Coffret cadeau de biscuits artisanaux BeeCuit"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="space-y-6">
            <Eyebrow>{t("coffretsEyebrow")}</Eyebrow>
            <Heading as="h2" size="h2">
              {t("coffretsTitle")}
            </Heading>
            <Prose>{t("coffretsProse")}</Prose>
            <Link href="/coffrets">
              <Button className="bg-honey text-cream hover:bg-honey-dark mt-2 px-6 py-6 text-base">
                {t("coffretsCta")} →
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

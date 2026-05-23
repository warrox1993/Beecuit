import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";

const TINTS = ["bg-cookie/40", "bg-soft-rose", "bg-leaf/30", "bg-honey/30"] as const;

export async function InstagramGrid() {
  const t = await getTranslations("home");
  return (
    <Section py="md">
      <Container>
        <div className="mb-12 text-center">
          <Eyebrow>{t("instagramEyebrow")}</Eyebrow>
          <Heading as="h2" size="h2" className="mt-3">
            {t("instagramTitle")}{" "}
            <a
              href="https://instagram.com/beecuit"
              className="text-honey-dark underline underline-offset-4"
            >
              {t("instagramHandle")}
            </a>
          </Heading>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {TINTS.map((bg, i) => (
            <a
              key={i}
              href="https://instagram.com/beecuit"
              className={`aspect-square overflow-hidden rounded-lg ${bg} transition-opacity hover:opacity-80`}
              aria-label={`Instagram post ${i + 1}`}
            >
              <div className="flex h-full w-full items-center justify-center text-6xl opacity-30">
                📷
              </div>
            </a>
          ))}
        </div>
      </Container>
    </Section>
  );
}

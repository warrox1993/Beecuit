import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Button } from "@/components/ui/button";

export async function Hero({ locale: _locale }: { locale: string }) {
  const t = await getTranslations("home");
  return (
    <section className="bg-cream py-20 md:py-32">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <Eyebrow>{t("heroEyebrow")}</Eyebrow>
            <Heading as="h1" size="display">
              {t("heroTitle")}
              <br />
              <em className="text-honey-dark font-display not-italic">{t("heroTitleAccent")}</em>
            </Heading>
            <Prose>{t("heroProse")}</Prose>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/biscuits">
                <Button className="bg-honey text-cream hover:bg-honey-dark px-6 py-6 text-base">
                  {t("heroCtaPrimary")} →
                </Button>
              </Link>
              <Link href="/notre-histoire">
                <Button
                  variant="outline"
                  className="border-warm-brown/20 text-warm-brown hover:bg-warm-brown/5 px-6 py-6 text-base"
                >
                  {t("heroCtaSecondary")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="bg-cookie/40 ring-warm-brown/10 relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-xl ring-1">
            <Image
              src="https://images.unsplash.com/photo-1522237825450-a0c44eecddb4?fm=jpg&q=75&w=1200&auto=format&fit=crop"
              alt="Biscuits artisanaux belges sortant du four"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

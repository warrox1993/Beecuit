import { setRequestLocale, getTranslations } from "next-intl/server";
import { Section } from "@/components/ui-primitives/Section";
import { Container } from "@/components/ui-primitives/Container";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { ContactForm } from "@/components/shop/ContactForm";
import { ContactCoordinates } from "@/components/contact/ContactCoordinates";
import { ContactMap } from "@/components/contact/ContactMap";
import { ContactFaq } from "@/components/contact/ContactFaq";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("seoTitle"), description: t("seoDescription") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  return (
    <Section py="lg">
      <Container variant="narrow">
        <div className="text-center">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading as="h1" size="h1" className="mt-3">{t("title")}</Heading>
          <Prose className="mx-auto mt-5"><p>{t("intro")}</p></Prose>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_320px]">
          <div className="order-2 md:order-1">
            <ContactForm locale={locale} />
          </div>
          <aside className="order-1 space-y-8 md:order-2">
            <ContactCoordinates />
            <ContactMap />
          </aside>
        </div>

        <div className="mt-16">
          <Heading as="h2" size="h3" className="mb-5 text-center">{t("faqTitle")}</Heading>
          <ContactFaq />
        </div>
      </Container>
    </Section>
  );
}

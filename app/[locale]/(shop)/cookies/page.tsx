import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { ManageCookiesButton } from "@/components/consent/ManageCookiesButton";
import { Container } from "@/components/ui-primitives/Container";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.seo.cookies" });
  return { title: t("title"), description: t("description") };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LegalPage pageKey="cookies" locale={locale} />
      <Container variant="narrow" className="pb-12">
        <ManageCookiesButton className="bg-honey text-cream hover:bg-honey-dark rounded-full px-5 py-2.5 text-sm font-semibold" />
      </Container>
    </>
  );
}

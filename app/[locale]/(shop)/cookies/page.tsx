import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LegalPage } from "@/components/legal/LegalPage";
import { ManageCookiesButton } from "@/components/consent/ManageCookiesButton";
import { Container } from "@/components/ui-primitives/Container";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.seo.cookies" });
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/cookies",
    locale,
  });
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

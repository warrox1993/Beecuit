import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LegalPage } from "@/components/legal/LegalPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.seo.cgv" });
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/cgv",
    locale,
  });
}

export default async function CgvPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage pageKey="cgv" locale={locale} />;
}

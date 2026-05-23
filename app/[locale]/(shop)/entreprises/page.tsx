import { setRequestLocale } from "next-intl/server";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";

export default async function EntreprisesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ComingSoonPage pageKey="entreprises" />;
}

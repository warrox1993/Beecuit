import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <section className="bg-cream flex min-h-[70vh] items-center justify-center">
      <div className="max-w-xl space-y-6 px-6 text-center">
        <h1 className="text-honey text-6xl">{t("title")}</h1>
        <p className="text-warm-brown text-xl">{t("tagline")}</p>
        <Link href="/biscuits">
          <Button className="bg-honey text-cream hover:bg-honey-dark">{t("cta")}</Button>
        </Link>
      </div>
    </section>
  );
}

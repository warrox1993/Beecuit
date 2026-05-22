import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="bg-cream flex min-h-screen items-center justify-center">
      <div className="max-w-xl space-y-6 px-6 text-center">
        <h1 className="text-honey text-6xl">{t("title")}</h1>
        <p className="text-warm-brown text-xl">{t("tagline")}</p>
        <Button className="bg-honey text-cream hover:bg-honey-dark">{t("cta")}</Button>

        <nav className="flex justify-center gap-3 pt-12 text-sm" aria-label={t("languageSwitcher")}>
          {routing.locales.map((l) => (
            <Link
              key={l}
              href="/"
              locale={l}
              className={`tracking-wide uppercase ${l === locale ? "text-honey-dark font-bold underline" : "text-warm-brown hover:text-honey-dark"}`}
            >
              {l}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}

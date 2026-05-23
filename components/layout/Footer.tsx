import { getTranslations, setRequestLocale } from "next-intl/server";

export async function Footer({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("footer");
  return (
    <footer className="bg-cream border-warm-brown/10 mt-16 border-t">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center">
        <p className="text-warm-brown text-sm">{t("tagline")}</p>
        <p className="text-warm-brown/60 mt-2 text-xs">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}

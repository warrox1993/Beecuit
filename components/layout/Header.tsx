import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartIcon } from "./CartIcon";

export async function Header({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  return (
    <header className="bg-cream border-warm-brown/10 border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-honey font-display text-2xl">
          BeeCuit
        </Link>
        <nav className="hidden gap-6 text-sm md:flex" aria-label="Principal">
          <Link href="/biscuits" className="text-warm-brown hover:text-honey-dark">
            {t("biscuits")}
          </Link>
          <Link href="/compte" className="text-warm-brown hover:text-honey-dark">
            {t("account")}
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <LocaleSwitcher currentLocale={locale} />
          <CartIcon />
        </div>
      </div>
    </header>
  );
}

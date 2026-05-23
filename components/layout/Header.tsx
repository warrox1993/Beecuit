import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartIcon } from "./CartIcon";
import { NavLink } from "./NavLink";
import { MobileNav } from "./MobileNav";

export async function Header({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  return (
    <header className="bg-cream/95 border-warm-brown/10 sticky top-0 z-50 border-b backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link href="/" className="text-honey font-display text-2xl">
            BeeCuit
          </Link>
          <nav className="hidden gap-8 md:flex" aria-label="Principal">
            <NavLink href="/biscuits">{t("biscuits")}</NavLink>
            <NavLink href="/coffrets" comingSoon>
              {t("coffrets")}
            </NavLink>
            <NavLink href="/abonnement" comingSoon>
              {t("abonnement")}
            </NavLink>
            <NavLink href="/journal" comingSoon>
              {t("journal")}
            </NavLink>
            <NavLink href="/compte">{t("account")}</NavLink>
          </nav>
          <div className="flex items-center gap-5">
            <div className="hidden md:block">
              <LocaleSwitcher currentLocale={locale} />
            </div>
            <CartIcon />
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}

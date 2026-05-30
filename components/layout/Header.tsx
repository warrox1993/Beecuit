import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui-primitives/Container";
import { Logo } from "@/components/brand/Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartIcon } from "./CartIcon";
import { NavLink } from "./NavLink";
import { MobileNav } from "./MobileNav";
import { HeaderClient } from "./HeaderClient";
import { HeaderUserMenu } from "./HeaderUserMenu";

export async function Header({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  const session = await auth();
  const user = session?.user
    ? {
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        role: session.user.role ?? "customer",
      }
    : null;
  return (
    <HeaderClient>
      <Container>
        <div className="flex h-16 items-center justify-between transition-all duration-300 ease-out group-data-[shrunk=true]/header:h-12 md:h-20 md:group-data-[shrunk=true]/header:h-14">
          <Link
            href="/"
            aria-label="Au Fil des Saveurs — Accueil"
            className="text-warm-brown hover:text-honey-dark transition-colors"
          >
            <Logo
              variant="wordmark"
              className="h-10 w-auto transition-all duration-300 ease-out group-data-[shrunk=true]/header:h-8 md:h-12 md:group-data-[shrunk=true]/header:h-9"
            />
          </Link>
          <nav className="hidden gap-8 md:flex" aria-label="Principal">
            <NavLink href="/biscuits">{t("biscuits")}</NavLink>
            <NavLink href="/coffrets">{t("coffrets")}</NavLink>
            <NavLink href="/cartes-cadeaux">{t("giftCards")}</NavLink>
            <NavLink href="/abonnement">{t("abonnement")}</NavLink>
            <NavLink href="/journal">{t("journal")}</NavLink>
          </nav>
          <div className="flex items-center gap-5">
            <div className="hidden md:block">
              <LocaleSwitcher currentLocale={locale} />
            </div>
            <CartIcon />
            <div className="hidden md:block">
              <HeaderUserMenu user={user} locale={locale} />
            </div>
            <MobileNav user={user} locale={locale} />
          </div>
        </div>
      </Container>
    </HeaderClient>
  );
}

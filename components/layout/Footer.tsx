import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { Logo } from "@/components/brand/Logo";
import { RopeDivider } from "@/components/brand/Ornaments";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.5l.5-3.5h-3v-2c0-1 .5-1.5 1.5-1.5h1.5V3.5C16 3.3 14.8 3 13.8 3c-2.4 0-3.8 1.5-3.8 4v3H7v3.5h3V21h3.5z" />
    </svg>
  );
}

export async function Footer({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cream border-warm-brown/10 mt-24 border-t">
      <Container>
        {/* — Gold rope divider banner at the top — */}
        <div className="pt-10">
          <RopeDivider variant="wave" className="text-honey-dark/45" />
        </div>

        {/* — 3-column layout — */}
        <div className="grid grid-cols-1 gap-12 py-12 md:grid-cols-[5fr_3fr_4fr] md:gap-16">
          {/* — Col 1: logo + bio + address — */}
          <div>
            <Logo
              variant="full"
              className="text-warm-brown -ml-2 h-32 w-auto md:-ml-4 md:h-36"
            />
            <p className="text-warm-brown/85 mt-2 max-w-[36ch] text-sm leading-relaxed">
              {t("bio")}
            </p>
            <div className="mt-4 space-y-0.5">
              <p className="text-warm-brown/70 text-xs">{t("address")}</p>
              <p className="text-warm-brown/70 text-xs">{t("hours")}</p>
            </div>
            <div className="mt-5 flex gap-3">
              <a
                href="https://instagram.com/aufildessaveurs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-warm-brown hover:text-honey-dark border-warm-brown/20 hover:border-honey-dark/50 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/aufildessaveurs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-warm-brown hover:text-honey-dark border-warm-brown/20 hover:border-honey-dark/50 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* — Col 2: shop + maison + help links — */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-honey-dark mb-3 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
                {t("columnShop")}
              </p>
              <ul className="text-warm-brown/85 space-y-1.5 text-sm">
                <li>
                  <Link href="/biscuits" className="hover:text-honey-dark transition-colors">
                    {t("links.biscuits")}
                  </Link>
                </li>
                <li>
                  <Link href="/coffrets" className="hover:text-honey-dark transition-colors">
                    {t("links.coffrets")}
                  </Link>
                </li>
                <li>
                  <Link href="/cartes-cadeaux" className="hover:text-honey-dark transition-colors">
                    {t("links.giftCards")}
                  </Link>
                </li>
                <li>
                  <Link href="/abonnement" className="hover:text-honey-dark transition-colors">
                    {t("links.abonnement")}
                  </Link>
                </li>
              </ul>
              <p className="text-honey-dark mt-6 mb-3 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
                {t("columnHouse")}
              </p>
              <ul className="text-warm-brown/85 space-y-1.5 text-sm">
                <li>
                  <Link href="/notre-histoire" className="hover:text-honey-dark transition-colors">
                    {t("links.story")}
                  </Link>
                </li>
                <li>
                  <Link href="/journal" className="hover:text-honey-dark transition-colors">
                    {t("links.journal")}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-honey-dark transition-colors">
                    {t("links.contact")}
                  </Link>
                </li>
                <li>
                  <Link href="/entreprises" className="hover:text-honey-dark transition-colors">
                    {t("links.b2b")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-honey-dark mb-3 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
                {t("columnHelp")}
              </p>
              <ul className="text-warm-brown/85 space-y-1.5 text-sm">
                <li>
                  <Link href="/cgv" className="hover:text-honey-dark transition-colors">
                    {t("links.terms")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mentions-legales"
                    className="hover:text-honey-dark transition-colors"
                  >
                    {t("links.legal")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/confidentialite"
                    className="hover:text-honey-dark transition-colors"
                  >
                    {t("links.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-honey-dark transition-colors">
                    {t("links.cookies")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* — Col 3: newsletter block — */}
          <div>
            <p className="text-honey-dark mb-3 text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
              {t("newsletterTitle")}
            </p>
            <p className="text-warm-brown/75 mb-4 text-sm leading-relaxed">
              {t("newsletterTagline")}
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* — Bottom bar — */}
        <div className="border-warm-brown/10 flex flex-col gap-3 border-t py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-warm-brown/60 text-xs">{t("copyright", { year })}</p>
          <p className="text-warm-brown/60 text-xs">{t("madeWith")}</p>
        </div>
      </Container>
    </footer>
  );
}

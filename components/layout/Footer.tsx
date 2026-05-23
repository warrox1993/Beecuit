import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { Share2, Globe } from "lucide-react";

export async function Footer({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cream border-warm-brown/10 mt-24 border-t">
      <Container>
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-4">
          <div>
            <p className="text-honey font-display text-2xl">BeeCuit</p>
            <p className="text-warm-brown/80 mt-4 text-sm">{t("tagline")}</p>
            <p className="text-warm-brown/70 mt-4 text-xs">{t("address")}</p>
            <p className="text-warm-brown/70 text-xs">{t("hours")}</p>
          </div>
          <div>
            <p className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
              {t("columnShop")}
            </p>
            <ul className="text-warm-brown/80 space-y-2 text-sm">
              <li>
                <Link href="/biscuits" className="hover:text-honey-dark">
                  {t("links.biscuits")}
                </Link>
              </li>
              <li>
                <Link href="/coffrets" className="hover:text-honey-dark">
                  {t("links.coffrets")}
                </Link>
              </li>
              <li>
                <Link href="/abonnement" className="hover:text-honey-dark">
                  {t("links.abonnement")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
              {t("columnHouse")}
            </p>
            <ul className="text-warm-brown/80 space-y-2 text-sm">
              <li>
                <Link href="/notre-histoire" className="hover:text-honey-dark">
                  {t("links.story")}
                </Link>
              </li>
              <li>
                <Link href="/journal" className="hover:text-honey-dark">
                  {t("links.journal")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-honey-dark">
                  {t("links.contact")}
                </Link>
              </li>
              <li>
                <Link href="/entreprises" className="hover:text-honey-dark">
                  {t("links.b2b")}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
                {t("columnHelp")}
              </p>
              <ul className="text-warm-brown/80 space-y-2 text-sm">
                <li>
                  <Link href="/cgv" className="hover:text-honey-dark">
                    {t("links.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-honey-dark">
                    {t("links.legal")}
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="hover:text-honey-dark">
                    {t("links.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-honey-dark">
                    {t("links.cookies")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-warm-brown font-display text-base">{t("newsletterTitle")}</p>
              <p className="text-warm-brown/70 mb-3 text-xs">{t("newsletterTagline")}</p>
              <NewsletterForm />
            </div>
          </div>
        </div>
        <div className="border-warm-brown/10 flex flex-col gap-4 border-t py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-warm-brown/60 text-xs">{t("copyright", { year })}</p>
          <p className="text-warm-brown/60 text-xs">{t("madeWith")}</p>
          <div className="text-warm-brown/60 flex gap-4">
            <a href="#" aria-label="Instagram" className="hover:text-honey-dark">
              <Share2 className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-honey-dark">
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

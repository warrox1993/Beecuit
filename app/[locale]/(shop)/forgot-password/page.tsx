import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Logo } from "@/components/brand/Logo";
import { ForgotPasswordForm } from "@/components/shop/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { sent, error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link
          href="/"
          aria-label="Au Fil des Saveurs — Accueil"
          className="text-warm-brown mb-12 flex justify-center"
        >
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
          <Heading as="h1" size="h3">
            {t("forgotTitle")}
          </Heading>
          <Prose className="mt-3">{t("forgotDescription")}</Prose>
          {sent === "1" ? (
            <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mt-6 rounded-md border px-4 py-3 text-sm">
              {t("forgotSent")}
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
                >
                  {t("errorInvalid")}
                </div>
              )}
              <div className="mt-6">
                <ForgotPasswordForm locale={locale} />
              </div>
            </>
          )}
          <p className="text-warm-brown/80 mt-6 text-center text-sm">
            <Link href="/sign-in" className="text-honey-dark underline">
              {t("back")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Logo } from "@/components/brand/Logo";
import { SignInForm } from "@/components/shop/SignInForm";
import { GoogleSignInButton } from "@/components/shop/GoogleSignInButton";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  "invalid-credentials": "errorInvalidCredentials",
  "rate-limit": "errorRateLimit",
  "use-oauth": "errorUseOauth",
  "oauth-error": "errorOauth",
  "account-deleted": "errorAccountDeleted",
};

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; reset?: string; verified?: string; callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { error, reset, verified, callbackUrl: rawCallback } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const session = await auth();
  if (session?.user) {
    redirect(safeCallbackUrl(rawCallback ?? null, locale));
  }

  const errorKey = error ? ERROR_KEYS[error] : null;

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
            {t("signInTitle")}
          </Heading>
          <Prose className="mt-3">{t("signInDescription")}</Prose>

          {reset === "ok" && (
            <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mt-4 rounded-md border px-4 py-3 text-sm">
              {t("toastResetOk")}
            </div>
          )}
          {verified === "ok" && (
            <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mt-4 rounded-md border px-4 py-3 text-sm">
              {t("toastVerifiedOk")}
            </div>
          )}
          {errorKey && (
            <div
              role="alert"
              className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
            >
              {t(errorKey)}
            </div>
          )}

          <div className="mt-6">
            <SignInForm locale={locale} callbackUrl={rawCallback} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="border-warm-brown/15 flex-1 border-t" />
            <span className="text-warm-brown/60 text-xs uppercase tracking-wide">
              {t("signInOrDivider")}
            </span>
            <span className="border-warm-brown/15 flex-1 border-t" />
          </div>

          <GoogleSignInButton callbackUrl={rawCallback ?? `/${locale}/compte`} />

          <p className="text-warm-brown/80 mt-6 text-center text-sm">
            {t("signInNoAccount")}{" "}
            <Link href="/sign-up" className="text-honey-dark font-medium underline">
              {t("signInLinkRegister")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

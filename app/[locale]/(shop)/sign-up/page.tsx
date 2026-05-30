import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { SignUpForm } from "@/components/shop/SignUpForm";
import { GoogleSignInButton } from "@/components/shop/GoogleSignInButton";

const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  "rate-limit": "errorRateLimit",
  "email-taken": "errorEmailTaken",
  "use-oauth": "errorUseOauth",
  "password-mismatch": "errorPasswordMismatch",
};

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const session = await auth();
  if (session?.user) redirect(`/${locale}/compte`);

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
            {t("signUpTitle")}
          </Heading>
          {errorKey && (
            <div
              role="alert"
              className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
            >
              {t(errorKey)}
            </div>
          )}
          <div className="mt-6">
            <SignUpForm locale={locale} />
          </div>
          <div className="my-6 flex items-center gap-3">
            <span className="border-warm-brown/15 flex-1 border-t" />
            <span className="text-warm-brown/60 text-xs uppercase tracking-wide">
              {t("signInOrDivider")}
            </span>
            <span className="border-warm-brown/15 flex-1 border-t" />
          </div>
          <GoogleSignInButton callbackUrl={`/${locale}/compte`} />
          <p className="text-warm-brown/80 mt-6 text-center text-sm">
            {t("signUpHaveAccount")}{" "}
            <Link href="/sign-in" className="text-honey-dark font-medium underline">
              {t("signUpLinkSignIn")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

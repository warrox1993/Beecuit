import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";
import { readPending2faCookie } from "@/lib/auth/pending-2fa";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";

const ERROR_KEYS: Record<string, string> = {
  invalid: "twoFactorErrorInvalid",
  "invalid-code": "twoFactorErrorInvalidCode",
  "rate-limit": "errorRateLimit",
};

export default async function TwoFactorChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; sent?: string; callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { error, sent, callbackUrl } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const pending = await readPending2faCookie();
  if (!pending) redirect(`/${locale}/sign-in?error=2fa-expired`);

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link href="/" aria-label="Au Fil des Saveurs — Accueil" className="text-warm-brown mb-12 flex justify-center">
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
          <Heading as="h1" size="h3">{t("twoFactorChallengeTitle")}</Heading>
          <p className="text-warm-brown/70 mt-2 text-sm">{t("twoFactorChallengeHint")}</p>
          {sent && (
            <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mt-4 rounded-md border px-4 py-3 text-sm">
              {t("twoFactorDisableSent")}
            </div>
          )}
          {error && (
            <div role="alert" className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm">
              {t((ERROR_KEYS[error] ?? "twoFactorErrorInvalid") as Parameters<typeof t>[0])}
            </div>
          )}
          <div className="mt-6">
            <TwoFactorChallengeForm locale={locale} callbackUrl={callbackUrl ?? null} />
          </div>
        </div>
      </Container>
    </section>
  );
}

import { eq, gt, and } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { ResetPasswordForm } from "@/components/shop/ResetPasswordForm";
import { db } from "@/lib/db";
import { passwordResetTokens } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";

const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  expired: "resetExpired",
  "rate-limit": "errorRateLimit",
  "password-mismatch": "errorPasswordMismatch",
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, token } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const hashed = hashToken(token);
  const [row] = await db
    .select({ token: passwordResetTokens.token })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, hashed), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);

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
          {!row ? (
            <>
              <Heading as="h1" size="h3">
                {t("resetExpired")}
              </Heading>
              <p className="mt-6">
                <Link
                  href="/forgot-password"
                  className="bg-honey text-cream hover:bg-honey-dark inline-block rounded-md px-5 py-3 text-sm font-medium"
                >
                  {t("resetExpiredCta")}
                </Link>
              </p>
            </>
          ) : (
            <>
              <Heading as="h1" size="h3">
                {t("resetTitle")}
              </Heading>
              {error && ERROR_KEYS[error] && (
                <div
                  role="alert"
                  className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
                >
                  {t(ERROR_KEYS[error])}
                </div>
              )}
              <div className="mt-6">
                <ResetPasswordForm locale={locale} token={token} />
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}

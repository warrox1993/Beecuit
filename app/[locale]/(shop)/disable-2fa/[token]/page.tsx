import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { confirmDisable2fa } from "@/lib/actions/auth.actions";

export default async function Disable2faPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const result = await confirmDisable2fa(token, locale);
  if (result.ok) redirect(result.redirectTo);

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
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 text-center shadow-sm">
          <Heading as="h1" size="h3">
            {t("twoFactorDisableExpired")}
          </Heading>
          <p className="mt-6">
            <Link
              href="/sign-in"
              className="bg-honey text-cream hover:bg-honey-dark inline-block rounded-md px-5 py-3 text-sm font-medium"
            >
              {t("backToSignIn")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

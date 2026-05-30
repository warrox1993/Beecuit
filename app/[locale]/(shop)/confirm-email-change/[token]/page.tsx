import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { confirmEmailChange } from "@/lib/actions/auth.actions";

const ERROR_HEADINGS: Record<string, string> = {
  expired: "emailChangeExpired",
  "taken-race": "emailChangeTakenRace",
  "cannot-revert": "emailChangeExpired",
};

export default async function ConfirmEmailChangePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const result = await confirmEmailChange(token, locale);
  if (result.ok) redirect(result.redirectTo);

  const key = ERROR_HEADINGS[result.error] ?? "emailChangeExpired";

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
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm text-center">
          <Heading as="h1" size="h3">
            {t(key)}
          </Heading>
          <p className="mt-6">
            <Link
              href="/compte/profil"
              className="bg-honey text-cream hover:bg-honey-dark inline-block rounded-md px-5 py-3 text-sm font-medium"
            >
              {t("backToProfile")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

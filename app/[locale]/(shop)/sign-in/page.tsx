import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { checkSignInRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Logo } from "@/components/brand/Logo";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ check?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { check, error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  if (check === "email") {
    return (
      <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
        <Container variant="narrow" className="max-w-md text-center">
          <Link
            href="/"
            aria-label="Au Fil des Saveurs — Accueil"
            className="text-warm-brown mb-12 inline-block"
          >
            <Logo variant="wordmark" className="h-12 w-auto" />
          </Link>
          <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
            <div className="bg-honey/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl">
              📬
            </div>
            <Heading as="h2" size="h3" className="mt-6">
              {t("checkEmail")}
            </Heading>
            <Link
              href="/"
              className="text-warm-brown hover:text-honey-dark mt-6 inline-block text-sm underline"
            >
              {t("back")}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    if (!email || !email.includes("@")) {
      redirect(`/${locale}/sign-in?error=invalid`);
    }
    const reqHeaders = await headers();
    const ip = getClientIp(reqHeaders);
    const limit = await checkSignInRateLimit(email, ip);
    if (!limit.ok) {
      redirect(`/${locale}/sign-in?error=rate-limit`);
    }
    await signIn("resend", { email, redirectTo: `/${locale}/compte` });
  }

  const errorMessage =
    error === "rate-limit"
      ? t("rateLimitError")
      : error === "invalid"
        ? t("invalidEmailError")
        : null;

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
          <Heading as="h2" size="h3">
            {t("signInTitle")}
          </Heading>
          <Prose className="mt-3">{t("signInDescription")}</Prose>
          {errorMessage && (
            <div
              role="alert"
              className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
            >
              {errorMessage}
            </div>
          )}
          <form action={handleSignIn} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-warm-brown text-sm">{t("emailLabel")}</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
              />
            </label>
            <Button
              type="submit"
              className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
            >
              {t("submit")} →
            </Button>
          </form>
        </div>
      </Container>
    </section>
  );
}

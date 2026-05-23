import { getTranslations, setRequestLocale } from "next-intl/server";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ check?: string }>;
}) {
  const { locale } = await params;
  const { check } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  if (check === "email") {
    return (
      <main className="bg-cream flex min-h-screen items-center justify-center">
        <div className="max-w-md space-y-4 p-6 text-center">
          <h1 className="text-honey text-3xl">📬</h1>
          <p className="text-warm-brown">{t("checkEmail")}</p>
          <Link href="/" className="text-warm-brown hover:text-honey-dark text-sm underline">
            {t("back")}
          </Link>
        </div>
      </main>
    );
  }

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    await signIn("resend", { email, redirectTo: `/${locale}/compte` });
  }

  return (
    <main className="bg-cream flex min-h-screen items-center justify-center">
      <form action={handleSignIn} className="w-full max-w-md space-y-4 p-6">
        <h1 className="text-honey text-3xl">{t("signInTitle")}</h1>
        <p className="text-warm-brown">{t("signInDescription")}</p>
        <label className="block">
          <span className="text-warm-brown text-sm">{t("emailLabel")}</span>
          <input
            type="email"
            name="email"
            required
            placeholder={t("emailPlaceholder")}
            className="border-warm-brown/20 text-warm-brown focus:border-honey focus:ring-honey/30 mt-1 block w-full rounded-md border bg-white px-3 py-2 focus:ring-2 focus:outline-none"
          />
        </label>
        <Button type="submit" className="bg-honey text-cream hover:bg-honey-dark w-full">
          {t("submit")}
        </Button>
      </form>
    </main>
  );
}

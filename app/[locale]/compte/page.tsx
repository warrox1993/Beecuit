import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const session = await auth();

  if (!session?.user) {
    redirect({ href: "/sign-in", locale });
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: `/${locale}` });
  }

  return (
    <main className="bg-cream flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-6">
        <h1 className="text-honey text-3xl">{t("title")}</h1>
        <p className="text-warm-brown">
          {t("welcome", { name: session!.user!.name ?? session!.user!.email ?? "" })}
        </p>
        <p className="text-warm-brown/70 text-sm">
          {t("loggedInAs", { email: session!.user!.email ?? "" })}
        </p>
        <form action={handleSignOut}>
          <Button type="submit" variant="outline">
            {(await getTranslations("nav"))("signOut")}
          </Button>
        </form>
      </div>
    </main>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";

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
    <section>
      <Eyebrow>MON COMPTE</Eyebrow>
      <Heading as="h1" size="h1" className="mt-3 mb-8">
        {t("title")}
      </Heading>
      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <Prose>{t("welcome", { name: session!.user!.name ?? session!.user!.email ?? "" })}</Prose>
        <p className="text-warm-brown/70 mt-2 text-sm">
          {t("loggedInAs", { email: session!.user!.email ?? "" })}
        </p>
        <form action={handleSignOut} className="mt-6">
          <Button type="submit" variant="outline">
            {(await getTranslations("nav"))("signOut")}
          </Button>
        </form>
      </div>
    </section>
  );
}

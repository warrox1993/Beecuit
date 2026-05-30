import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { EmailNotVerifiedBanner } from "@/components/account/EmailNotVerifiedBanner";
import { signOutAction } from "@/lib/actions/auth.actions";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ welcome?: string; verified?: string; verify?: string }>;
}) {
  const { locale } = await params;
  const { welcome, verified, verify } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const tAuth = await getTranslations("auth");
  const session = await auth();

  if (!session?.user) {
    redirect({ href: "/sign-in", locale });
  }

  const [user] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, session!.user!.id))
    .limit(1);

  const handleSignOut = signOutAction.bind(null, locale);

  return (
    <section>
      {!user?.emailVerified && (
        <EmailNotVerifiedBanner locale={locale} sent={verify === "sent"} />
      )}
      {welcome === "1" && (
        <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mb-6 rounded-md border px-4 py-3 text-sm">
          {tAuth("toastWelcome")}
        </div>
      )}
      {verified === "ok" && (
        <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mb-6 rounded-md border px-4 py-3 text-sm">
          {tAuth("toastVerifiedOk")}
        </div>
      )}

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

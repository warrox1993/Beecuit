import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { LinkedAccountsBlock } from "@/components/account/LinkedAccountsBlock";
import { PreferencesBlock } from "@/components/account/PreferencesBlock";
import { Link } from "@/i18n/navigation";

const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  "rate-limit": "errorRateLimit",
  "password-mismatch": "errorPasswordMismatch",
  "wrong-current": "errorWrongCurrent",
  "no-password-yet": "errorNoPasswordYet",
};

export default async function ProfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; password?: string; profile?: string }>;
}) {
  const { locale } = await params;
  const { error, password, profile } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });

  const [user] = await db
    .select({
      passwordHash: users.passwordHash,
      preferredLocale: users.preferredLocale,
      newsletterOptIn: users.newsletterOptIn,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, session!.user!.id))
    .limit(1);

  const linkedGoogle = await db
    .select({ id: accounts.providerAccountId })
    .from(accounts)
    .where(eq(accounts.userId, session!.user!.id))
    .limit(1);
  const googleLinked = linkedGoogle.length > 0;

  const errorKey = error ? ERROR_KEYS[error] : null;
  return (
    <section className="space-y-8">
      <div>
        <Eyebrow>MON PROFIL</Eyebrow>
        <Heading as="h1" size="h1" className="mt-3 mb-2">
          Mon profil
        </Heading>
        <p className="text-warm-brown/70 text-sm">{user?.email}</p>
      </div>

      {(password === "ok" || profile === "ok") && (
        <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark rounded-md border px-4 py-3 text-sm">
          {password === "ok" ? t("toastPasswordOk") : "Préférences enregistrées."}
        </div>
      )}
      {errorKey && (
        <div
          role="alert"
          className="border-terracotta/30 bg-terracotta/5 text-terracotta rounded-md border px-4 py-3 text-sm"
        >
          {t(errorKey as Parameters<typeof t>[0])}
        </div>
      )}

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">{t("passwordLabel")}</h2>
        {user?.passwordHash ? (
          <div className="mt-4">
            <ChangePasswordForm locale={locale} />
          </div>
        ) : (
          <p className="text-warm-brown/70 mt-3 text-sm">
            {t("errorNoPasswordYet")}{" "}
            <Link href="/forgot-password" className="text-honey-dark underline">
              {t("forgotLink")}
            </Link>
          </p>
        )}
      </div>

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">Comptes liés</h2>
        <div className="mt-4">
          <LinkedAccountsBlock googleLinked={googleLinked} />
        </div>
      </div>

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">Préférences</h2>
        <div className="mt-4">
          <PreferencesBlock
            locale={locale}
            preferredLocale={(user?.preferredLocale ?? "fr") as "fr" | "nl" | "de" | "en"}
            newsletterOptIn={user?.newsletterOptIn ?? false}
          />
        </div>
      </div>
    </section>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, accounts, sessions } from "@/lib/db/schema";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { LinkedAccountsBlock } from "@/components/account/LinkedAccountsBlock";
import { PreferencesBlock } from "@/components/account/PreferencesBlock";
import { EmailChangeBlock } from "@/components/account/EmailChangeBlock";
import { DangerZoneBlock } from "@/components/account/DangerZoneBlock";
import { TwoFactorBlock } from "@/components/account/TwoFactorBlock";
import { SessionsBlock, type SessionRow } from "@/components/account/SessionsBlock";
import { parseUserAgentLabel } from "@/lib/auth/session-metadata";
import { cookies } from "next/headers";
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
  searchParams: Promise<{
    error?: string;
    password?: string;
    profile?: string;
    email?: string;
    delete?: string;
  }>;
}) {
  const { locale } = await params;
  const { error, password, profile, email, delete: deleteFlag } = await searchParams;
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
      pendingEmail: users.pendingEmail,
      twoFactorEnabledAt: users.twoFactorEnabledAt,
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

  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
  const currentToken = (await cookies()).get(cookieName)?.value ?? "";

  const sessionRows = await db
    .select({
      sessionToken: sessions.sessionToken,
      userAgent: sessions.userAgent,
      city: sessions.city,
      country: sessions.country,
      lastSeenAt: sessions.lastSeenAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, session!.user!.id));

  // Lazy throttled last_seen refresh for the current session (≤ once / 15 min).
  const currentRow = sessionRows.find((s) => s.sessionToken === currentToken);
  if (currentRow && (!currentRow.lastSeenAt || currentRow.lastSeenAt < new Date(Date.now() - 15 * 60 * 1000))) {
    await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.sessionToken, currentToken));
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  function lastSeenLabel(d: Date | null): string {
    if (!d) return "";
    const mins = Math.round((d.getTime() - Date.now()) / 60000);
    if (mins > -60) return rtf.format(mins, "minute");
    const hours = Math.round(mins / 60);
    if (hours > -24) return rtf.format(hours, "hour");
    return rtf.format(Math.round(hours / 24), "day");
  }

  const sessionList: SessionRow[] = sessionRows
    .sort((a, b) => (b.lastSeenAt?.getTime() ?? 0) - (a.lastSeenAt?.getTime() ?? 0))
    .map((s) => ({
      sessionToken: s.sessionToken,
      label: parseUserAgentLabel(s.userAgent),
      city: s.city,
      country: s.country,
      lastSeenLabel: lastSeenLabel(s.lastSeenAt ?? s.createdAt),
      isCurrent: s.sessionToken === currentToken,
    }));

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

      {email && (
        <div
          role={email === "changed" || email === "verify-sent" || email === "reverted" ? undefined : "alert"}
          className={
            email === "changed" || email === "verify-sent" || email === "reverted"
              ? "border-honey-dark/30 bg-honey-dark/5 text-honey-dark rounded-md border px-4 py-3 text-sm"
              : "border-terracotta/30 bg-terracotta/5 text-terracotta rounded-md border px-4 py-3 text-sm"
          }
        >
          {t(`emailToast_${email}`)}
        </div>
      )}
      {deleteFlag && (
        <div
          role="alert"
          className="border-terracotta/30 bg-terracotta/5 text-terracotta rounded-md border px-4 py-3 text-sm"
        >
          {t(`deleteToast_${deleteFlag}`)}
        </div>
      )}
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

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">{t("emailLabel")}</h2>
        <div className="mt-4">
          <EmailChangeBlock
            locale={locale}
            currentEmail={user?.email ?? ""}
            pendingEmail={user?.pendingEmail ?? null}
          />
        </div>
      </div>

      <div id="securite" className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">{t("twoFactorLabel")}</h2>
        <div className="mt-4">
          <TwoFactorBlock locale={locale} enabled={!!user?.twoFactorEnabledAt} />
        </div>
      </div>

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">{t("sessionsLabel")}</h2>
        <div className="mt-4">
          <SessionsBlock sessions={sessionList} />
        </div>
      </div>

      <div className="border-terracotta/30 rounded-xl border bg-white p-6">
        <div className="text-terracotta mb-3 text-xs font-bold tracking-widest uppercase">
          {t("dangerZone")}
        </div>
        <h2 className="text-warm-brown text-lg font-medium">{t("deleteAccountTitle")}</h2>
        <div className="mt-4">
          <DangerZoneBlock locale={locale} hasPassword={!!user?.passwordHash} />
        </div>
      </div>
    </section>
  );
}

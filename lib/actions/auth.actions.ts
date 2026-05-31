"use server";
import { signOut } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, verificationTokens, passwordResetTokens, sessions, twoFactorRecoveryCodes } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { createDbSession, destroyCurrentSession } from "@/lib/auth/session";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { checkAuthRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { sendEmail } from "@/lib/email/client";
import { VerifyEmailEmail } from "@/components/email/VerifyEmailEmail";
import { WelcomeEmail } from "@/components/email/WelcomeEmail";
import { PasswordResetEmail } from "@/components/email/PasswordResetEmail";
import { PasswordChangedEmail } from "@/components/email/PasswordChangedEmail";
import { AccountDeletionRequestedEmail } from "@/components/email/AccountDeletionRequestedEmail";
import { AccountDeletionCancelledEmail } from "@/components/email/AccountDeletionCancelledEmail";
import { EmailChangeVerifyEmail } from "@/components/email/EmailChangeVerifyEmail";
import { EmailChangedNotificationEmail } from "@/components/email/EmailChangedNotificationEmail";
import { TwoFactorEnabledEmail } from "@/components/email/TwoFactorEnabledEmail";
import { Disable2faRequestEmail } from "@/components/email/Disable2faRequestEmail";
import { auth } from "@/lib/auth";
import {
  generateSecret,
  buildOtpauthUrl,
  buildQrDataUrl,
  verifyTotp,
  encryptSecret,
  decryptSecret,
} from "@/lib/auth/totp";
import { generateRecoveryCodes, consumeRecoveryCode } from "@/lib/auth/recovery-codes";
import {
  setPending2faCookie,
  readPending2faCookie,
  clearPending2faCookie,
} from "@/lib/auth/pending-2fa";
import { captureMetadata } from "@/lib/auth/session-metadata";
import { env } from "@/lib/env";

type Locale = (typeof routing.locales)[number];

function normalizeLocale(input: string): Locale {
  return (routing.locales as readonly string[]).includes(input)
    ? (input as Locale)
    : routing.defaultLocale;
}

export async function signOutAction(locale: string) {
  const safeLocale = normalizeLocale(locale);
  await signOut({ redirectTo: `/${safeLocale}` });
}

const APP_LOCALES = ["fr", "nl", "de", "en"] as const;
type AppLocale = (typeof APP_LOCALES)[number];

function asLocale(input: string | null | undefined): AppLocale {
  return (APP_LOCALES as readonly string[]).includes(input ?? "")
    ? (input as AppLocale)
    : "fr";
}

const registerSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(12).max(200),
    confirmPassword: z.string().min(12).max(200),
    acceptTerms: z.literal("on"),
    newsletterOptIn: z.union([z.literal("on"), z.undefined()]),
    locale: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "password-mismatch",
    path: ["confirmPassword"],
  });

export async function registerWithPassword(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
    newsletterOptIn: formData.get("newsletterOptIn") ?? undefined,
    locale,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const code = first?.path[0] === "confirmPassword" ? "password-mismatch" : "invalid";
    redirect(`/${locale}/sign-up?error=${code}`);
  }
  const { email, password, newsletterOptIn } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "register", email: normalizedEmail, ip });
  if (!limit.ok) redirect(`/${locale}/sign-up?error=rate-limit`);

  const existing = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing[0]) {
    if (existing[0].passwordHash) {
      redirect(`/${locale}/sign-up?error=email-taken`);
    } else {
      redirect(`/${locale}/sign-up?error=use-oauth`);
    }
  }

  const passwordHash = await hashPassword(password);
  const [inserted] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      preferredLocale: locale,
      newsletterOptIn: newsletterOptIn === "on",
      role: "customer",
    })
    .returning({ id: users.id });

  const userId = inserted!.id;

  // Email verification token (24h)
  const rawVerify = generateRawToken();
  await db.insert(verificationTokens).values({
    identifier: normalizedEmail,
    token: hashToken(rawVerify),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const verifyUrl = `${appBase}/${locale}/verify-email/${rawVerify}`;
  await sendEmail({
    to: normalizedEmail,
    subject: "Confirme ton adresse email — Au Fil des Saveurs",
    react: VerifyEmailEmail({ locale, verifyUrl }),
  });

  // Welcome email (best-effort)
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Bienvenue chez Au Fil des Saveurs",
      react: WelcomeEmail({ locale, shopUrl: `${appBase}/${locale}/biscuits` }),
    });
  } catch {
    // welcome is non-critical; verify already sent above
  }

  await createDbSession(userId);
  redirect(`/${locale}/compte?welcome=1`);
}

const signInSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
  callbackUrl: z.string().optional(),
  locale: z.string(),
});

export async function signInWithPassword(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
    locale,
  });
  if (!parsed.success) {
    redirect(`/${locale}/sign-in?error=invalid`);
  }
  const { email, password, callbackUrl } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "sign-in", email: normalizedEmail, ip });
  if (!limit.ok) redirect(`/${locale}/sign-in?error=rate-limit`);

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      deletedAt: users.deletedAt,
      purgedAt: users.purgedAt,
      twoFactorEnabledAt: users.twoFactorEnabledAt,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user?.purgedAt) {
    // Treat tombstones like non-existent — never leak that the account once
    // existed.
    redirect(`/${locale}/sign-in?error=invalid-credentials`);
  }
  if (user?.deletedAt) {
    redirect(`/${locale}/sign-in?error=account-deleted`);
  }

  if (!user) {
    redirect(`/${locale}/sign-in?error=invalid-credentials`);
  }
  if (!user.passwordHash) {
    redirect(`/${locale}/sign-in?error=use-oauth`);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect(`/${locale}/sign-in?error=invalid-credentials`);
  }

  if (user.twoFactorEnabledAt) {
    await setPending2faCookie(user.id);
    const cb = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/${locale}/sign-in/2fa?locale=${locale}${cb}`);
  }

  await createDbSession(user.id, captureMetadata(reqHeaders));
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  redirect(safeCallbackUrl(callbackUrl ?? null, locale));
}

const forgotSchema = z.object({
  email: z.string().email().max(254),
  locale: z.string(),
});

export async function requestPasswordReset(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const parsed = forgotSchema.safeParse({
    email: formData.get("email"),
    locale,
  });
  if (!parsed.success) {
    redirect(`/${locale}/forgot-password?error=invalid`);
  }
  const { email } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "forgot", email: normalizedEmail, ip });
  if (!limit.ok) {
    // still redirect to sent — avoid leaking limit state
    redirect(`/${locale}/forgot-password?sent=1`);
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user) {
    const raw = generateRawToken();
    await db.insert(passwordResetTokens).values({
      token: hashToken(raw),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
    });
    const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const resetUrl = `${appBase}/${locale}/reset-password/${raw}`;
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Réinitialise ton mot de passe — Au Fil des Saveurs",
        react: PasswordResetEmail({ locale, resetUrl }),
      });
    } catch (e) {
      console.error("[auth] reset email send failed", e);
    }
  }

  redirect(`/${locale}/forgot-password?sent=1`);
}

const resetSchema = z
  .object({
    token: z.string().min(20).max(200),
    newPassword: z.string().min(12).max(200),
    confirmPassword: z.string().min(12).max(200),
    locale: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "password-mismatch",
    path: ["confirmPassword"],
  });

export async function resetPassword(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
    locale,
  });
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.path[0] === "confirmPassword" ? "password-mismatch" : "invalid";
    const rawToken = (formData.get("token") as string | null) ?? "";
    redirect(`/${locale}/reset-password/${rawToken}?error=${code}`);
  }
  const { token: rawToken, newPassword } = parsed.data;

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "reset", email: null, ip });
  if (!limit.ok) redirect(`/${locale}/reset-password/${rawToken}?error=rate-limit`);

  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({ token: passwordResetTokens.token, userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, hashed))
    .limit(1);
  if (!row) redirect(`/${locale}/reset-password/${rawToken}?error=expired`);

  const passwordHash = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, row.userId));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));
    await tx.delete(sessions).where(eq(sessions.userId, row.userId));
  });

  // Best-effort security advisory
  const [user] = await db
    .select({ email: users.email, preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);
  if (user) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Ton mot de passe a été modifié",
        react: PasswordChangedEmail({ locale: asLocale(user.preferredLocale) }),
      });
    } catch (e) {
      console.error("[auth] password-changed email send failed", e);
    }
  }

  redirect(`/${locale}/sign-in?reset=ok`);
}

export type VerifyEmailResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: "expired" };

export async function verifyEmail(rawToken: string, locale: string): Promise<VerifyEmailResult> {
  const safeLocale = asLocale(locale);
  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({ identifier: verificationTokens.identifier, expires: verificationTokens.expires })
    .from(verificationTokens)
    .where(eq(verificationTokens.token, hashed))
    .limit(1);
  if (!row || row.expires.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, row.identifier));
    await tx
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, row.identifier));
  });
  return { ok: true, redirectTo: `/${safeLocale}/compte?verified=ok` };
}

export async function resendEmailVerification(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.email) redirect(`/${locale}/sign-in`);

  const email = session.user.email.toLowerCase();
  const userLocale = asLocale(session.user.preferredLocale ?? locale);

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "forgot", email, ip });
  if (!limit.ok) redirect(`/${locale}/compte?verify=rate-limit`);

  // Wipe stale tokens, issue a fresh one
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
  const raw = generateRawToken();
  await db.insert(verificationTokens).values({
    identifier: email,
    token: hashToken(raw),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const verifyUrl = `${appBase}/${userLocale}/verify-email/${raw}`;
  await sendEmail({
    to: email,
    subject: "Confirme ton adresse email — Au Fil des Saveurs",
    react: VerifyEmailEmail({ locale: userLocale, verifyUrl }),
  });
  redirect(`/${locale}/compte?verify=sent`);
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12).max(200),
    confirmPassword: z.string().min(12).max(200),
    locale: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "password-mismatch",
    path: ["confirmPassword"],
  });

export async function changePassword(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
    locale,
  });
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.path[0] === "confirmPassword" ? "password-mismatch" : "invalid";
    redirect(`/${locale}/compte/profil?error=${code}`);
  }
  const { currentPassword, newPassword } = parsed.data;

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const email = session.user.email?.toLowerCase() ?? "";
  const limit = await checkAuthRateLimit({ action: "change-password", email, ip });
  if (!limit.ok) redirect(`/${locale}/compte/profil?error=rate-limit`);

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) redirect(`/${locale}/sign-in`);

  if (!user.passwordHash) {
    redirect(`/${locale}/compte/profil?error=no-password-yet`);
  }
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) redirect(`/${locale}/compte/profil?error=wrong-current`);

  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));

  try {
    await sendEmail({
      to: user.email,
      subject: "Ton mot de passe a été modifié",
      react: PasswordChangedEmail({ locale }),
    });
  } catch (e) {
    console.error("[auth] password-changed email send failed", e);
  }

  redirect(`/${locale}/compte/profil?password=ok`);
}

const updateProfileSchema = z.object({
  preferredLocale: z.enum(["fr", "nl", "de", "en"]),
  newsletterOptIn: z.union([z.literal("on"), z.undefined()]),
  locale: z.string(),
});

export async function updateProfile(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const parsed = updateProfileSchema.safeParse({
    preferredLocale: formData.get("preferredLocale"),
    newsletterOptIn: formData.get("newsletterOptIn") ?? undefined,
    locale,
  });
  if (!parsed.success) redirect(`/${locale}/compte/profil?error=invalid`);

  await db
    .update(users)
    .set({
      preferredLocale: parsed.data.preferredLocale,
      newsletterOptIn: parsed.data.newsletterOptIn === "on",
    })
    .where(eq(users.id, session.user.id));

  redirect(`/${parsed.data.preferredLocale}/compte/profil?profile=ok`);
}

const emailChangeSchema = z.object({
  newEmail: z.string().email().max(254),
  currentPassword: z.string().min(1).max(200),
  locale: z.string(),
});

export async function requestEmailChange(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const parsed = emailChangeSchema.safeParse({
    newEmail: formData.get("newEmail"),
    currentPassword: formData.get("currentPassword"),
    locale,
  });
  if (!parsed.success) redirect(`/${locale}/compte/profil?email=invalid`);

  const { newEmail, currentPassword } = parsed.data;
  const normalized = newEmail.trim().toLowerCase();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(and(eq(users.id, session.user.id), isNull(users.purgedAt)))
    .limit(1);
  if (!user) redirect(`/${locale}/sign-in`);

  if (normalized === user.email.toLowerCase()) {
    redirect(`/${locale}/compte/profil?email=same`);
  }
  if (!user.passwordHash) {
    redirect(`/${locale}/compte/profil?email=set-password-first`);
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) redirect(`/${locale}/compte/profil?email=wrong-password`);

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({
    action: "email-change",
    email: user.email,
    ip,
  });
  if (!limit.ok) redirect(`/${locale}/compte/profil?email=rate-limit`);

  // Check new address not taken (by a non-purged user)
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, normalized), isNull(users.purgedAt)))
    .limit(1);
  if (existing) redirect(`/${locale}/compte/profil?email=taken`);

  const rawToken = generateRawToken();
  await db
    .update(users)
    .set({
      pendingEmail: normalized,
      pendingEmailToken: hashToken(rawToken),
      pendingEmailExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .where(eq(users.id, user.id));

  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const confirmUrl = `${appBase}/${locale}/confirm-email-change/${rawToken}`;
  try {
    await sendEmail({
      to: normalized,
      subject: "Confirme ta nouvelle adresse email — Au Fil des Saveurs",
      react: EmailChangeVerifyEmail({ locale, confirmUrl }),
    });
  } catch (e) {
    console.error("[auth] email-change verify send failed", e);
  }
  redirect(`/${locale}/compte/profil?email=verify-sent`);
}

export type EmailChangeResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: "expired" | "taken-race" | "cannot-revert" };

export async function confirmEmailChange(
  rawToken: string,
  locale: string,
): Promise<EmailChangeResult> {
  const safeLocale = asLocale(locale);
  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      pendingEmail: users.pendingEmail,
      expiresAt: users.pendingEmailExpiresAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.pendingEmailToken, hashed))
    .limit(1);
  if (!row || row.purgedAt || !row.pendingEmail) {
    return { ok: false, error: "expired" };
  }
  if (!row.expiresAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  // Race check: nobody else registered the new address in the meantime.
  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.email, row.pendingEmail),
        isNull(users.purgedAt),
      ),
    )
    .limit(1);
  if (conflict && conflict.id !== row.id) {
    await db
      .update(users)
      .set({
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
      })
      .where(eq(users.id, row.id));
    return { ok: false, error: "taken-race" };
  }

  const oldEmail = row.email;
  const undoRaw = generateRawToken();

  await db
    .update(users)
    .set({
      email: row.pendingEmail,
      emailVerified: new Date(),
      emailChangeUndoTo: oldEmail,
      emailChangeUndoToken: hashToken(undoRaw),
      emailChangeUndoExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpiresAt: null,
    })
    .where(eq(users.id, row.id));

  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const undoUrl = `${appBase}/${safeLocale}/undo-email-change/${undoRaw}`;
  try {
    await sendEmail({
      to: oldEmail,
      subject: "Ton adresse email a été modifiée — Au Fil des Saveurs",
      react: EmailChangedNotificationEmail({
        locale: safeLocale,
        undoUrl,
        newEmail: row.pendingEmail,
      }),
    });
  } catch (e) {
    console.error("[auth] email-changed notif send failed", e);
  }

  return { ok: true, redirectTo: `/${safeLocale}/compte/profil?email=changed` };
}

export async function revertEmailChange(
  rawToken: string,
  locale: string,
): Promise<EmailChangeResult> {
  const safeLocale = asLocale(locale);
  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({
      id: users.id,
      currentEmail: users.email,
      undoTo: users.emailChangeUndoTo,
      undoExpiresAt: users.emailChangeUndoExpiresAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.emailChangeUndoToken, hashed))
    .limit(1);
  if (!row || row.purgedAt || !row.undoTo) {
    return { ok: false, error: "expired" };
  }
  if (!row.undoExpiresAt || row.undoExpiresAt.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  // Make sure the old address isn't taken by someone else now
  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, row.undoTo), isNull(users.purgedAt)))
    .limit(1);
  if (conflict && conflict.id !== row.id) {
    return { ok: false, error: "cannot-revert" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        email: row.undoTo as string,
        emailChangeUndoTo: null,
        emailChangeUndoToken: null,
        emailChangeUndoExpiresAt: null,
      })
      .where(eq(users.id, row.id));
    await tx.delete(sessions).where(eq(sessions.userId, row.id));
  });

  return { ok: true, redirectTo: `/${safeLocale}/sign-in?email=reverted` };
}

const deletionSchema = z.object({
  confirmText: z.literal("SUPPRIMER"),
  currentPassword: z.string().max(200),
  locale: z.string(),
});

function humanDate(d: Date, locale: "fr" | "nl" | "de" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : `${locale}-BE`, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export async function requestAccountDeletion(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const parsed = deletionSchema.safeParse({
    confirmText: formData.get("confirmText"),
    currentPassword: formData.get("currentPassword") ?? "",
    locale,
  });
  if (!parsed.success) {
    redirect(`/${locale}/compte/profil?delete=invalid`);
  }
  const { currentPassword } = parsed.data;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(and(eq(users.id, session.user.id), isNull(users.purgedAt)))
    .limit(1);
  if (!user) redirect(`/${locale}/sign-in`);

  // If the user has a password, we require it. OAuth-only users can submit
  // an empty password and rely on confirmText.
  if (user.passwordHash) {
    if (!currentPassword) {
      redirect(`/${locale}/compte/profil?delete=wrong-password`);
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) redirect(`/${locale}/compte/profil?delete=wrong-password`);
  }

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({
    action: "delete",
    email: user.email,
    ip,
  });
  if (!limit.ok) redirect(`/${locale}/compte/profil?delete=rate-limit`);

  const rawToken = generateRawToken();
  const deletedAt = new Date();
  const expiresAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        deletedAt,
        cancelDeletionToken: hashToken(rawToken),
        cancelDeletionExpiresAt: expiresAt,
        // also clear any in-flight pending email so it can't be reused
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
      })
      .where(eq(users.id, user.id));
    await tx.delete(sessions).where(eq(sessions.userId, user.id));
  });

  // Best-effort Stripe subscription cancellation at period end.
  // TODO(v2-B): integrate stripe.subscriptions.update(id, { cancel_at_period_end: true }).
  // Intentionally left as a comment — do NOT add a placeholder helper here.

  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const cancelUrl = `${appBase}/${locale}/cancel-deletion/${rawToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Suppression de compte programmée — Au Fil des Saveurs",
      react: AccountDeletionRequestedEmail({
        locale,
        cancelUrl,
        expiresHuman: humanDate(expiresAt, locale),
      }),
    });
  } catch (e) {
    console.error("[auth] deletion-requested email send failed", e);
  }

  redirect(`/${locale}?deletion=requested`);
}

export type CancelDeletionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: "expired" };

export async function cancelAccountDeletion(
  rawToken: string,
  locale: string,
): Promise<CancelDeletionResult> {
  const safeLocale = asLocale(locale);
  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      preferredLocale: users.preferredLocale,
      expiresAt: users.cancelDeletionExpiresAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.cancelDeletionToken, hashed))
    .limit(1);
  if (!row || row.purgedAt) return { ok: false, error: "expired" };
  if (!row.expiresAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  await db
    .update(users)
    .set({
      deletedAt: null,
      cancelDeletionToken: null,
      cancelDeletionExpiresAt: null,
    })
    .where(eq(users.id, row.id));

  try {
    await sendEmail({
      to: row.email,
      subject: "Suppression annulée — Au Fil des Saveurs",
      react: AccountDeletionCancelledEmail({ locale: asLocale(row.preferredLocale) }),
    });
  } catch (e) {
    console.error("[auth] deletion-cancelled email send failed", e);
  }

  return { ok: true, redirectTo: `/${safeLocale}/sign-in?deletion=cancelled` };
}

export type TwoFactorSetup =
  | { ok: true; otpauthUrl: string; qrDataUrl: string }
  | { ok: false; error: string };

export async function generateTwoFactorSetup(): Promise<TwoFactorSetup> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };

  const [user] = await db
    .select({ email: users.email, passwordHash: users.passwordHash, enabledAt: users.twoFactorEnabledAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) return { ok: false, error: "unauthorized" };
  if (!user.passwordHash) return { ok: false, error: "no-password-yet" };
  if (user.enabledAt) return { ok: false, error: "already-enabled" };

  const secret = generateSecret();
  await db
    .update(users)
    .set({ twoFactorSecret: encryptSecret(secret) })
    .where(eq(users.id, session.user.id));

  const otpauthUrl = buildOtpauthUrl(user.email, secret);
  return { ok: true, otpauthUrl, qrDataUrl: await buildQrDataUrl(otpauthUrl) };
}

const enable2faSchema = z.object({ code: z.string().min(6).max(10), locale: z.string() });

export type EnableTwoFactorResult =
  | { ok: true; recoveryCodes: string[] }
  | { ok: false; error: string };

export async function enableTwoFactor(formData: FormData): Promise<EnableTwoFactorResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  const parsed = enable2faSchema.safeParse({
    code: formData.get("code"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [user] = await db
    .select({ secret: users.twoFactorSecret, enabledAt: users.twoFactorEnabledAt, preferredLocale: users.preferredLocale, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.secret) return { ok: false, error: "no-setup" };
  if (user.enabledAt) return { ok: false, error: "already-enabled" };
  if (!verifyTotp(decryptSecret(user.secret), parsed.data.code)) {
    return { ok: false, error: "invalid-code" };
  }

  const { plain, hashes } = generateRecoveryCodes();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ twoFactorEnabledAt: new Date() }).where(eq(users.id, session.user!.id));
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, session.user!.id));
    await tx.insert(twoFactorRecoveryCodes).values(
      hashes.map((codeHash) => ({ userId: session.user!.id, codeHash })),
    );
  });

  await sendEmail({
    to: user.email,
    subject: "Au Fil des Saveurs — 2FA",
    react: TwoFactorEnabledEmail({ locale: asLocale(user.preferredLocale) }),
  });

  return { ok: true, recoveryCodes: plain };
}

const disable2faSchema = z.object({ password: z.string().min(1).max(200), locale: z.string() });

export type Disable2faResult = { ok: true } | { ok: false; error: string };

export async function disableTwoFactor(formData: FormData): Promise<Disable2faResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  const parsed = disable2faSchema.safeParse({
    password: formData.get("password"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "wrong-password" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        twoFactorDisableToken: null,
        twoFactorDisableExpiresAt: null,
      })
      .where(eq(users.id, session.user!.id));
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, session.user!.id));
  });
  return { ok: true };
}

export type RegenerateResult = { ok: true; recoveryCodes: string[] } | { ok: false; error: string };

export async function regenerateRecoveryCodes(formData: FormData): Promise<RegenerateResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  const password = String(formData.get("password") ?? "");

  const [user] = await db
    .select({ passwordHash: users.passwordHash, enabledAt: users.twoFactorEnabledAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.enabledAt) return { ok: false, error: "not-enabled" };
  if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "wrong-password" };
  }

  const { plain, hashes } = generateRecoveryCodes();
  await db.transaction(async (tx) => {
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, session.user!.id));
    await tx.insert(twoFactorRecoveryCodes).values(
      hashes.map((codeHash) => ({ userId: session.user!.id, codeHash })),
    );
  });
  return { ok: true, recoveryCodes: plain };
}

const verify2faSchema = z.object({
  code: z.string().min(6).max(20),
  locale: z.string(),
  callbackUrl: z.string().optional(),
});

export async function verifyTwoFactorChallenge(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const pending = await readPending2faCookie();
  if (!pending) redirect(`/${locale}/sign-in?error=2fa-expired`);

  const parsed = verify2faSchema.safeParse({
    code: formData.get("code"),
    locale,
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });
  if (!parsed.success) redirect(`/${locale}/sign-in/2fa?error=invalid&locale=${locale}`);

  const reqHeaders = await headers();
  const limit = await checkAuthRateLimit({
    action: "two-factor",
    email: pending!.userId,
    ip: getClientIp(reqHeaders),
  });
  if (!limit.ok) redirect(`/${locale}/sign-in/2fa?error=rate-limit&locale=${locale}`);

  const [user] = await db
    .select({ id: users.id, secret: users.twoFactorSecret, enabledAt: users.twoFactorEnabledAt })
    .from(users)
    .where(eq(users.id, pending!.userId))
    .limit(1);
  if (!user?.enabledAt || !user.secret) redirect(`/${locale}/sign-in?error=2fa-expired`);

  const code = parsed.data.code.trim();
  const totpOk = verifyTotp(decryptSecret(user.secret), code);
  const recoveryOk = totpOk ? false : await consumeRecoveryCode(user.id, code);
  if (!totpOk && !recoveryOk) {
    redirect(`/${locale}/sign-in/2fa?error=invalid-code&locale=${locale}`);
  }

  await createDbSession(user.id, captureMetadata(reqHeaders));
  await clearPending2faCookie();
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  redirect(safeCallbackUrl(parsed.data.callbackUrl ?? null, locale));
}

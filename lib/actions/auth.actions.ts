"use server";
import { signOut } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, verificationTokens, passwordResetTokens, sessions } from "@/lib/db/schema";
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
import { auth } from "@/lib/auth";
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
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

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

  await createDbSession(user.id);
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  redirect(safeCallbackUrl(callbackUrl ?? null, locale));
}

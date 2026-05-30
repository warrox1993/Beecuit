"use server";
import { signOut } from "@/lib/auth";
import { routing } from "@/i18n/routing";

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

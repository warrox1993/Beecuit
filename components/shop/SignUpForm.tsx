"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { registerWithPassword } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function SignUpForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => registerWithPassword(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
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
      <label className="block">
        <span className="text-warm-brown text-sm">{t("passwordLabel")}</span>
        <input
          type="password"
          name="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
        <span className="text-warm-brown/60 mt-1 block text-xs">{t("passwordHint")}</span>
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("confirmPasswordLabel")}</span>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-warm-brown">
        <input type="checkbox" name="acceptTerms" required className="mt-1" />
        <span>
          {t("signUpAcceptTerms")} <span className="text-terracotta">*</span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-warm-brown">
        <input type="checkbox" name="newsletterOptIn" className="mt-1" />
        <span>{t("signUpNewsletter")}</span>
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {t("signUpSubmit")} →
      </Button>
    </form>
  );
}

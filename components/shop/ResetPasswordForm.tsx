"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { resetPassword } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";

export function ResetPasswordForm({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  const [pw, setPw] = useState("");
  return (
    <form
      action={(fd) => start(() => resetPassword(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="text-warm-brown text-sm">{t("newPasswordLabel")}<span aria-hidden="true" className="text-terracotta ml-0.5">*</span></span>
        <input
          type="password"
          name="newPassword"
          required
          minLength={12}
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
        <PasswordStrengthMeter password={pw} />
        <span className="text-warm-brown/60 mt-1 block text-xs">{t("passwordHint")}</span>
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("confirmPasswordLabel")}<span aria-hidden="true" className="text-terracotta ml-0.5">*</span></span>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {t("resetSubmit")} →
      </Button>
    </form>
  );
}

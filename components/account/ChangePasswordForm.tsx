"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { changePassword } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => changePassword(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="block">
        <span className="text-warm-brown text-sm">{t("currentPasswordLabel")}</span>
        <input
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("newPasswordLabel")}</span>
        <input
          type="password"
          name="newPassword"
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
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
      >
        {t("resetSubmit")}
      </Button>
    </form>
  );
}

"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => requestPasswordReset(fd))}
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
      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {t("forgotSubmit")} →
      </Button>
    </form>
  );
}

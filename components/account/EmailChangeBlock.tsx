"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { requestEmailChange } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function EmailChangeBlock({
  locale,
  currentEmail,
  pendingEmail,
}: {
  locale: string;
  currentEmail: string;
  pendingEmail: string | null;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => requestEmailChange(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <div>
        <span className="text-warm-brown text-sm">{t("currentEmailLabel")}</span>
        <p className="text-warm-brown mt-1 font-medium">{currentEmail}</p>
      </div>
      {pendingEmail && (
        <div className="border-honey/40 bg-honey-cream text-warm-brown rounded-md border px-4 py-3 text-sm">
          📬 {t("emailChangePendingHint", { email: pendingEmail })}
        </div>
      )}
      <label className="block">
        <span className="text-warm-brown text-sm">{t("newEmailLabel")}</span>
        <input
          type="email"
          name="newEmail"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
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
      <Button type="submit" disabled={pending} variant="outline">
        {t("emailChangeSubmit")}
      </Button>
    </form>
  );
}

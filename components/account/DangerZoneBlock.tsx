"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { requestAccountDeletion } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function DangerZoneBlock({
  locale,
  hasPassword,
}: {
  locale: string;
  hasPassword: boolean;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => requestAccountDeletion(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <p className="text-warm-brown/80 text-sm">{t("deleteAccountIntro")}</p>
      {hasPassword && (
        <label className="block">
          <span className="text-warm-brown text-sm">{t("currentPasswordLabel")}</span>
          <input
            type="password"
            name="currentPassword"
            required
            autoComplete="current-password"
            className="border-warm-brown/20 focus:border-terracotta focus:ring-terracotta/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
          />
        </label>
      )}
      {!hasPassword && (
        <input type="hidden" name="currentPassword" value="" />
      )}
      <label className="block">
        <span className="text-warm-brown text-sm">
          {t("deleteAccountConfirmHint")}
        </span>
        <input
          type="text"
          name="confirmText"
          required
          pattern="SUPPRIMER"
          autoComplete="off"
          className="border-warm-brown/20 focus:border-terracotta focus:ring-terracotta/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none font-mono"
        />
      </label>
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
        className="border-terracotta text-terracotta hover:bg-terracotta hover:text-cream"
      >
        {t("deleteAccountSubmit")}
      </Button>
    </form>
  );
}

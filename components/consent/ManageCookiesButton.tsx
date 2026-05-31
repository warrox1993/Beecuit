"use client";
import { useTranslations } from "next-intl";
import { useConsent } from "@/components/consent/ConsentProvider";

export function ManageCookiesButton({ className }: { className?: string }) {
  const t = useTranslations("consent");
  const { openPreferences } = useConsent();
  return (
    <button type="button" onClick={openPreferences} className={className}>
      {t("manage")}
    </button>
  );
}

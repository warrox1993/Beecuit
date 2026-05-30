"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { resendEmailVerification } from "@/lib/actions/auth.actions";

export function EmailNotVerifiedBanner({
  locale,
  sent,
}: {
  locale: string;
  sent: boolean;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <div className="border-honey/40 bg-honey-cream text-warm-brown mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
      <span>📬 {t("verifyBannerTitle")}</span>
      {sent ? (
        <span className="text-honey-dark text-xs">{t("verifyBannerSent")}</span>
      ) : (
        <form action={(fd) => start(() => resendEmailVerification(fd))}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            disabled={pending}
            className="text-honey-dark hover:text-warm-brown text-xs font-medium underline disabled:opacity-60"
          >
            {t("verifyBannerResend")}
          </button>
        </form>
      )}
    </div>
  );
}

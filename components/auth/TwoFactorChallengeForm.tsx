"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { verifyTwoFactorChallenge, requestDisable2faEmail } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function TwoFactorChallengeForm({ locale, callbackUrl }: { locale: string; callbackUrl: string | null }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <form action={(fd) => start(() => verifyTwoFactorChallenge(fd))} className="space-y-4" aria-busy={pending || undefined}>
        <input type="hidden" name="locale" value={locale} />
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <label className="block">
          <span className="text-warm-brown text-sm">{t("twoFactorCodeLabel")}</span>
          <input
            type="text"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="123456"
            className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-center text-lg tracking-widest focus:ring-2 focus:outline-none"
          />
        </label>
        <p className="text-warm-brown/60 text-xs">{t("twoFactorRecoveryHint")}</p>
        <Button type="submit" disabled={pending} className="w-full">{t("twoFactorVerify")}</Button>
      </form>
      <form action={(fd) => start(() => requestDisable2faEmail(fd))} className="text-center">
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" disabled={pending} className="text-honey-dark text-xs underline">
          {t("twoFactorLostAccess")}
        </button>
      </form>
    </div>
  );
}

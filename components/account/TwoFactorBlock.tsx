"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  generateTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  regenerateRecoveryCodes,
} from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function TwoFactorBlock({ locale, enabled }: { locale: string; enabled: boolean }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  const [qr, setQr] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(enabled);

  function beginSetup() {
    setError(null);
    start(async () => {
      const res = await generateTwoFactorSetup();
      if (res.ok) setQr(res.qrDataUrl);
      else setError(t(`twoFactorError_${res.error}` as Parameters<typeof t>[0]));
    });
  }

  function submitEnable(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await enableTwoFactor(fd);
      if (res.ok) {
        setCodes(res.recoveryCodes);
        setQr(null);
        setIsEnabled(true);
      } else setError(t(`twoFactorError_${res.error}` as Parameters<typeof t>[0]));
    });
  }

  // State (c): just-generated recovery codes (one-shot view)
  if (codes) {
    return (
      <div className="space-y-4">
        <p className="text-warm-brown text-sm">{t("twoFactorRecoveryCodesIntro")}</p>
        <ul className="bg-cream grid grid-cols-2 gap-2 rounded-md p-4 font-mono text-sm">
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <a
          href={`data:text/plain,${encodeURIComponent(codes.join("\n"))}`}
          download="aufildessaveurs-recovery-codes.txt"
          className="text-honey-dark text-sm underline"
        >
          {t("twoFactorDownloadCodes")}
        </a>
        <Button onClick={() => setCodes(null)} variant="outline" className="block">
          {t("twoFactorDone")}
        </Button>
      </div>
    );
  }

  // State (b): setup wizard (QR shown)
  if (qr) {
    return (
      <form action={submitEnable} className="space-y-4" aria-busy={pending || undefined}>
        <input type="hidden" name="locale" value={locale} />
        <p className="text-warm-brown text-sm">{t("twoFactorScanHint")}</p>
        <Image src={qr} alt="QR" width={200} height={200} className="rounded-md border" unoptimized />
        <label className="block">
          <span className="text-warm-brown text-sm">{t("twoFactorCodeLabel")}</span>
          <input
            type="text"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 tracking-widest focus:ring-2 focus:outline-none"
          />
        </label>
        {error && <p className="text-terracotta text-sm">{error}</p>}
        <Button type="submit" disabled={pending}>{t("twoFactorVerifyEnable")}</Button>
      </form>
    );
  }

  // State (d): enabled
  if (isEnabled) {
    return (
      <div className="space-y-4">
        <p className="text-honey-dark text-sm">✓ {t("twoFactorActive")}</p>
        <form
          action={(fd) =>
            start(async () => {
              const r = await regenerateRecoveryCodes(fd);
              if (r.ok) setCodes(r.recoveryCodes);
              else setError(t(`twoFactorError_${r.error}` as Parameters<typeof t>[0]));
            })
          }
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="text-warm-brown text-sm">{t("currentPasswordLabel")}</span>
            <input type="password" name="password" required autoComplete="current-password" className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block rounded-md border bg-white px-4 py-2 text-sm focus:ring-2 focus:outline-none" />
          </label>
          <Button type="submit" variant="outline" disabled={pending}>{t("twoFactorRegenerate")}</Button>
        </form>
        <form
          action={(fd) =>
            start(async () => {
              const r = await disableTwoFactor(fd);
              if (r.ok) setIsEnabled(false);
              else setError(t(`twoFactorError_${r.error}` as Parameters<typeof t>[0]));
            })
          }
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="text-warm-brown text-sm">{t("currentPasswordLabel")}</span>
            <input type="password" name="password" required autoComplete="current-password" className="border-warm-brown/20 focus:border-terracotta focus:ring-terracotta/30 mt-2 block rounded-md border bg-white px-4 py-2 text-sm focus:ring-2 focus:outline-none" />
          </label>
          <Button type="submit" variant="outline" disabled={pending}>{t("twoFactorDisable")}</Button>
        </form>
        {error && <p className="text-terracotta text-sm">{error}</p>}
      </div>
    );
  }

  // State (a): disabled
  return (
    <div className="space-y-3">
      <p className="text-warm-brown/70 text-sm">{t("twoFactorIntro")}</p>
      {error && <p className="text-terracotta text-sm">{error}</p>}
      <Button onClick={beginSetup} disabled={pending}>{t("twoFactorEnable")}</Button>
    </div>
  );
}

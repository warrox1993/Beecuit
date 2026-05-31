"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  type ConsentState,
} from "@/lib/consent/types";
import { makeConsent, parseConsent, serializeConsent } from "@/lib/consent/cookie";

type ConsentContextValue = {
  consent: ConsentState | null;
  /** false tant que le choix n'est pas fait (et après hydratation) */
  showBanner: boolean;
  prefsOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (o: { analytics: boolean; marketing: boolean }) => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent doit être utilisé dans <ConsentProvider>");
  return ctx;
}

function readConsentCookie(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return entry ? parseConsent(entry.slice(CONSENT_COOKIE.length + 1)) : null;
}

function writeConsentCookie(state: ConsentState): void {
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(state)}; max-age=${CONSENT_MAX_AGE_SECONDS}; path=/; samesite=lax`;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsentCookie());
    setMounted(true);
  }, []);

  const persist = useCallback((o: { analytics: boolean; marketing: boolean }) => {
    const state = makeConsent(o, Date.now());
    writeConsentCookie(state);
    setConsent(state);
    setPrefsOpen(false);
  }, []);

  const value: ConsentContextValue = {
    consent,
    // pas de bandeau au SSR/pré-hydratation (évite le flash) ; apparaît après montage si aucun choix
    showBanner: mounted && consent === null,
    prefsOpen,
    acceptAll: () => persist({ analytics: true, marketing: true }),
    rejectAll: () => persist({ analytics: false, marketing: false }),
    save: persist,
    openPreferences: () => setPrefsOpen(true),
    closePreferences: () => setPrefsOpen(false),
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

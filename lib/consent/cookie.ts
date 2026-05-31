import { CONSENT_VERSION, CONSENT_MAX_AGE_SECONDS, type ConsentState } from "./types";

export function makeConsent(
  opts: { analytics: boolean; marketing: boolean },
  now: number,
): ConsentState {
  return { v: CONSENT_VERSION, analytics: opts.analytics, marketing: opts.marketing, ts: now };
}

export function serializeConsent(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function parseConsent(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const o: unknown = JSON.parse(decodeURIComponent(raw));
    if (typeof o !== "object" || o === null) return null;
    const r = o as Record<string, unknown>;
    if (r.v !== CONSENT_VERSION) return null;
    if (typeof r.analytics !== "boolean" || typeof r.marketing !== "boolean" || typeof r.ts !== "number") {
      return null;
    }
    if (Date.now() - r.ts > CONSENT_MAX_AGE_SECONDS * 1000) return null; // expiré
    return { v: CONSENT_VERSION, analytics: r.analytics, marketing: r.marketing, ts: r.ts };
  } catch {
    return null;
  }
}

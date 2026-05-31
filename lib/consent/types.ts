export type ConsentCategory = "necessary" | "analytics" | "marketing";

export type ConsentState = {
  v: number;
  analytics: boolean;
  marketing: boolean;
  ts: number; // epoch ms du choix
};

export const CONSENT_COOKIE = "cookie_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60; // 6 mois

import { describe, expect, it } from "vitest";
import { parseConsent, serializeConsent, makeConsent } from "@/lib/consent/cookie";
import { CONSENT_VERSION } from "@/lib/consent/types";

const now = 1_780_000_000_000;

describe("consent cookie", () => {
  it("makeConsent produit un état versionné horodaté", () => {
    expect(makeConsent({ analytics: true, marketing: false }, now)).toEqual({
      v: CONSENT_VERSION, analytics: true, marketing: false, ts: now,
    });
  });

  it("serialize → parse round-trip", () => {
    const s = makeConsent({ analytics: true, marketing: true }, now);
    expect(parseConsent(serializeConsent(s))).toEqual(s);
  });

  it("renvoie null si absent / vide", () => {
    expect(parseConsent(undefined)).toBeNull();
    expect(parseConsent("")).toBeNull();
  });

  it("renvoie null si JSON malformé", () => {
    expect(parseConsent("pas-du-json")).toBeNull();
  });

  it("renvoie null si mauvaise version", () => {
    const raw = encodeURIComponent(JSON.stringify({ v: 999, analytics: true, marketing: true, ts: now }));
    expect(parseConsent(raw)).toBeNull();
  });

  it("renvoie null si expiré (> 180 j)", () => {
    const old = Date.now() - 181 * 24 * 60 * 60 * 1000;
    const raw = serializeConsent(makeConsent({ analytics: true, marketing: false }, old));
    expect(parseConsent(raw)).toBeNull();
  });

  it("renvoie null si champs manquants/mauvais type", () => {
    const raw = encodeURIComponent(JSON.stringify({ v: CONSENT_VERSION, analytics: "yes" }));
    expect(parseConsent(raw)).toBeNull();
  });
});

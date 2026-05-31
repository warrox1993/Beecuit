# Consentement cookies « biscuit qui craque » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un gestionnaire de consentement cookies RGPD complet (catégories necessary/analytics/marketing, Tout accepter/Refuser/Personnaliser, cookie 6 mois versionné, réversible) avec un bandeau signature en forme de **biscuit qui se fend en deux + miettes** (animé).

**Architecture:** État de consentement dans un cookie `cookie_consent` (helpers purs testés). Un `ConsentProvider` (context client, monté au layout racine) lit/écrit le cookie et expose `useConsent()`. Le `CookieConsentBanner` (gated « pas encore décidé ») rend `CrackingCookie` (SVG + framer-motion, fallback `prefers-reduced-motion`) + le contenu + un panneau Personnaliser. `ManageCookiesButton` (footer + page /cookies) rouvre les préférences. `ConsentScripts` charge les scripts analytics/marketing seulement si consenti (aucun script réel aujourd'hui, points d'insertion prêts).

**Tech Stack:** Next.js 15 App Router, React 19, next-intl (fr/nl/de/en), framer-motion (déjà présent), TypeScript strict (noUncheckedIndexedAccess), vitest, Tailwind. Repo **pnpm** + `npm run` scripts.

**Spec:** `docs/superpowers/specs/2026-05-31-cookie-consent-design.md`
**Référence visuelle :** `prototype-cookie-banner.html` (racine) — le SVG du biscuit + la chorégraphie sont portés de ce prototype validé.

**Conventions vérifiées :**
- Layout racine `app/[locale]/layout.tsx` enveloppe `NextIntlClientProvider > PageTransition > children`, puis monte `<FlyToCart/>` + `<ToastProvider/>` en `dynamic()` (widgets clients post-hydratation). Le Footer est rendu plus bas (layouts `(shop)`/`(account)`), donc le `ConsentProvider` doit envelopper depuis le layout racine.
- Pattern motion : `"use client"; import { motion, useReducedMotion } from "framer-motion";` (cf. `components/motion/Reveal.tsx`).
- `Button` : `@/components/ui/button` (variants `outline`, etc.) — mais le bandeau utilise des boutons stylés sur-mesure (cohérence avec le prototype). On peut réutiliser `Button` pour « Tout accepter »/« Refuser » si l'API convient.
- `@/` = racine. TS strict : prévoir `!`/gardes sur accès indexés.

---

## File Structure
**Créer :**
- `lib/consent/types.ts` — types + constantes
- `lib/consent/cookie.ts` — `parseConsent`/`serializeConsent`/`makeConsent` (purs)
- `components/consent/ConsentProvider.tsx` — context + lecture/écriture cookie
- `components/consent/CrackingCookie.tsx` — SVG biscuit animé
- `components/consent/CookieConsentBanner.tsx` — bandeau + panneau préférences
- `components/consent/ManageCookiesButton.tsx` — rouvre les préférences
- `components/consent/ConsentScripts.tsx` — scripts gated (vides aujourd'hui)
- `tests/unit/consent-cookie.test.ts`
**Modifier :**
- `app/[locale]/layout.tsx` — monter Provider + Banner + Scripts
- `components/layout/Footer.tsx` — lien « Gérer les cookies »
- page `/cookies` (`app/[locale]/(shop)/cookies/page.tsx` ou via composant) — bouton « Gérer les cookies »
- `messages/{fr,nl,de,en}.json` — namespace `consent`

---

## Task 1 : Types + helpers cookie (purs, testés)

**Files:** Create `lib/consent/types.ts`, `lib/consent/cookie.ts`; Test `tests/unit/consent-cookie.test.ts`

- [ ] **Step 1 : Test qui échoue** — Create `tests/unit/consent-cookie.test.ts`:

```ts
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
```

- [ ] **Step 2 : Lancer (échoue)** — Run: `npx vitest run tests/unit/consent-cookie.test.ts` → FAIL (module introuvable).

- [ ] **Step 3 : Types** — Create `lib/consent/types.ts`:

```ts
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
```

- [ ] **Step 4 : Helpers** — Create `lib/consent/cookie.ts`:

```ts
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
```

- [ ] **Step 5 : Lancer (passe)** — Run: `npx vitest run tests/unit/consent-cookie.test.ts` → PASS (7). `npm run typecheck` → clean.

- [ ] **Step 6 : Commit**
```bash
git add lib/consent tests/unit/consent-cookie.test.ts
git commit -m "feat(consent): cookie state types + pure parse/serialize helpers"
```

---

## Task 2 : ConsentProvider (context client)

**Files:** Create `components/consent/ConsentProvider.tsx`

- [ ] **Step 1 : Implémentation** — Create `components/consent/ConsentProvider.tsx`:

```tsx
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
```

- [ ] **Step 2 : Typecheck** — Run: `npm run typecheck` → clean.

- [ ] **Step 3 : Commit**
```bash
git add components/consent/ConsentProvider.tsx
git commit -m "feat(consent): ConsentProvider context (read/write cookie, showBanner)"
```

---

## Task 3 : CrackingCookie (SVG biscuit animé)

**Files:** Create `components/consent/CrackingCookie.tsx`

Porte le SVG + la chorégraphie du prototype (`prototype-cookie-banner.html`) en React + framer-motion, avec fallback `prefers-reduced-motion`.

- [ ] **Step 1 : Implémentation** — Create `components/consent/CrackingCookie.tsx`:

```tsx
"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const LEFT_PATH =
  "M0,-60 A60,60 0 0,0 0,60 L6,45 L-5,30 L5,15 L-6,0 L5,-15 L-5,-30 L6,-45 Z";
const RIGHT_PATH =
  "M0,-60 A60,60 0 0,1 0,60 L6,45 L-5,30 L5,15 L-6,0 L5,-15 L-5,-30 L6,-45 Z";
const ARC_LEFT = "M0,-60 A60,60 0 0,0 0,60";
const ARC_RIGHT = "M0,-60 A60,60 0 0,1 0,60";

type Crumb = { id: number; x: number; size: number; dx: number; dy: number; rot: number; delay: number; dur: number };

export function CrackingCookie({ size = 132 }: { size?: number }) {
  const reduce = useReducedMotion();

  // Miettes générées une fois, côté client (le composant ne rend qu'après montage).
  const crumbs = useMemo<Crumb[]>(() => {
    if (reduce) return [];
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      x: Math.random() * 22 - 11,
      size: 3 + Math.random() * 4,
      dx: Math.random() * 46 - 23,
      dy: 40 + Math.random() * 46,
      rot: Math.random() * 180 - 90,
      delay: 0.98 + Math.random() * 0.12,
      dur: 0.65 + Math.random() * 0.45,
    }));
  }, [reduce]);

  const drop = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
    : {
        initial: { opacity: 0, y: -46, rotate: -8 },
        animate: { opacity: 1, y: 0, rotate: 0 },
        transition: { type: "spring" as const, stiffness: 320, damping: 16, delay: 0.12 },
      };

  const halfTransition = { duration: 0.7, ease: [0.3, 0.7, 0.3, 1] as const, delay: 0.8 };

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <motion.svg
        viewBox="-72 -72 144 144"
        width={size}
        height={size}
        style={{ overflow: "visible", display: "block" }}
        aria-hidden
        initial={drop.initial}
        animate={drop.animate}
        transition={drop.transition}
      >
        <defs>
          <radialGradient id="cc-dough" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#eabf72" />
            <stop offset="55%" stopColor="#d59a3e" />
            <stop offset="100%" stopColor="#a9731f" />
          </radialGradient>
          <radialGradient id="cc-doughR" cx="58%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#e7ba6a" />
            <stop offset="55%" stopColor="#cf9339" />
            <stop offset="100%" stopColor="#a06d1d" />
          </radialGradient>
          <filter id="cc-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3d2817" floodOpacity="0.28" />
          </filter>
        </defs>

        <ellipse cx="0" cy="60" rx="46" ry="8" fill="#3d2817" opacity="0.12" />

        <g filter="url(#cc-soft)">
          <motion.g
            initial={reduce ? undefined : { x: 0, y: 0, rotate: 0 }}
            animate={reduce ? undefined : { x: -13, y: 4, rotate: -7 }}
            transition={halfTransition}
          >
            <path d={LEFT_PATH} fill="url(#cc-dough)" stroke="#7a5320" strokeWidth="2.5" strokeLinejoin="round" />
            <path d={ARC_LEFT} fill="none" stroke="#f3d49a" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
            <ellipse cx="-30" cy="-18" rx="7" ry="6" fill="#5a371a" />
            <ellipse cx="-18" cy="22" rx="6" ry="5.5" fill="#4a2c14" />
            <ellipse cx="-40" cy="14" rx="5" ry="4.5" fill="#5a371a" />
            <ellipse cx="-22" cy="-40" rx="4.5" ry="4" fill="#4a2c14" />
            <circle cx="-12" cy="-8" r="1.4" fill="#fbe7c0" opacity="0.8" />
            <circle cx="-34" cy="-2" r="1.2" fill="#fbe7c0" opacity="0.7" />
          </motion.g>

          <motion.g
            initial={reduce ? undefined : { x: 0, y: 0, rotate: 0 }}
            animate={reduce ? undefined : { x: 13, y: 5, rotate: 7 }}
            transition={halfTransition}
          >
            <path d={RIGHT_PATH} fill="url(#cc-doughR)" stroke="#7a5320" strokeWidth="2.5" strokeLinejoin="round" />
            <path d={ARC_RIGHT} fill="none" stroke="#f3d49a" strokeWidth="2" opacity="0.45" strokeLinecap="round" />
            <ellipse cx="30" cy="-22" rx="7" ry="6" fill="#5a371a" />
            <ellipse cx="20" cy="20" rx="6" ry="5.5" fill="#4a2c14" />
            <ellipse cx="40" cy="6" rx="5" ry="4.5" fill="#5a371a" />
            <ellipse cx="26" cy="44" rx="4.5" ry="4" fill="#4a2c14" />
            <circle cx="16" cy="-6" r="1.4" fill="#fbe7c0" opacity="0.8" />
            <circle cx="34" cy="-12" r="1.2" fill="#fbe7c0" opacity="0.7" />
          </motion.g>
        </g>
      </motion.svg>

      {crumbs.map((c) => (
        <motion.span
          key={c.id}
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "62%",
            width: c.size,
            height: c.size,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #c98f3f, #8a5f16)",
            marginLeft: c.x,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: c.dx, y: c.dy, opacity: 0, rotate: c.rot }}
          transition={{ delay: c.delay, duration: c.dur, ease: [0.3, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2 : Typecheck** — Run: `npm run typecheck` → clean.

- [ ] **Step 3 : Commit**
```bash
git add components/consent/CrackingCookie.tsx
git commit -m "feat(consent): CrackingCookie animated SVG (framer-motion, reduced-motion fallback)"
```

---

## Task 4 : CookieConsentBanner (bandeau + panneau préférences)

**Files:** Create `components/consent/CookieConsentBanner.tsx`

- [ ] **Step 1 : Implémentation** — Create `components/consent/CookieConsentBanner.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useConsent } from "@/components/consent/ConsentProvider";
import { CrackingCookie } from "@/components/consent/CrackingCookie";

export function CookieConsentBanner() {
  const t = useTranslations("consent");
  const { showBanner, prefsOpen, acceptAll, rejectAll, save, openPreferences, closePreferences } = useConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const visible = showBanner || prefsOpen;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          role="dialog"
          aria-label={t("title")}
          aria-modal={prefsOpen || undefined}
        >
          <div className="border-honey/20 grid w-full max-w-[620px] grid-cols-[132px_1fr] items-center gap-x-6 gap-y-2 overflow-hidden rounded-[22px] border bg-[linear-gradient(180deg,#fffdf9,#fdf7ec)] p-5 shadow-[0_18px_50px_-12px_rgba(61,40,23,.30)] max-sm:grid-cols-1 max-sm:justify-items-center max-sm:text-center">
            <div className="row-span-2 justify-self-center max-sm:row-span-1">
              <CrackingCookie />
            </div>

            <div>
              <p className="text-honey-dark text-[11px] font-semibold tracking-[0.18em] uppercase">
                {t("eyebrow")}
              </p>
              <h2 className="text-warm-brown mt-1 text-lg font-semibold">{t("title")}</h2>
              <p className="text-warm-brown/70 mt-1.5 text-sm leading-relaxed">
                {t("description")}{" "}
                <Link href="/cookies" className="text-honey-dark underline">
                  {t("learnMore")}
                </Link>
              </p>

              {!prefsOpen ? (
                <div className="mt-3.5 flex flex-wrap gap-2.5 max-sm:justify-center">
                  <button onClick={acceptAll} className="bg-honey text-cream hover:bg-honey-dark rounded-full px-4 py-2 text-sm font-semibold">
                    {t("acceptAll")}
                  </button>
                  <button onClick={rejectAll} className="border-warm-brown/20 text-warm-brown hover:bg-honey/5 rounded-full border px-4 py-2 text-sm font-semibold">
                    {t("reject")}
                  </button>
                  <button onClick={openPreferences} className="text-honey-dark px-2 py-2 text-sm font-semibold underline">
                    {t("customize")}
                  </button>
                </div>
              ) : (
                <div className="mt-3.5">
                  <ul className="space-y-2">
                    <li className="text-warm-brown/80 flex items-center justify-between gap-3 text-sm">
                      <span>{t("catNecessary")}</span>
                      <span className="text-warm-brown/40 text-xs">{t("alwaysOn")}</span>
                    </li>
                    <li className="text-warm-brown/80 flex items-center justify-between gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                        {t("catAnalytics")}
                      </label>
                    </li>
                    <li className="text-warm-brown/80 flex items-center justify-between gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                        {t("catMarketing")}
                      </label>
                    </li>
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2.5 max-sm:justify-center">
                    <button onClick={() => save({ analytics, marketing })} className="bg-honey text-cream hover:bg-honey-dark rounded-full px-4 py-2 text-sm font-semibold">
                      {t("save")}
                    </button>
                    <button onClick={closePreferences} className="text-warm-brown/60 px-2 py-2 text-sm underline">
                      {t("back")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2 : Typecheck + lint** — `npm run typecheck` clean ; `npm run lint` 0 erreur (⚠️ apostrophes françaises éventuelles : ici le texte vient d'i18n via `t()`, pas de littéral JSX, donc pas de souci `react/no-unescaped-entities`).

- [ ] **Step 3 : Commit**
```bash
git add components/consent/CookieConsentBanner.tsx
git commit -m "feat(consent): CookieConsentBanner + preferences panel"
```

---

## Task 5 : ManageCookiesButton + ConsentScripts

**Files:** Create `components/consent/ManageCookiesButton.tsx`, `components/consent/ConsentScripts.tsx`

- [ ] **Step 1 : ManageCookiesButton** — Create `components/consent/ManageCookiesButton.tsx`:

```tsx
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
```

- [ ] **Step 2 : ConsentScripts** — Create `components/consent/ConsentScripts.tsx`:

```tsx
"use client";
import { useConsent } from "@/components/consent/ConsentProvider";

/**
 * Charge les scripts non-essentiels UNIQUEMENT après consentement.
 * Aujourd'hui aucun script réel : points d'insertion prêts pour le jour où
 * un outil (Google Analytics, Vercel Analytics, pixel Meta) sera ajouté.
 */
export function ConsentScripts() {
  const { consent } = useConsent();
  return (
    <>
      {consent?.analytics ? (
        // ← Insérer ici le script d'analytics (ex. <Script src=".../gtag.js" /> + init)
        null
      ) : null}
      {consent?.marketing ? (
        // ← Insérer ici le pixel marketing (ex. Meta Pixel)
        null
      ) : null}
    </>
  );
}
```

- [ ] **Step 3 : Typecheck** — `npm run typecheck` → clean.

- [ ] **Step 4 : Commit**
```bash
git add components/consent/ManageCookiesButton.tsx components/consent/ConsentScripts.tsx
git commit -m "feat(consent): ManageCookiesButton + gated ConsentScripts (ready for analytics)"
```

---

## Task 6 : i18n `consent.*` (×4 locales)

**Files:** Modify `messages/{fr,nl,de,en}.json`

- [ ] **Step 1 : Ajouter le namespace `consent`** au premier niveau (sibling de `nav`, `legal`…). FR (`messages/fr.json`) :

```json
"consent": {
  "eyebrow": "Au Fil des Saveurs · cookies",
  "title": "On utilise quelques cookies 🍪",
  "description": "Les essentiels font tourner la boutique (panier, connexion). Avec ton accord, on aimerait aussi mesurer l'audience.",
  "learnMore": "En savoir plus",
  "acceptAll": "Tout accepter",
  "reject": "Refuser",
  "customize": "Personnaliser",
  "save": "Enregistrer mes choix",
  "back": "Retour",
  "manage": "Gérer les cookies",
  "alwaysOn": "Toujours actif",
  "catNecessary": "Strictement nécessaires",
  "catAnalytics": "Mesure d'audience",
  "catMarketing": "Marketing"
}
```

EN (`messages/en.json`) :
```json
"consent": {
  "eyebrow": "Au Fil des Saveurs · cookies",
  "title": "We use a few cookies 🍪",
  "description": "The essential ones keep the shop running (cart, sign-in). With your consent, we'd also like to measure traffic.",
  "learnMore": "Learn more",
  "acceptAll": "Accept all",
  "reject": "Reject",
  "customize": "Customise",
  "save": "Save my choices",
  "back": "Back",
  "manage": "Manage cookies",
  "alwaysOn": "Always on",
  "catNecessary": "Strictly necessary",
  "catAnalytics": "Analytics",
  "catMarketing": "Marketing"
}
```

NL (`messages/nl.json`) et DE (`messages/de.json`) : mêmes clés, traduction naturelle (NL je/jouw ; DE du/dein). Repères : NL title "We gebruiken een paar cookies 🍪", manage "Cookies beheren", acceptAll "Alles accepteren", reject "Weigeren", customize "Aanpassen". DE title "Wir verwenden ein paar Cookies 🍪", manage "Cookies verwalten", acceptAll "Alle akzeptieren", reject "Ablehnen", customize "Anpassen". Garder le même jeu de clés dans les 4 fichiers.

- [ ] **Step 2 : Valider** — Run:
```
node -e "['fr','nl','de','en'].forEach(l=>{const m=require('./messages/'+l+'.json'); if(!m.consent||!m.consent.acceptAll||!m.consent.manage) throw new Error('consent manquant '+l)}); console.log('ok')"
```
Expected: `ok`.

- [ ] **Step 3 : Commit**
```bash
git add messages
git commit -m "i18n(consent): cookie banner keys (4 locales)"
```

---

## Task 7 : Montage (layout + footer + page /cookies)

**Files:** Modify `app/[locale]/layout.tsx`, `components/layout/Footer.tsx`, `app/[locale]/(shop)/cookies/page.tsx`

- [ ] **Step 1 : Monter Provider + Banner + Scripts dans le layout racine** — In `app/[locale]/layout.tsx`, add the dynamic imports next to the existing ones:

```tsx
const CookieConsentBanner = dynamic(() =>
  import("@/components/consent/CookieConsentBanner").then((m) => ({ default: m.CookieConsentBanner })),
);
const ConsentScripts = dynamic(() =>
  import("@/components/consent/ConsentScripts").then((m) => ({ default: m.ConsentScripts })),
);
```

And import the provider (static, it provides context):
```tsx
import { ConsentProvider } from "@/components/consent/ConsentProvider";
```

Wrap the returned tree with `<ConsentProvider>` and render the banner + scripts inside it:
```tsx
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ConsentProvider>
        <PageTransition>{children}</PageTransition>
        <FlyToCart />
        <ToastProvider />
        <CookieConsentBanner />
        <ConsentScripts />
      </ConsentProvider>
    </NextIntlClientProvider>
  );
```

- [ ] **Step 2 : Lien dans le Footer** — In `components/layout/Footer.tsx`, near the existing legal links (cgv/mentions/confidentialite/cookies), add a `ManageCookiesButton` styled like the other footer links. First add the import:

```tsx
import { ManageCookiesButton } from "@/components/consent/ManageCookiesButton";
```

Then in the legal-links list (next to the `/cookies` `<Link>`), add an `<li>`:
```tsx
<li>
  <ManageCookiesButton className="hover:text-honey-dark transition-colors" />
</li>
```

(Footer is a server component but `ManageCookiesButton` is a client component — that's fine; ensure the surrounding list markup matches the existing `<li><Link>…</Link></li>` pattern. The Footer is rendered under the root layout, so it is inside `<ConsentProvider>`.)

- [ ] **Step 3 : Bouton sur la page /cookies** — In `app/[locale]/(shop)/cookies/page.tsx`, the page renders `<LegalPage pageKey="cookies" … />`. Add a `ManageCookiesButton` below it so visitors can reopen preferences from the policy page. Wrap the return:

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { ManageCookiesButton } from "@/components/consent/ManageCookiesButton";
import { Container } from "@/components/ui-primitives/Container";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.seo.cookies" });
  return { title: t("title"), description: t("description") };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LegalPage pageKey="cookies" locale={locale} />
      <Container variant="narrow" className="pb-12">
        <ManageCookiesButton className="bg-honey text-cream hover:bg-honey-dark rounded-full px-5 py-2.5 text-sm font-semibold" />
      </Container>
    </>
  );
}
```

(Confirm the current `cookies/page.tsx` content first and merge minimally — keep `generateMetadata` as-is, only add the `ManageCookiesButton` under `LegalPage`.)

- [ ] **Step 4 : Typecheck + lint** — `npm run typecheck` clean ; `npm run lint` 0 erreur.

- [ ] **Step 5 : Commit**
```bash
git add "app/[locale]/layout.tsx" components/layout/Footer.tsx "app/[locale]/(shop)/cookies/page.tsx"
git commit -m "feat(consent): mount provider/banner/scripts + manage links (footer + /cookies)"
```

---

## Task 8 : Vérification finale (+ smoke navigateur)

- [ ] **Step 1 : Suite unitaire + typecheck + lint**

Run: `npx dotenv -e .env.local -- npx vitest run` → tous verts (dont `consent-cookie.test.ts`).
Run: `npm run typecheck` (clean) ; `npm run lint` (0 erreur, warnings pré-existants OK).

- [ ] **Step 2 : Smoke navigateur (e2e léger, sans DB)** — Create `tests/e2e/cookie-consent.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("le bandeau cookies apparaît, puis disparaît après Refuser et ne revient pas", async ({ page }) => {
  await page.goto("/fr");
  const banner = page.getByRole("dialog", { name: /cookies/i });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: /Refuser/i }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole("dialog", { name: /cookies/i })).toBeHidden();
});

test("« Gérer les cookies » rouvre les préférences", async ({ page, context }) => {
  // pré-consentir pour masquer le bandeau initial
  await context.addCookies([{
    name: "cookie_consent",
    value: encodeURIComponent(JSON.stringify({ v: 1, analytics: false, marketing: false, ts: Date.now() })),
    url: "http://localhost:3000",
  }]);
  await page.goto("/fr");
  await page.getByRole("button", { name: /Gérer les cookies/i }).first().click();
  await expect(page.getByRole("button", { name: /Enregistrer mes choix/i })).toBeVisible();
});
```

Run (best-effort, démarre le serveur dev ; ne dépend pas de la DB) : `npx playwright test cookie-consent`. Si l'environnement bloque le serveur, noter que les specs sont écrites/committées.

- [ ] **Step 3 : Commit**
```bash
git add tests/e2e/cookie-consent.spec.ts
git commit -m "test(e2e): cookie consent banner show/reject/reopen"
```

---

## Self-Review

**Couverture du spec :**

| Section spec | Tâche |
|---|---|
| Types + constantes (cookie, version, 6 mois) | T1 |
| `parseConsent`/`serializeConsent`/`makeConsent` + tests (malformé/version/expiré) | T1 |
| `ConsentProvider` (lecture/écriture cookie, showBanner, acceptAll/rejectAll/save/openPreferences) | T2 |
| `CrackingCookie` (SVG porté du prototype, framer-motion, fallback reduced-motion, miettes) | T3 |
| `CookieConsentBanner` (contenu + actions accept/reject/customize + panneau catégories) | T4 |
| `ManageCookiesButton` + `ConsentScripts` (gated, points d'insertion) | T5 |
| i18n `consent.*` ×4 | T6 |
| Montage layout + footer + /cookies | T7 |
| Vérif + e2e | T8 |

Pas de gap.

**Scan placeholders :** Les « ← insérer … » de `ConsentScripts` (T5) sont **intentionnels** (points d'insertion documentés pour l'analytics futur — décision validée, hors scope), pas du code manquant. Les traductions NL/DE (T6) sont des transformations définies du FR/EN fournis. Pas d'autre placeholder.

**Cohérence des types :**
- `ConsentState { v, analytics, marketing, ts }` — T1, utilisé partout.
- `useConsent(): { consent, showBanner, prefsOpen, acceptAll, rejectAll, save, openPreferences, closePreferences }` — défini T2, consommé T4/T5.
- `makeConsent(opts, now)` / `parseConsent(raw)` / `serializeConsent(state)` — T1, utilisés T2.
- `CrackingCookie` (prop `size?`) — T3, utilisé T4.
- `consent.*` clés i18n référencées T4/T5 toutes définies T6.

Pas de dérive.

---

## Execution Handoff

**Plan complet et sauvegardé dans `docs/superpowers/plans/2026-05-31-cookie-consent.md`. Deux options :**

**1. Subagent-Driven (recommandé)** — un subagent frais par tâche, revue spec + qualité ; un agent design pour fignoler l'animation (T3/T4).

**2. Inline** — exécution dans cette session avec checkpoints.

Laquelle ?

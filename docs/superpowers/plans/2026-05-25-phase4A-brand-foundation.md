# Phase 4A — Brand Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pose les fondations de la marque "Au Fil des Saveurs" : palette CSS vars enrichie + tokens sémantiques, ajout Pinyon Script, composant Logo SVG placeholder à 3 variantes, et renommage complet "BeeCuit" → "Au Fil des Saveurs" dans tout le code applicatif (translations, composants, emails, infra). Aucune régression visuelle attendue.

**Architecture:** Additif d'abord (nouvelles couleurs, font, composant Logo) sans toucher aux composants existants ; rename ensuite, fichier par fichier, avec validation grep. Tokens sémantiques (`text-text-primary`, `bg-surface-elevated`, etc.) introduits comme couche au-dessus des couleurs brutes existantes — les composants actuels gardent leurs classes Tailwind, les futurs composants (4B+) utiliseront les tokens.

**Tech Stack:** Next.js 15 App Router · Tailwind v4 (CSS vars @theme inline) · next/font/google (Pinyon Script + Fraunces) · next-intl v4 · React Email templates · React SVG inline.

**Spec :** `docs/superpowers/specs/2026-05-25-phase4A-brand-foundation-design.md`
**Roadmap :** `docs/superpowers/specs/2026-05-25-phase4-visual-overhaul-roadmap.md`

**Working directory :** `C:\Users\jeanb\Documents\WebAPP\BeeCuit` (Windows, PowerShell — use bash via Bash tool pour les boucles shell)

**Package manager :** pnpm

---

## Prerequisites

- [x] Repo état Phase 2 final (commit `90f5e8b`), build clean, 51 tests passants.
- [x] Spec 4A + roadmap committées dans `docs/superpowers/specs/`.

---

## File structure produced

```
au-fil-des-saveurs/                          # renommé depuis beecuit
├── app/
│   ├── layout.tsx                           # MODIFIED: ajouter Pinyon Script next/font
│   └── globals.css                          # MODIFIED: nouvelles couleurs + tokens sémantiques + var --font-pinyon
├── components/
│   ├── brand/
│   │   ├── Logo.tsx                         # NEW: composant SVG 3 variantes
│   │   └── Logo.test.tsx                    # NEW: smoke render test
│   ├── layout/
│   │   ├── Header.tsx                       # MODIFIED: <Logo variant="wordmark"> + rename strings
│   │   ├── Footer.tsx                       # MODIFIED: <Logo> + rename copyright/mentions
│   │   └── MobileNav.tsx                    # MODIFIED: branding header mobile
│   ├── home/
│   │   ├── CoffretsTeaser.tsx               # MODIFIED: rename copy
│   │   └── InstagramGrid.tsx                # MODIFIED: rename copy
│   ├── shop/
│   │   └── CheckoutForm.tsx                 # MODIFIED: rename copy
│   └── admin/
│       └── AdminSidebar.tsx                 # MODIFIED: rename branding
├── messages/
│   ├── fr.json                              # MODIFIED: rename toutes occurrences
│   ├── nl.json                              # MODIFIED: idem
│   ├── en.json                              # MODIFIED: idem
│   └── de.json                              # MODIFIED: idem
├── app/[locale]/(shop)/
│   ├── entreprises/page.tsx                 # MODIFIED: rename
│   ├── abonnement/page.tsx                  # MODIFIED: rename
│   └── cartes-cadeaux/page.tsx              # MODIFIED: rename
├── lib/email/
│   ├── send-b2b.ts                          # MODIFIED: rename sender name
│   └── templates/
│       ├── OrderConfirmation.tsx            # MODIFIED: rename
│       ├── OrderShipped.tsx                 # MODIFIED: rename
│       ├── GiftCardDelivery.tsx             # MODIFIED: rename
│       ├── B2BCustomerQuote.tsx             # MODIFIED: rename
│       ├── B2BAdminNotification.tsx         # MODIFIED: rename
│       ├── B2BPaymentConfirmation.tsx       # MODIFIED: rename
│       ├── B2BQuoteRejected.tsx             # MODIFIED: rename
│       ├── SubscriptionWelcome.tsx          # MODIFIED: rename
│       ├── SubscriptionBoxComposing.tsx     # MODIFIED: rename
│       ├── SubscriptionBoxReminder.tsx      # MODIFIED: rename
│       └── SubscriptionBoxShipped.tsx       # MODIFIED: rename
├── scripts/
│   ├── seed-coffrets.mjs                    # MODIFIED: rename product names
│   ├── seed-gift-card-products.mjs          # MODIFIED: rename product names
│   └── create-stripe-subscription-prices.mjs # MODIFIED: rename
├── package.json                             # MODIFIED: name → "au-fil-des-saveurs"
├── README.md                                # MODIFIED: titre + mentions
└── docs/
    └── style-guide.md                       # NEW: règles d'usage typo + palette
```

Total : **2 nouveaux fichiers + 1 doc, ~28 fichiers modifiés.**

---

## Task 1: Update globals.css — nouvelles couleurs brutes + tokens sémantiques

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1.1: Read current `app/globals.css`** pour repérer le bloc `@theme inline` existant.

Run: `head -80 app/globals.css`
Expected: voir le bloc `@theme inline { --color-honey: ...; ... }`.

- [ ] **Step 1.2: Ajouter 3 nouvelles couleurs brutes au bloc `@theme inline`**

Dans `app/globals.css`, dans le `@theme inline` existant, après la ligne `--color-leaf: #708b58;` (ou en fin de bloc), ajouter :

```css
  /* NEW for Au Fil des Saveurs brand */
  --color-brand-chocolate: #2c1810;
  --color-cream-gold: #c9a368;
  --color-cream-light: #fdfaf3;
```

- [ ] **Step 1.3: Ajouter le bloc tokens sémantiques**

Toujours dans le même `@theme inline`, après les couleurs brutes, ajouter :

```css
  /* Semantic tokens — preferred for new components */
  --color-surface: var(--color-cream);
  --color-surface-elevated: var(--color-cream-light);
  --color-surface-inverse: var(--color-brand-chocolate);

  --color-text-primary: var(--color-warm-brown);
  --color-text-muted: rgb(74 51 42 / 0.7);
  --color-text-inverse: var(--color-cream-gold);
  --color-text-accent: var(--color-honey-dark);

  --color-border-subtle: rgb(74 51 42 / 0.1);
  --color-border-accent: var(--color-honey-dark);

  --color-cta-primary: var(--color-honey-dark);
  --color-cta-primary-hover: var(--color-brand-chocolate);
  --color-cta-secondary: var(--color-warm-brown);

  --color-accent-feminine: var(--color-soft-rose);
  --color-accent-gold: var(--color-cream-gold);
```

**Note :** ne PAS toucher aux couleurs existantes (`--color-cream`, `--color-honey`, etc.) — les composants actuels les utilisent encore via `bg-cream`, `text-warm-brown`, etc.

- [ ] **Step 1.4: Vérifier que Tailwind compile sans erreur**

Run: `pnpm tsc --noEmit && pnpm build 2>&1 | tail -10`
Expected: build success, page sizes inchangées vs avant.

- [ ] **Step 1.5: Smoke visuel rapide**

Run: `pnpm dev` en background, ouvrir `http://localhost:3000/fr` (ou port disponible) → la page doit s'afficher exactement comme avant (les nouvelles couleurs sont disponibles mais pas encore utilisées).

- [ ] **Step 1.6: Commit**

```bash
git add app/globals.css
git commit -m "feat(phase4A): add brand-chocolate, cream-gold, cream-light colors + semantic tokens"
```

---

## Task 2: Ajouter Pinyon Script (Google Fonts) + utility `font-script`

**Files:**
- Modify: `app/layout.tsx` (ou `app/[locale]/layout.tsx` selon où Fraunces est déjà chargé)
- Modify: `app/globals.css`

- [ ] **Step 2.1: Localiser où Fraunces est chargé**

Run: `grep -rn "Fraunces\|font-fraunces\|next/font" app/ 2>/dev/null | head -5`
Expected: une ligne avec `import { Fraunces } from "next/font/google"` quelque part dans `app/layout.tsx` ou similaire.

- [ ] **Step 2.2: Ajouter import Pinyon Script à côté de Fraunces**

Dans le même fichier (ex: `app/layout.tsx`), modifier l'import :

```tsx
import { Fraunces, Pinyon_Script } from "next/font/google";
```

Et ajouter la déclaration de font sous celle de Fraunces :

```tsx
const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pinyon",
  display: "swap",
});
```

- [ ] **Step 2.3: Appliquer la classe variable au `<html>` ou `<body>`**

Trouver le `<html>` ou `<body>` qui a déjà `fraunces.variable` et ajouter `${pinyonScript.variable}` :

Exemple avant :
```tsx
<html lang={locale} className={fraunces.variable}>
```

Après :
```tsx
<html lang={locale} className={`${fraunces.variable} ${pinyonScript.variable}`}>
```

- [ ] **Step 2.4: Ajouter la var dans globals.css `@theme inline`**

Dans `app/globals.css`, dans le bloc `@theme inline`, après `--font-display`, ajouter :

```css
  --font-script: var(--font-pinyon), "Brush Script MT", "Lucida Handwriting", cursive;
```

- [ ] **Step 2.5: Ajouter une utility class Tailwind `.font-script`**

Toujours dans `app/globals.css`, après le bloc `@theme inline` (ou dans un `@layer utilities` existant), ajouter :

```css
@layer utilities {
  .font-script {
    font-family: var(--font-script);
    font-weight: 400;
  }
}
```

- [ ] **Step 2.6: Vérifier que la font se charge**

Run: `pnpm build 2>&1 | grep -i "pinyon\|font" | head -5`
Expected: aucune erreur. Build success.

Run dev server + ouvrir browser DevTools → Network → filter "font" → vérifier qu'un fichier Pinyon Script woff2 est téléchargé.

- [ ] **Step 2.7: Smoke test rapide — ajouter temporairement un mot script visible**

Dans `components/home/Hero.tsx`, repérer le `<Heading as="h1" size="display">` qui contient `t("heroTitle")`. Ajouter temporairement (sera retiré en Phase 4B) :

```tsx
<span className="font-script text-honey-dark text-5xl block mt-2">Saveurs</span>
```

Run dev, vérifier que le mot apparaît en calligraphie élégante. Puis RETIRER cette ligne (ne pas commit).

- [ ] **Step 2.8: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat(phase4A): load Pinyon Script via next/font + add font-script utility"
```

> Si l'ajout de la font est dans `app/[locale]/layout.tsx` au lieu de `app/layout.tsx`, adapter le `git add` en conséquence.

---

## Task 3: Créer composant `<Logo>` SVG à 3 variantes

**Files:**
- Create: `components/brand/Logo.tsx`
- Create: `components/brand/Logo.test.tsx`

- [ ] **Step 3.1: Créer le dossier + le fichier test (TDD)**

Run: `mkdir -p components/brand`

Créer `components/brand/Logo.test.tsx` :

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders 'full' variant by default with all 3 text blocks", () => {
    const { container, getByText } = render(<Logo />);
    expect(container.querySelector("svg")).toBeDefined();
    expect(getByText(/AU FIL DES/i)).toBeDefined();
    expect(getByText(/Saveurs/i)).toBeDefined();
    expect(getByText(/BISCUITERIE/i)).toBeDefined();
  });

  it("renders 'wordmark' variant without baseline", () => {
    const { queryByText, getByText } = render(<Logo variant="wordmark" />);
    expect(getByText(/AU FIL DES/i)).toBeDefined();
    expect(getByText(/Saveurs/i)).toBeDefined();
    expect(queryByText(/BISCUITERIE/i)).toBeNull();
  });

  it("renders 'mark' variant with only the chef toque icon", () => {
    const { container, queryByText } = render(<Logo variant="mark" />);
    expect(container.querySelector("svg")).toBeDefined();
    expect(queryByText(/AU FIL DES/i)).toBeNull();
    expect(queryByText(/Saveurs/i)).toBeNull();
  });

  it("accepts a className prop", () => {
    const { container } = render(<Logo className="h-12 text-honey-dark" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("h-12");
  });

  it("has accessible attributes (role + aria-label)", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toContain("Au Fil des Saveurs");
  });
});
```

- [ ] **Step 3.2: Run tests, expect FAIL (module not found)**

Run: `pnpm vitest run components/brand/Logo.test.tsx 2>&1 | tail -10`
Expected: FAIL — `Cannot find module './Logo'`.

- [ ] **Step 3.3: Vérifier que @testing-library/react est dispo**

Run: `grep -E '@testing-library/react' package.json`

Si présent : OK passer au step suivant.
Si absent : `pnpm add -D @testing-library/react @testing-library/dom jsdom` puis vérifier le `vitest.config.ts` pour `environment: 'jsdom'`.

- [ ] **Step 3.4: Créer `components/brand/Logo.tsx`**

```tsx
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "wordmark" | "mark";
  className?: string;
};

export function Logo({ variant = "full", className }: LogoProps) {
  if (variant === "mark") {
    return <LogoMark className={className} />;
  }
  if (variant === "wordmark") {
    return <LogoWordmark className={className} />;
  }
  return <LogoFull className={className} />;
}

function LogoFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Au Fil des Saveurs — Biscuiterie Fine & Gourmet"
      className={cn("inline-block", className)}
    >
      <title>Au Fil des Saveurs</title>
      <ChefToque cx={120} cy={50} size={28} stroke="currentColor" />
      <text
        x={120}
        y={108}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={20}
        letterSpacing={6}
        fill="currentColor"
      >
        AU FIL DES
      </text>
      <text
        x={120}
        y={158}
        textAnchor="middle"
        fontFamily="var(--font-script)"
        fontSize={56}
        fontStyle="italic"
        fill="currentColor"
      >
        Saveurs
      </text>
      <text
        x={120}
        y={196}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={11}
        letterSpacing={4}
        fillOpacity={0.7}
        fill="currentColor"
      >
        BISCUITERIE FINE
      </text>
      <text
        x={120}
        y={212}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={11}
        letterSpacing={4}
        fillOpacity={0.7}
        fill="currentColor"
      >
        & GOURMET
      </text>
    </svg>
  );
}

function LogoWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 90"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Au Fil des Saveurs"
      className={cn("inline-block", className)}
    >
      <title>Au Fil des Saveurs</title>
      <text
        x={140}
        y={32}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={20}
        letterSpacing={6}
        fill="currentColor"
      >
        AU FIL DES
      </text>
      <text
        x={140}
        y={78}
        textAnchor="middle"
        fontFamily="var(--font-script)"
        fontSize={52}
        fontStyle="italic"
        fill="currentColor"
      >
        Saveurs
      </text>
    </svg>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Au Fil des Saveurs"
      className={cn("inline-block", className)}
    >
      <title>Au Fil des Saveurs</title>
      <circle cx={32} cy={32} r={30} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <ChefToque cx={32} cy={32} size={18} stroke="currentColor" />
    </svg>
  );
}

function ChefToque({
  cx,
  cy,
  size,
  stroke,
}: {
  cx: number;
  cy: number;
  size: number;
  stroke: string;
}) {
  // hatband
  const bandW = size * 1.6;
  const bandH = size * 0.4;
  const puffR = size * 0.55;
  return (
    <g fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
      <rect
        x={cx - bandW / 2}
        y={cy + size * 0.15}
        width={bandW}
        height={bandH}
        rx={1}
      />
      <circle cx={cx} cy={cy - size * 0.4} r={puffR} />
      <circle cx={cx - puffR * 0.85} cy={cy - size * 0.1} r={puffR * 0.8} />
      <circle cx={cx + puffR * 0.85} cy={cy - size * 0.1} r={puffR * 0.8} />
    </g>
  );
}
```

- [ ] **Step 3.5: Run tests, expect PASS**

Run: `pnpm vitest run components/brand/Logo.test.tsx 2>&1 | tail -10`
Expected: 5 tests PASS.

- [ ] **Step 3.6: Type-check**

Run: `pnpm tsc --noEmit 2>&1 | tail -5`
Expected: 0 errors.

- [ ] **Step 3.7: Commit**

```bash
git add components/brand/Logo.tsx components/brand/Logo.test.tsx
git commit -m "feat(phase4A): Logo SVG component placeholder (3 variants: full/wordmark/mark)"
```

---

## Task 4: Intégrer `<Logo>` dans Header

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 4.1: Lire le Header actuel**

Run: `cat components/layout/Header.tsx | head -60`
Expected: voir le wordmark texte actuel (probable : `<span>BeeCuit</span>` ou similar dans le brand area).

- [ ] **Step 4.2: Repérer le bloc qui affiche "BeeCuit" en texte**

Dans `components/layout/Header.tsx`, trouver la ligne qui rend visuellement le nom de marque, par exemple :

```tsx
<span className="font-display text-xl text-warm-brown">BeeCuit</span>
```

Ou un `<Link>` vers `/` avec le wordmark à l'intérieur.

- [ ] **Step 4.3: Importer `<Logo>` et remplacer le wordmark texte**

Ajouter en haut du fichier :

```tsx
import { Logo } from "@/components/brand/Logo";
```

Remplacer le wordmark texte par :

```tsx
<Logo variant="wordmark" className="h-10 text-warm-brown" />
```

(Garder le `<Link href="/">` parent si présent — le Logo va à l'intérieur du Link.)

- [ ] **Step 4.4: Type-check + visuel**

Run: `pnpm tsc --noEmit 2>&1 | tail -5`
Expected: 0 errors.

Run: `pnpm dev` + ouvrir homepage. Vérifier que le Header affiche le wordmark SVG "AU FIL DES / Saveurs" propre, aligné, à la bonne taille.

- [ ] **Step 4.5: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat(phase4A): integrate Logo wordmark in Header (replaces BeeCuit text)"
```

---

## Task 5: Intégrer `<Logo>` dans Footer + rename mentions

**Files:**
- Modify: `components/layout/Footer.tsx`

- [ ] **Step 5.1: Lire le Footer actuel**

Run: `cat components/layout/Footer.tsx`

- [ ] **Step 5.2: Importer `<Logo>` et remplacer le wordmark texte**

Ajouter en haut :

```tsx
import { Logo } from "@/components/brand/Logo";
```

Remplacer le wordmark/branding actuel (probable `BeeCuit` en texte ou Heading) par :

```tsx
<Logo variant="full" className="h-32 text-warm-brown" />
```

- [ ] **Step 5.3: Rename toutes les occurrences "BeeCuit" → "Au Fil des Saveurs" dans le Footer**

Pour chaque ligne dans `components/layout/Footer.tsx` contenant "BeeCuit", remplacer par "Au Fil des Saveurs". Exemples typiques :
- `© 2026 BeeCuit. Tous droits réservés.` → `© 2026 Au Fil des Saveurs. Tous droits réservés.`
- Texte descriptif `BeeCuit, biscuiterie...` → `Au Fil des Saveurs, biscuiterie...`

- [ ] **Step 5.4: Vérifier qu'il ne reste plus de "BeeCuit" dans le fichier**

Run: `grep -i "beecuit" components/layout/Footer.tsx`
Expected: aucune occurrence.

- [ ] **Step 5.5: Type-check + visuel**

Run: `pnpm tsc --noEmit && pnpm dev` → ouvrir homepage, scroll au footer. Vérifier que le logo apparaît bien, les copyrights mentionnent "Au Fil des Saveurs".

- [ ] **Step 5.6: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "feat(phase4A): integrate Logo + rename BeeCuit to Au Fil des Saveurs in Footer"
```

---

## Task 6: Rename messages — 4 locales

**Files:**
- Modify: `messages/fr.json`, `messages/nl.json`, `messages/en.json`, `messages/de.json`

- [ ] **Step 6.1: Backup snapshot des 4 fichiers messages (safety)**

Run: `cp messages/fr.json /tmp/fr.json.bak && cp messages/nl.json /tmp/nl.json.bak && cp messages/en.json /tmp/en.json.bak && cp messages/de.json /tmp/de.json.bak`

- [ ] **Step 6.2: Sed remplacement sur les 4 fichiers**

Run :
```bash
for f in messages/fr.json messages/nl.json messages/en.json messages/de.json; do
  sed -i 's/BeeCuit/Au Fil des Saveurs/g' "$f"
done
```

- [ ] **Step 6.3: Vérifier que les JSON restent valides**

Run :
```bash
for f in messages/fr.json messages/nl.json messages/en.json messages/de.json; do
  python3 -c "import json; json.load(open('$f', encoding='utf-8')); print('$f OK')"
done
```
Expected: 4× "OK".

- [ ] **Step 6.4: Vérifier qu'il n'y a plus de "BeeCuit" (case-insensitive)**

Run: `grep -ri "beecuit" messages/ 2>/dev/null`
Expected: aucune sortie.

- [ ] **Step 6.5: Smoke visuel multi-locales**

Run: `pnpm dev`, ouvrir successivement :
- `http://localhost:PORT/fr` → vérifier "Au Fil des Saveurs"
- `http://localhost:PORT/nl`
- `http://localhost:PORT/en`
- `http://localhost:PORT/de`

Aucune ne doit afficher "BeeCuit".

- [ ] **Step 6.6: Commit**

```bash
git add messages/
git commit -m "feat(phase4A): rename BeeCuit to Au Fil des Saveurs in all 4 locale message files"
```

---

## Task 7: Rename composants UI restants

**Files:**
- Modify: `components/layout/MobileNav.tsx`
- Modify: `components/home/CoffretsTeaser.tsx`
- Modify: `components/home/InstagramGrid.tsx`
- Modify: `components/shop/CheckoutForm.tsx`
- Modify: `components/admin/AdminSidebar.tsx`

- [ ] **Step 7.1: Pour chaque fichier ci-dessus, lister les occurrences**

Run :
```bash
for f in components/layout/MobileNav.tsx components/home/CoffretsTeaser.tsx components/home/InstagramGrid.tsx components/shop/CheckoutForm.tsx components/admin/AdminSidebar.tsx; do
  echo "=== $f ==="
  grep -n -i "beecuit" "$f"
done
```
Expected: liste de lignes à modifier par fichier.

- [ ] **Step 7.2: Pour CHAQUE occurrence dans CHAQUE fichier, utiliser Edit avec contexte**

Pour chaque ligne identifiée, lire 2-3 lignes de contexte et faire un Edit ciblé. Exemple :

Si MobileNav contient :
```tsx
<span className="font-display">BeeCuit</span>
```

Edit avec :
- `old_string`: `<span className="font-display">BeeCuit</span>`
- `new_string`: `<Logo variant="wordmark" className="h-8" />`
(et ajouter `import { Logo } from "@/components/brand/Logo";` en haut)

Pour les occurrences de copy plain text :
- `old_string`: `BeeCuit, biscuiterie artisanale belge`
- `new_string`: `Au Fil des Saveurs, biscuiterie artisanale belge`

**Note** : si certains fichiers utilisent `<Logo>` au lieu de texte, intégrer le composant comme dans Header (Task 4).

- [ ] **Step 7.3: Vérifier zéro résidu "BeeCuit" dans ces 5 fichiers**

Run :
```bash
grep -ri "beecuit" components/layout/MobileNav.tsx components/home/CoffretsTeaser.tsx components/home/InstagramGrid.tsx components/shop/CheckoutForm.tsx components/admin/AdminSidebar.tsx
```
Expected: aucune sortie.

- [ ] **Step 7.4: Type-check + smoke**

Run: `pnpm tsc --noEmit && pnpm build 2>&1 | tail -5`
Expected: success.

- [ ] **Step 7.5: Commit**

```bash
git add components/
git commit -m "feat(phase4A): rename BeeCuit to Au Fil des Saveurs in remaining UI components"
```

---

## Task 8: Rename pages (entreprises, abonnement, cartes-cadeaux)

**Files:**
- Modify: `app/[locale]/(shop)/entreprises/page.tsx`
- Modify: `app/[locale]/(shop)/abonnement/page.tsx`
- Modify: `app/[locale]/(shop)/cartes-cadeaux/page.tsx`

- [ ] **Step 8.1: Lister occurrences par fichier**

Run :
```bash
for f in "app/[locale]/(shop)/entreprises/page.tsx" "app/[locale]/(shop)/abonnement/page.tsx" "app/[locale]/(shop)/cartes-cadeaux/page.tsx"; do
  echo "=== $f ==="
  grep -n -i "beecuit" "$f"
done
```

- [ ] **Step 8.2: Edit chaque occurrence**

Pour chaque ligne, faire un Edit ciblé en remplaçant `BeeCuit` par `Au Fil des Saveurs` en préservant le contexte syntaxique. Exemples typiques :

- `<title>Entreprises – BeeCuit</title>` → `<title>Entreprises – Au Fil des Saveurs</title>`
- `description: "BeeCuit propose..."` → `description: "Au Fil des Saveurs propose..."`

- [ ] **Step 8.3: Vérifier zéro résidu**

Run :
```bash
grep -ri "beecuit" "app/[locale]/(shop)/entreprises/" "app/[locale]/(shop)/abonnement/" "app/[locale]/(shop)/cartes-cadeaux/"
```
Expected: aucune sortie.

- [ ] **Step 8.4: Type-check + smoke**

Run: `pnpm tsc --noEmit && pnpm dev` → ouvrir `/fr/entreprises`, `/fr/abonnement`, `/fr/cartes-cadeaux` → vérifier "Au Fil des Saveurs" affiché partout.

- [ ] **Step 8.5: Commit**

```bash
git add "app/[locale]/(shop)/"
git commit -m "feat(phase4A): rename BeeCuit to Au Fil des Saveurs in entreprises/abonnement/cartes-cadeaux pages"
```

---

## Task 9: Rename email templates (11 fichiers)

**Files:**
- Modify: `lib/email/send-b2b.ts`
- Modify: 11 fichiers dans `lib/email/templates/*.tsx`

- [ ] **Step 9.1: Lister occurrences dans tous les emails**

Run :
```bash
grep -rn -i "beecuit" lib/email/ 2>/dev/null
```
Expected: liste des fichiers et lignes à modifier.

- [ ] **Step 9.2: Pour CHAQUE fichier dans `lib/email/templates/`, faire un Edit avec contexte**

Exemple pour `OrderConfirmation.tsx`, si contient :
```tsx
<Heading>Merci pour ta commande chez BeeCuit !</Heading>
```

Edit :
- `old_string`: `Merci pour ta commande chez BeeCuit !`
- `new_string`: `Merci pour ta commande chez Au Fil des Saveurs !`

Pour les signatures email :
- `L'équipe BeeCuit` → `L'équipe Au Fil des Saveurs`
- `© 2026 BeeCuit` → `© 2026 Au Fil des Saveurs`

Répéter pour chaque occurrence dans chaque fichier (11 templates + send-b2b.ts).

- [ ] **Step 9.3: Vérifier zéro résidu dans lib/email/**

Run: `grep -ri "beecuit" lib/email/`
Expected: aucune sortie.

- [ ] **Step 9.4: Test render de quelques templates**

Run :
```bash
pnpm tsc --noEmit 2>&1 | tail -5
```
Expected: 0 errors.

Si possible, lancer un script de preview email (ex: `npx react-email dev` si configuré) sur 2-3 templates.

- [ ] **Step 9.5: Commit**

```bash
git add lib/email/
git commit -m "feat(phase4A): rename BeeCuit to Au Fil des Saveurs in all 11 email templates + send-b2b"
```

---

## Task 10: Rename scripts seed/setup

**Files:**
- Modify: `scripts/seed-coffrets.mjs`
- Modify: `scripts/seed-gift-card-products.mjs`
- Modify: `scripts/create-stripe-subscription-prices.mjs`

- [ ] **Step 10.1: Lister occurrences**

Run :
```bash
grep -n -i "beecuit" scripts/seed-coffrets.mjs scripts/seed-gift-card-products.mjs scripts/create-stripe-subscription-prices.mjs
```

- [ ] **Step 10.2: Edit chaque occurrence**

Pour chaque ligne dans chaque script, remplacer `BeeCuit` par `Au Fil des Saveurs`. Ce sont souvent des descriptions de produits ou des metadata Stripe.

Exemple :
- `description: "Coffret BeeCuit Premium"` → `description: "Coffret Au Fil des Saveurs Premium"`

**Note importante :** ces scripts n'écrivent dans Stripe que si on les ré-exécute. Les produits déjà créés dans Stripe garderont leur ancien nom — à corriger manuellement dans le dashboard Stripe avant le launch commercial (à noter en `project_phase4A_done.md`).

- [ ] **Step 10.3: Vérifier zéro résidu**

Run: `grep -ri "beecuit" scripts/`
Expected: aucune sortie (sauf `scripts/_*` qui peuvent être ignorés ou les fichiers .ps1 si ils en contiennent).

- [ ] **Step 10.4: Commit**

```bash
git add scripts/
git commit -m "feat(phase4A): rename BeeCuit to Au Fil des Saveurs in seed/setup scripts"
```

---

## Task 11: Rename infra — package.json + README

**Files:**
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 11.1: Mettre à jour `package.json`**

Ouvrir `package.json`. Repérer la ligne `"name": "beecuit"` (ou similaire) en haut. Edit :
- `old_string`: `"name": "beecuit",`
- `new_string`: `"name": "au-fil-des-saveurs",`

Vérifier également :
- `"description"` si elle mentionne BeeCuit
- `"author"` (probablement ne mentionne pas BeeCuit, à laisser)

- [ ] **Step 11.2: Mettre à jour `README.md`**

Ouvrir `README.md`. Remplacer toutes les occurrences de "BeeCuit" par "Au Fil des Saveurs", en préservant le contexte (titre principal, mentions du projet).

Run après edit : `grep -i "beecuit" README.md`
Expected: aucune sortie.

- [ ] **Step 11.3: Vérifier le package.json valide**

Run: `python3 -c "import json; print(json.load(open('package.json'))['name'])"`
Expected: `au-fil-des-saveurs`.

- [ ] **Step 11.4: Re-run pnpm install pour s'assurer que le nouveau name est OK**

Run: `pnpm install 2>&1 | tail -5`
Expected: success, aucun avertissement majeur.

- [ ] **Step 11.5: Commit**

```bash
git add package.json README.md pnpm-lock.yaml
git commit -m "feat(phase4A): rename package to au-fil-des-saveurs + update README"
```

---

## Task 12: Créer `docs/style-guide.md`

**Files:**
- Create: `docs/style-guide.md`

- [ ] **Step 12.1: Écrire le style guide**

Créer `docs/style-guide.md` avec :

````markdown
# Au Fil des Saveurs — Style Guide

## Brand

- **Nom commercial** : Au Fil des Saveurs
- **Baseline** : Biscuiterie Fine & Gourmet
- **Ton** : Féminin premium artisanal — références Pierre Hermé, Ladurée

## Palette (CSS vars dans `app/globals.css`)

### Couleurs brutes
| Variable | Valeur | Usage |
|---|---|---|
| `--color-cream` | `#fbf6ee` | Background dominant pages |
| `--color-cream-light` | `#fdfaf3` | Cards elevated, surfaces |
| `--color-cream-gold` | `#c9a368` | Texte/icônes sur fond chocolat |
| `--color-warm-brown` | `#4a332a` | Texte body |
| `--color-brand-chocolate` | `#2c1810` | CTAs primaires forts, footer, accents profonds |
| `--color-honey` | `#e4a11b` | Or accent vif |
| `--color-honey-dark` | `#b07a0e` | Or accent profond, hover, liens |
| `--color-soft-rose` | `#e8d2c5` | Accent féminin subtil — borders, dividers |
| `--color-cookie` | `#c68b5a` | Accent moyen, tags |
| `--color-leaf` | `#708b58` | Indicateurs bio/naturel, success state |
| `--color-terracotta` | `#c97757` | Accent secondaire |

### Tokens sémantiques (préférés pour nouveaux composants)
| Token | Pointe vers | Usage |
|---|---|---|
| `text-text-primary` | `--color-warm-brown` | Texte body courant |
| `text-text-muted` | `rgb(74 51 42 / 0.7)` | Texte secondaire |
| `text-text-inverse` | `--color-cream-gold` | Texte sur fond chocolat |
| `text-text-accent` | `--color-honey-dark` | Liens, accents textuels |
| `bg-surface` | `--color-cream` | Background pages |
| `bg-surface-elevated` | `--color-cream-light` | Cards |
| `bg-surface-inverse` | `--color-brand-chocolate` | Footer, sections sombres |
| `bg-cta-primary` | `--color-honey-dark` | Boutons primaires |
| `bg-cta-primary-hover` | `--color-brand-chocolate` | Hover boutons primaires |
| `border-border-subtle` | `rgb(74 51 42 / 0.1)` | Borders cards, dividers fins |

## Typographie

### Fonts (chargées via `next/font/google`)

| Variable CSS | Font | Usage |
|---|---|---|
| `var(--font-display)` | **Fraunces** | H1, H2, hero, headings prominents |
| `var(--font-script)` | **Pinyon Script** | Mots-clés émotionnels, accents poétiques |
| `var(--font-body)` | Fraunces | Paragraphes, texte courant |
| `var(--font-ui)` | system-ui | Boutons, formulaires (clarté UI) |

### Règles d'usage de la script font

- **1 mot script par paragraphe maximum** — sinon ça devient illisible et "mariage amateur"
- **Tailles ≥ 24 px** uniquement — en dessous, Pinyon Script perd sa lisibilité
- **Mots types** : "Saveurs", "Découvrir", "Composer", "Nos histoires", "Atelier", "Création"
- **Couleur conseillée** : `text-honey-dark` (or profond) sur fond cream

### Exemples

```tsx
<h1>
  <span className="font-display">Découvrez nos</span>{" "}
  <span className="font-script text-honey-dark text-6xl">Saveurs</span>
</h1>
```

## Logo

Composant `<Logo>` dans `components/brand/Logo.tsx` avec 3 variantes :
- `variant="full"` — composition complète, ~240px square
- `variant="wordmark"` — sans toque ni baseline, ~280×90, pour Header
- `variant="mark"` — toque seule dans cercle, ~64×64, pour favicon/social

Théming via `currentColor` : `<Logo className="text-warm-brown h-12" />`

## Animations (Phase 4D)

À venir. Pour l'instant : aucune animation custom.
````

- [ ] **Step 12.2: Commit**

```bash
git add docs/style-guide.md
git commit -m "docs(phase4A): style guide — brand, palette, semantic tokens, typo rules, logo"
```

---

## Task 13: Régénérer favicon depuis Logo variant="mark"

**Files:**
- Modify: `public/favicon.ico` (ou `app/favicon.ico`)
- Modify potentiellement: `app/icon.tsx` ou similar (Next.js metadata icons)

- [ ] **Step 13.1: Localiser le favicon actuel**

Run: `find . -name "favicon*" -not -path "./node_modules/*" -not -path "./.next/*" 2>/dev/null`
Expected: chemins vers favicon (souvent `app/favicon.ico` ou `public/favicon.ico`).

- [ ] **Step 13.2: Stratégie favicon (deux options)**

**Option A — Statique avec image extraite** (rapide V1) :
Créer `app/icon.tsx` qui rend le `<Logo variant="mark">` en image dynamique :

```tsx
import { ImageResponse } from "next/og";
import { Logo } from "@/components/brand/Logo";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#fbf6ee",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#4a332a",
        }}
      >
        <Logo variant="mark" />
      </div>
    ),
    size,
  );
}
```

**Option B — Conserver l'ancien favicon** (skip pour V1) :
Si trop complexe, garder l'ancien favicon ; à remplacer manuellement quand le logo cliente arrive.

Recommandation : **Option B** pour ne pas bloquer. Noter dans memory que favicon est à régénérer.

- [ ] **Step 13.3: Si Option B, commit la note dans le style-guide.md**

Ajouter à `docs/style-guide.md` une section "TODO" :

```markdown
## TODO

- [ ] Régénérer favicon depuis `Logo variant="mark"` ou utiliser fichier cliente quand reçu
- [ ] Mettre à jour produits Stripe (noms BeeCuit → Au Fil des Saveurs) dans le dashboard
```

Run: `git add docs/style-guide.md && git commit -m "docs(phase4A): note TODO favicon + Stripe products rename"`

---

## Task 14: QA suite + smoke + bundle audit + grep finale

- [ ] **Step 14.1: Validation suite complète**

Run:
```bash
pnpm tsc --noEmit
pnpm lint
pnpm vitest run tests/unit
pnpm build
```

Expected:
- tsc: 0 errors
- lint: 0 warnings/errors
- vitest unit: 51 (Phase 2) + 5 (Logo) = 56 tests passants, 1 préexistant fail env (db.test.ts) toléré
- build: success

- [ ] **Step 14.2: Grep finale — vérifier zéro "BeeCuit" en prod**

Run:
```bash
grep -ri "beecuit" --include="*.{ts,tsx,json,md,mjs,js}" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "docs/superpowers" | grep -v "/tests/"
```
Expected: aucune sortie (les docs/superpowers et tests legacy contiennent encore "BeeCuit" historique — c'est OK).

Si occurrences résiduelles : Edit chacune et commit `fix(phase4A): rename residual BeeCuit occurrences`.

- [ ] **Step 14.3: Smoke local 5 pages clés (multi-locale)**

Run: `pnpm dev` + ouvrir dans le navigateur :

| URL | Vérifier |
|---|---|
| `/fr` | Header + Footer = "Au Fil des Saveurs", logo SVG affiché |
| `/fr/biscuits` | Title, copy mentionnent Au Fil des Saveurs |
| `/fr/coffrets` | Idem |
| `/fr/checkout` | Form labels propres |
| `/nl` | Locale NL fonctionne, branding cohérent |

Aucune page ne doit afficher "BeeCuit".

- [ ] **Step 14.4: Bundle audit**

Run: `pnpm build 2>&1 | grep -E "First Load JS|locale" | head -10`

Vérifier que `First Load JS shared by all` est ≤ ~108 KB (avant ~102 KB + Pinyon Script ~5 KB).

Si > 115 KB : investiguer (probablement Pinyon Script chargé avec trop de subsets — vérifier `subsets: ["latin"]` only).

- [ ] **Step 14.5: Lighthouse rapide mobile (optionnel)**

Run: `npx unlighthouse --site http://localhost:PORT/fr 2>&1 | tail -10`

Cible : perf ≥ 85. Si < 85 : noter pour Phase 4D (optimisations motion + images).

- [ ] **Step 14.6: Commit final si fixes**

Si fixes nécessaires au smoke : `git add -A && git commit -m "fix(phase4A): smoke corrections"`.

---

## Task 15: Update memory + roadmap status

- [ ] **Step 15.1: Créer `C:\Users\jeanb\.claude\projects\C--Users-jeanb-Documents-WebAPP-BeeCuit\memory\project_phase4A_done.md`**

```markdown
---
name: project-phase4A-done
description: "Phase 4A Brand Foundation DONE 2026-MM-DD — rename BeeCuit→Au Fil des Saveurs, palette tokens, Pinyon Script, Logo SVG placeholder"
metadata:
  type: project
---

**Phase 4A — Brand Foundation — DONE 2026-MM-DD** (à remplir par l'implémenteur)

- Nom commercial : **Au Fil des Saveurs** (baseline "Biscuiterie Fine & Gourmet")
- Rename complet : translations FR/NL/EN/DE, 5 composants UI, 3 pages, 11 email templates + send-b2b, 3 scripts, package.json (au-fil-des-saveurs), README
- Palette : ajout `--color-brand-chocolate #2c1810`, `--color-cream-gold #c9a368`, `--color-cream-light #fdfaf3`. Tokens sémantiques (`text-text-primary`, `bg-surface-elevated`, etc.) disponibles pour Phase 4B+
- Typo : Pinyon Script chargée via next/font, utility `font-script` disponible. Règles dans `docs/style-guide.md`
- Logo : `<Logo variant="full|wordmark|mark">` placeholder SVG à remplacer par fichiers cliente quand reçus
- Style guide : `docs/style-guide.md` documenté

**TODO résiduels** (non bloquants pour 4B) :
- Favicon à régénérer (skip V1, fait avec logo cliente)
- Produits Stripe dashboard à renommer manuellement avant launch commercial
- Domaine Vercel reste `beecuit.vercel.app` jusqu'au launch (à migrer vers `aufildessaveurs.vercel.app` ou `.be`)

**Prochaine étape :** Phase 4B — Homepage Refresh (Hero, StoryTeaser, CoffretsTeaser, NewsletterCTA repensés éditorialement).
```

- [ ] **Step 15.2: Update MEMORY.md**

Ajouter une ligne après "Phase 2 B2B" :

```markdown
- [Phase 4A deployed](project_phase4A_done.md) — Brand Foundation : Au Fil des Saveurs (rename + palette + Pinyon Script + Logo SVG placeholder)
```

- [ ] **Step 15.3: Push (optionnel selon stratégie)**

Si tu veux deployer à `beecuit.vercel.app` (le rename de l'URL viendra plus tard) :

```bash
git push origin main
```

Vercel auto-deploy. Wait ~2-3 min puis :
```bash
curl -s https://beecuit.vercel.app/fr | grep -oE "Au Fil des Saveurs" | head -1
```
Expected: matches "Au Fil des Saveurs".

---

## Spec coverage self-review

| Spec section | Tâche |
|---|---|
| Item 1 — Rename complet | Tasks 5 (footer), 6 (messages), 7 (composants), 8 (pages), 9 (emails), 10 (scripts), 11 (package+README) |
| Item 2 — Palette CSS vars | Task 1 |
| Item 3 — Typo Pinyon Script | Task 2 |
| Item 4 — Logo SVG | Tasks 3 (composant) + 4 (Header) |
| Style guide doc | Task 12 |
| Favicon | Task 13 (option B, skip V1) |
| QA + bundle audit + grep | Task 14 |
| Memory update | Task 15 |

No gaps.

## Type consistency check

- `<Logo variant="full" | "wordmark" | "mark" />` — variants cohérentes entre Task 3 (création), Task 4 (Header use wordmark), Task 5 (Footer use full), Task 13 (favicon use mark). ✓
- CSS vars `--color-brand-chocolate`, `--color-cream-gold`, `--color-cream-light` cohérentes entre Task 1 (création) et Task 12 (documentation style-guide). ✓
- Tokens sémantiques `text-text-primary`, `bg-surface-elevated` etc. — créés Task 1, documentés Task 12. ✓
- `--font-pinyon` et `--font-script` — créés Task 2, utilisés Task 3 (Logo Saveurs script). ✓

## Notes pour l'implémenteur

- **Tailwind v4 + CSS vars** : le moteur compile automatiquement `bg-brand-chocolate`, `text-cream-gold`, etc. à partir des `--color-*` dans `@theme inline`. Pas de config Tailwind à toucher.
- **next-intl messages** : ces fichiers sont du JSON pur. Le sed est safe mais valider avec `jq` ou `python3 -c "json.load(...)"` après.
- **Edit avec contexte** : pour `BeeCuit` en plain text avec peu de contexte distinctif, élargir le `old_string` aux 5-10 caractères autour pour garantir l'unicité.
- **Stripe products** : les produits déjà créés dans Stripe gardent leur nom "BeeCuit" — c'est cosmétique, à fixer manuellement plus tard. Les NOUVEAUX produits créés après ce sprint utiliseront "Au Fil des Saveurs".
- **Logo SVG sans cordage ornemental** : placeholder volontaire. La bordure cord/string sera ajoutée quand le logo cliente arrive (ou délégué à un illustrateur SVG).
- **L'opération entière est NON-DESTRUCTIVE visuellement** sauf l'apparition du nouveau logo dans Header/Footer/MobileNav. Tous les layouts, espacements, autres composants restent identiques.

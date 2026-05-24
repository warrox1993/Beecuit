# Phase 4A — Brand Foundation « Au Fil des Saveurs » — Design

**Date :** 2026-05-25
**Statut :** Spec validée, plan à écrire
**Roadmap parent :** `docs/superpowers/specs/2026-05-25-phase4-visual-overhaul-roadmap.md`
**Phase précédente :** Phase 2 B2B complete (Phase 3 3D abandonnée)

## Contexte & motivation

Le site actuel utilise le nom de travail **"BeeCuit"** sans identité visuelle aboutie. La cliente a validé le nom commercial **"Au Fil des Saveurs"** (féminin premium artisan, références Pierre Hermé / Ladurée). Les fichiers vectoriels finaux du logo arriveront plus tard ; un placeholder SVG sera créé pour ne pas bloquer l'avancement.

Ce sprint 4A pose les **fondations** sur lesquelles les 6 phases suivantes du visual overhaul (4B → 4G) s'appuieront : rename complet, palette féminine premium, système typographique formalisé, et logo placeholder.

## Objectifs

- **Renommer** "BeeCuit" → "Au Fil des Saveurs" dans tout le code applicatif visible utilisateur (P0).
- **Affiner la palette** CSS vars pour cohérence féminin premium + tokens sémantiques pour faciliter futures évolutions (P0).
- **Formaliser le système typographique** avec ajout d'une font calligraphique pour les accents émotionnels (P0).
- **Livrer un logo placeholder SVG** thèmable, à variantes, prêt à être remplacé par les fichiers cliente (P0).
- **0 régression visuelle** sur les pages existantes — le site doit rester fonctionnel et beau pendant la transition (P0).
- **Bundle impact maîtrisé** : Pinyon Script via `next/font` (subsetting auto), pas de net effet sur First Load JS (~ +5 KB max).

**Hors scope :**
- Redesign des composants (Hero, ProductCard, etc.) — c'est Phase 4B-4C.
- Animations / motion — c'est Phase 4D.
- Rename du domaine Vercel ou GitHub repo — déféré au lancement commercial.

## Stack & contraintes

- Pas de nouvelles deps npm sauf Google Fonts via `next/font/google` (Pinyon Script).
- Aucune migration DB.
- Aucune nouvelle env var.
- Tailwind v4 (CSS vars natives, théming via @theme inline).
- next-intl pour les 4 locales (fr/nl/en/de).
- React Email pour les templates email (déjà en place).

## Décisions architecturales

| Question | Décision | Pourquoi |
|---|---|---|
| Stratégie rename | Sed/Edit ciblé fichier par fichier dans messages + composants + emails + scripts + package.json + README | Pas de tooling magique ; review humaine ligne par ligne sur le code critique (emails, metadata) ; sed sur les message files. |
| Nom EXACT à utiliser | **"Au Fil des Saveurs"** (avec les majuscules sur Au/Fil/Saveurs, "des" en minuscule, espacement standard) | Match à la baseline cliente. Cohérent avec la calligraphie sur le sticker de référence. |
| Baseline tagline | **"Biscuiterie Fine & Gourmet"** | Reprise exacte du sticker de référence. |
| Logo strategy | Composant React SVG inline `<Logo variant="full"\|"wordmark"\|"mark" />` | Crisp à toutes tailles, théming via `currentColor` + props, pas de fichier statique à managé. |
| Script font | **Pinyon Script** (Google Fonts) | Calligraphique flowing élégant traditionnel. Match référence + restera lisible à tailles raisonnables (≥ 24 px). |
| Palette tokens | Créer une couche `semantic` (text-primary, bg-elevated, etc.) au-dessus des couleurs brutes | Permet re-skin futur sans toucher aux composants. Convention design system. |
| Brand chocolate accent | Ajouter `--color-brand-chocolate: #2C1810` | Pour CTAs primaires forts + footer + accents profonds. Match l'esthétique de la box référence. |
| Cream gold print | Ajouter `--color-cream-gold: #C9A368` | Pour text-on-chocolate (footer, hero overlay), match le doré chaleureux du sticker. |
| package.json name | `au-fil-des-saveurs` (lowercase-kebab-case) | Convention npm. |
| Domain & GitHub | **Pas touché** dans cette phase | Sera fait à l'achat du domaine commercial (`.be` probable). |

## Architecture des changements

### Item 1 — Rename complet

**Fichiers à toucher (~30) :**

**Translations (4 fichiers) :**
- `messages/fr.json`, `messages/nl.json`, `messages/en.json`, `messages/de.json` — remplacer toutes les occurrences `BeeCuit` → `Au Fil des Saveurs`.

**Composants UI (8 fichiers) :**
- `components/layout/Header.tsx` — wordmark texte → composant `<Logo>`
- `components/layout/Footer.tsx` — copyright, mentions
- `components/layout/MobileNav.tsx` — branding header mobile
- `components/home/CoffretsTeaser.tsx` — copy mentionnant la marque
- `components/home/InstagramGrid.tsx` — copy/handle social si présent
- `components/shop/CheckoutForm.tsx` — references brand
- `components/admin/AdminSidebar.tsx` — branding admin

**Pages (3 fichiers) :**
- `app/[locale]/(shop)/entreprises/page.tsx` — copy B2B
- `app/[locale]/(shop)/abonnement/page.tsx` — copy subscription
- `app/[locale]/(shop)/cartes-cadeaux/page.tsx` — copy gift cards

**Email templates (~10 fichiers) :**
- `lib/email/templates/OrderConfirmation.tsx`
- `lib/email/templates/OrderShipped.tsx`
- `lib/email/templates/GiftCardDelivery.tsx`
- `lib/email/templates/B2BCustomerQuote.tsx`
- `lib/email/templates/B2BAdminNotification.tsx`
- `lib/email/templates/B2BPaymentConfirmation.tsx`
- `lib/email/templates/B2BQuoteRejected.tsx`
- `lib/email/templates/SubscriptionWelcome.tsx`
- `lib/email/templates/SubscriptionBoxComposing.tsx`
- `lib/email/templates/SubscriptionBoxReminder.tsx`
- `lib/email/templates/SubscriptionBoxShipped.tsx`
- `lib/email/send-b2b.ts` — sender name string

**Infra (4 fichiers) :**
- `package.json` — `"name": "au-fil-des-saveurs"`
- `README.md` — titre + mentions
- `app/api/cron/gift-cards-deliver/route.ts` — log/comment if relevant
- `lib/stripe/webhook.ts` — log/comment if relevant
- `lib/stripe/payment-link.ts` — product name in Stripe metadata if relevant

**Scripts (3 fichiers, optionnel) :**
- `scripts/seed-coffrets.mjs` — product names cosmétiques
- `scripts/seed-gift-card-products.mjs` — product names cosmétiques
- `scripts/create-stripe-subscription-prices.mjs` — product names

**Skip explicitement :**
- `docs/superpowers/` — historique, valeur archivistique
- `.next/` — généré
- `.gitignore` — vérifier mais probablement OK
- `tests/e2e/gift-card-purchase.spec.ts` — test fixture, à mettre à jour seulement si elle teste contre du texte UI

**Méthode :** sed multi-file pour les message JSON, puis Edit ciblé sur chaque .tsx avec contrôle visuel.

### Item 2 — Palette CSS vars affinée

**Fichier modifié :** `app/globals.css`

**Couleurs brutes (existantes, ajouts) :**

```css
@theme inline {
  /* Existantes — gardées */
  --color-honey: #e4a11b;
  --color-honey-dark: #b07a0e;
  --color-cream: #fbf6ee;
  --color-terracotta: #c97757;
  --color-warm-brown: #4a332a;
  --color-cookie: #c68b5a;
  --color-soft-rose: #e8d2c5;
  --color-leaf: #708b58;

  /* NOUVELLES couleurs brutes */
  --color-brand-chocolate: #2c1810;   /* Footer, CTAs primaires forts, borders profonds */
  --color-cream-gold: #c9a368;        /* Texte/icônes sur fond chocolate */
  --color-cream-light: #fdfaf3;       /* Cards elevated sur fond cream */
}
```

**Tokens sémantiques (NEW) — couche au-dessus :**

```css
@theme inline {
  /* Surfaces */
  --color-surface: var(--color-cream);
  --color-surface-elevated: var(--color-cream-light);
  --color-surface-inverse: var(--color-brand-chocolate);

  /* Texte */
  --color-text-primary: var(--color-warm-brown);
  --color-text-muted: rgb(74 51 42 / 0.7);
  --color-text-inverse: var(--color-cream-gold);
  --color-text-accent: var(--color-honey-dark);

  /* Bordures */
  --color-border-subtle: rgb(74 51 42 / 0.1);
  --color-border-accent: var(--color-honey-dark);

  /* CTAs */
  --color-cta-primary: var(--color-honey-dark);
  --color-cta-primary-hover: var(--color-brand-chocolate);
  --color-cta-secondary: var(--color-warm-brown);

  /* Accents */
  --color-accent-feminine: var(--color-soft-rose);
  --color-accent-gold: var(--color-cream-gold);
}
```

**Migration progressive :** les composants existants gardent leurs classes Tailwind (`text-warm-brown`, `bg-cream`, etc.) — fonctionnel inchangé. Les NOUVEAUX composants (phases 4B+) utiliseront les tokens sémantiques (`text-text-primary`, `bg-surface-elevated`).

### Item 3 — Typo system

**Fichier modifié :** `app/layout.tsx` (ou `app/[locale]/layout.tsx` selon où sont déjà chargées les fonts)

**Chargement de Pinyon Script via next/font/google :**

```tsx
import { Fraunces, Pinyon_Script } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const pinyonScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pinyon",
  display: "swap",
});

// Dans le <html className={`${fraunces.variable} ${pinyonScript.variable}`}>
```

**globals.css updates :**

```css
@theme inline {
  --font-display: var(--font-fraunces), ui-serif, Georgia, serif;
  --font-script: var(--font-pinyon), "Brush Script MT", cursive;
  --font-body: var(--font-fraunces), ui-serif, Georgia, serif;
  --font-ui: ui-sans-serif, system-ui, -apple-system, sans-serif;
}
```

**Tailwind utilities à créer (custom dans `@layer utilities` ou via theme tokens) :**

```css
@layer utilities {
  .font-script { font-family: var(--font-script); font-weight: 400; }
}
```

**Règles d'usage documentées dans `docs/style-guide.md` (NEW) :**
- `font-display` : H1, H2, hero, headings prominents
- `font-script` : 1 mot accent par paragraphe max ("Saveurs", "Découvrir", "Composer", "Nos histoires", "Atelier"). Tailles ≥ 24 px (en dessous, illisible).
- `font-body` : paragraphes, body courant
- `font-ui` : boutons, formulaires, navigation (clarté UI > esthétique)

### Item 4 — Logo wordmark placeholder SVG

**Fichier créé :** `components/brand/Logo.tsx`

**API du composant :**

```tsx
type LogoProps = {
  variant?: "full" | "wordmark" | "mark";  // full = composition complète, wordmark = sans toque/baseline, mark = juste le cercle+toque
  className?: string;                       // permet override couleur via currentColor / size via height
};

export function Logo({ variant = "full", className }: LogoProps) { /* ... */ }
```

**Composition "full" (~120 × 120 px viewBox) :**

```
┌──────────────────────────┐
│      ╭─ toque chef ─╮    │  toque SVG simple, line-drawing 22×18 honey-dark
│                          │
│    A U   F I L   D E S   │  Fraunces caps tracking-wide 13px warm-brown
│      Saveurs             │  Pinyon Script italique 40px honey-dark
│                          │
│  BISCUITERIE FINE        │  Fraunces caps small tracking-widest 8px warm-brown/60
│  & GOURMET               │
└──────────────────────────┘
```

**Composition "wordmark" (~200 × 60 px viewBox) :** juste les 2 lignes "AU FIL DES / Saveurs" pour le Header sticky compact.

**Composition "mark" (~48 × 48 px viewBox) :** juste la toque dans un cercle, pour favicon / social cards / mobile bottom nav.

**Détails techniques :**
- SVG inline avec `<text>` éléments + `<path>` pour la toque
- Couleur via `fill="currentColor"` par défaut + overrides ciblés pour les accents (honey-dark)
- Responsive : taille via `className="h-12"` ou via prop `width/height`
- Préserve l'aspect ratio
- Accessible : `<title>` + `<desc>` + `role="img"` + `aria-label`

**Intégration dans le Header :**

```tsx
// avant : <span className="font-display text-xl">BeeCuit</span>
// après : <Logo variant="wordmark" className="h-10 text-warm-brown" />
```

**Favicon :** également à régénérer à partir du `Logo variant="mark"` — sera fait dans un sous-step.

## Critères d'acceptation (smoke local)

1. **Aucune occurrence visible** de "BeeCuit" / "beecuit" sur tout le site (FR/NL/EN/DE).
2. **Header** affiche le logo SVG "Au Fil des Saveurs" wordmark, cohérent avec la palette.
3. **Footer** mentions "Au Fil des Saveurs" partout, copyright `© 2026 Au Fil des Saveurs`.
4. **Emails de test** (commande, gift card, B2B, abonnement) — affichent "Au Fil des Saveurs" en sender + body.
5. **Pinyon Script** chargée et utilisable via classe `font-script` (test sur un mot dans un composant temporaire).
6. **Nouvelles couleurs** disponibles via classes Tailwind : `text-brand-chocolate`, `bg-cream-light`, `text-cream-gold`, etc.
7. **Tokens sémantiques** disponibles : `text-text-primary`, `bg-surface-elevated`, `text-cta-primary`, etc.
8. **Aucune régression visuelle** : homepage, biscuits, coffrets, abonnement, B2B, cartes-cadeaux, checkout, panier, compte — toutes les pages identiques visuellement (couleurs, layouts, espacement).
9. **package.json name** = `"au-fil-des-saveurs"`.
10. **README** titre = "Au Fil des Saveurs", brand mentions updated.
11. **Bundle homepage** ≤ +5 KB First Load JS vs avant (cible ~195 KB, actuellement ~190 KB).
12. **Lighthouse perf** mobile ≥ 85 (inchangé).
13. `pnpm tsc --noEmit && pnpm lint && pnpm vitest run tests/unit && pnpm build` tous verts.

## Risques & mitigation

| Risque | Mitigation |
|---|---|
| Sed mal calibré qui casse du JSON | Tester chaque message file après modif : `cat fr.json \| jq .` |
| Variantes oubliées du mot ("BEECUIT", "beeCuit", etc.) | Grep case-insensitive `grep -ri "beecuit" .` après l'opération |
| Cassure des emails (templates React Email rendent) | Compilation `pnpm build` + envoi test manuel de chaque type d'email |
| Pinyon Script ne se charge pas (CSP, network) | Fallback `cursive` natif, vérif visuelle après deploy preview |
| Tokens sémantiques cassent un composant existant | Ne PAS migrer les composants existants — juste ajouter les tokens disponibles ; les composants gardent leurs classes actuelles |
| Logo SVG mal aligné selon le navigateur | Test multi-browser (Chrome, Safari, Firefox) sur viewport mobile + desktop |
| Stripe products: noms inclus dans Stripe dashboard | À jour MANUELLEMENT dans Stripe après — pas critique pour V1 |

## Plan d'implémentation (esquisse)

Détaillé dans `docs/superpowers/plans/2026-05-25-phase4A-brand-foundation.md` après writing-plans. Esquisse :

1. **Backup** : ensure clean git state + create feat branch `phase4a-brand-foundation`.
2. **Item 2 (Palette)** : update `globals.css` avec nouvelles couleurs + tokens sémantiques. Smoke visuel.
3. **Item 3 (Typo)** : ajouter Pinyon Script dans layout + utilities CSS. Test composant.
4. **Item 4 (Logo)** : créer `components/brand/Logo.tsx` avec 3 variantes. Snapshot visuel.
5. **Item 1a (Rename — messages)** : sed sur les 4 message files. Validation jq.
6. **Item 1b (Rename — composants/pages)** : Edit chaque composant pour rename strings + intégrer `<Logo>` dans Header/Footer.
7. **Item 1c (Rename — emails)** : Edit chaque template React Email.
8. **Item 1d (Rename — infra)** : package.json, README, scripts.
9. **Style guide** : créer `docs/style-guide.md` doc d'usage typo + palette.
10. **Favicon** : régénérer depuis Logo variant="mark".
11. **QA suite** : tsc/lint/tests/build + smoke local toutes pages + grep no-more-BeeCuit.
12. **Memory update** : `project_phase4A_done.md`.

Estimation : ~3-4 jours.

## Spec coverage self-review

| Section roadmap | Couvert dans |
|---|---|
| Item 1 Rename | Item 1 (split en 1a/1b/1c/1d dans le plan) |
| Item 2 Palette | Item 2 |
| Item 3 Typo | Item 3 |
| Item 4 Logo placeholder | Item 4 |
| Hors scope (animations, redesigns) | Notée en "Hors scope" |
| Bundle target | Critère acceptation 11 |
| Réviser séparément quand logo cliente arrive | Variantes de Logo permettent swap trivial |

No gaps.

## Notes pour l'implémenteur

- Le sed sur les .json doit être attentif aux échappements (apostrophes françaises "Au Fil des Saveurs" vs "L'Atelier d'Au Fil des Saveurs" — vérifier qu'on ne crée pas "L'AtelierAu Fil des Saveurs").
- Les noms de produits Stripe sont gérés dans le dashboard Stripe — laisser une todo pour les renommer manuellement avant le launch commercial.
- Le composant `<Logo>` doit être testé en isolation avant intégration : un fichier `components/brand/Logo.test.tsx` (smoke render des 3 variantes) serait sage.
- Pour vérifier le rendu Pinyon Script : créer un fichier temporaire de test avec différentes tailles (24, 32, 48, 64 px) et confirmer la lisibilité.

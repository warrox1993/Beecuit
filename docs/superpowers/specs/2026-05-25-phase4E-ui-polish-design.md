# Phase 4E — UI Polish & Details — Design Spec

**Date :** 2026-05-25
**Items roadmap :** 16-20

## Décisions design

### Sticky header (item 16)
- Convert Header to client component (need scroll listener)
- Effects on scroll > 8px: `h-14` (vs `h-20`), `bg-cream/85 backdrop-blur-md`,
  `shadow-[0_2px_8px_rgba(44,24,16,0.06)]`, logo `h-8` (vs `h-12`)
- All via CSS transitions (300ms ease-out)
- `useReducedMotion()` skips animations only (sizing still applied)

### Footer redesign (item 17)
- Already at 4 cols; reduce to 3 + add gold rope divider banner + bio atelier paragraph
- Cols: (1) Logo + bio atelier paragraph, (2) Shop links, (3) Maison + Help + Newsletter stacked
- Footer chocolate variant: option to use `bg-surface-inverse` ; mais pour conserver
  cohésion homepage cream, on garde cream avec accent gold rope dividers entre les cols.
- Social icons remplacés par vrais Instagram + Facebook SVG icons inline (pas Share2/Globe lucide)

### Forms polish (item 18)
- Création d'un module `components/ui/FormField.tsx` réutilisable :
  - label flottante (HTML5 native floating label CSS approach via `:placeholder-shown`)
  - focus ring honey-dark/40 ring-2
  - error/success states colorés (terracotta/leaf borders)
- Appliquer à : NewsletterForm, NewsletterFormRefined, CheckoutForm, B2BQuoteForm
- Sans tout refactor, on fait une primitive utilisable progressivement.

### Loading skeletons (item 19)
- `components/ui/Skeleton.tsx` primitif : bg cream-light + cookie/40 stripe shimmer 1.5s
- `components/shop/ProductCardSkeleton.tsx` + `CoffretCardSkeleton.tsx`
- Loading.tsx pour `/biscuits` et `/coffrets` routes (Suspense boundary)

### Empty states (item 20)
- `components/common/EmptyState.tsx` primitif : ornement SVG (mini-cookie ou box outline)
  + heading Fraunces + prose warm-brown + CTA
- Wire-up : panier vide, commandes vides

## Composants touchés

| Fichier | Action |
|---|---|
| `components/layout/Header.tsx` | REWRITE → client component shrinkable + new wrapper Server |
| `components/layout/HeaderClient.tsx` | NEW — client logic with scroll listener |
| `components/layout/Footer.tsx` | RESTRUCTURE 3 cols + bio + rope dividers + social SVGs |
| `components/ui/FormField.tsx` | NEW — floating label primitive |
| `components/ui/Skeleton.tsx` | NEW — shimmer primitive |
| `components/shop/ProductCardSkeleton.tsx` | NEW |
| `components/shop/CoffretCardSkeleton.tsx` | NEW |
| `app/[locale]/(shop)/biscuits/loading.tsx` | NEW |
| `app/[locale]/(shop)/coffrets/loading.tsx` | NEW |
| `components/common/EmptyState.tsx` | NEW |
| `app/[locale]/(shop)/panier/page.tsx` | ADD EmptyState when no items |
| i18n | ADD `footer.bio`, `cart.emptyTitle/emptyCta`, `forms.*` |

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Header client component perd SSR i18n | Pass translations as props from server wrapper |
| Skeletons trop bruyants vs cream surfaces | Shimmer subtil opacity 0.5 max |
| Empty state ne sait pas si "panier vide" parce que loading ou vraiment vide | Server-rendered page → soit vide soit non, pas de race |

## Bundle target

Homepage 246 → ≤ 252 KB (delta + skeletons/header client minor).

## Validation

- tsc 0, lint 0, vitest verts
- e2e home + checkout restent verts

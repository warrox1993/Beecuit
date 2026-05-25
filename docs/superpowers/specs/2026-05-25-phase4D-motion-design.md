# Phase 4D — Motion & Polish — Design Spec

**Date :** 2026-05-25
**Items roadmap :** 12-15 (reveal-on-scroll, page transitions, fly-to-cart, toast themed)

## Vision

Apporter la sensation de "vie" au site en gardant la sobriété : animations
courtes (300-500 ms), ease-out, stagger raisonnable. Respect strict de
`prefers-reduced-motion` partout via `useReducedMotion()`.

## Décisions design

### Reveal-on-scroll (item 12)
- **Primitive** : `Reveal` client component qui utilise `framer-motion` :
  fade-in + translate-y-3 sur entrée viewport, `whileInView` avec `once: true`,
  durée 0.45s ease-out, delay configurable pour stagger.
- **Usage** : Hero, StoryTeaser, CoffretsTeaser, NewsletterCTA, ProductGrid sections.
- **Reduced motion** : `useReducedMotion` → render statique sans transform.

### Page transitions (item 13)
- **Approche** : layout-level crossfade via `motion.div` clé sur pathname.
- **Gold line** : pseudo trace `motion.div` width 0→100% en 600ms sous le header
  pendant les navigation (déjà visible un instant comme un indicateur de chargement
  artisanal). Affichage uniquement pendant `useTransition()` ou route change.
- **Simplification** : on fait juste un wrapper layout client `PageTransition`
  qui fade-in chaque page child sur key={pathname}. Gold line dans Header
  via une ligne CSS `::after` qui pulse à la navigation (CSS-only fallback).

### Fly-to-cart (item 14, signature interaction)
- **Mécanique** : event custom `add-to-cart-fly` dispatché par `AddToCartButton`
  avec coordonnées x,y de l'élément cliqué. `FlyToCart` component écoute, monte
  un petit biscuit doré (24×24 div radial gradient) qui arc Bézier vers l'icône
  panier (référence DOM par id `#cart-icon`).
- **Animation** : 600ms easeOut, scale 1 → 0.4, opacité 1 → 0.85 → 0, arc via
  keyframes path. Cart icon "bumps" (scale 1.15 → 1) à l'arrivée.
- **Reduced motion** : pas d'animation, juste un toast.

### Toast Sonner themed (item 15)
- **Lib** : `sonner` (~6 KB gz) chargée dans root layout.
- **Theming** : custom CSS via classNames option pour matcher cream-light bg,
  honey-dark border, biscuit gold icon SVG.
- **Wire-up** : `AddToCartButton` → toast.success("Ajouté au panier") avec
  icône biscuit après le fly-to-cart. Newsletter form pareil.

## Dependencies (à installer cette phase)

```
pnpm add framer-motion sonner
```

Bundle impact estimé : framer-motion ~32 KB gz, sonner ~6 KB gz. Total +38 KB
sur shared OU dynamic — on importera framer-motion uniquement côté client
(client components) donc l'impact sur la home (la majorité côté server) sera
limité aux chunks client.

## Composants touchés

| Fichier | Action |
|---|---|
| `components/motion/Reveal.tsx` | NEW — wrapper framer-motion fade+translate |
| `components/motion/PageTransition.tsx` | NEW — crossfade entre routes |
| `components/motion/FlyToCart.tsx` | NEW — mount global pour biscuit doré arc |
| `components/motion/ToastProvider.tsx` | NEW — wraps sonner Toaster avec brand theming |
| `app/[locale]/layout.tsx` | EDIT — wrap children avec PageTransition + monter ToastProvider + FlyToCart |
| `components/home/Hero.tsx` + Story/Coffrets/Newsletter | EDIT — wrap blocks in Reveal |
| `components/shop/AddToCartButton.tsx` | EDIT — dispatch fly event + toast |
| `components/common/NewsletterForm*.tsx` | EDIT — toast au success |
| `components/layout/CartIcon.tsx` | EDIT — id="cart-icon" + bump animation receiver |
| `tests/unit/components/Reveal.test.tsx` | NEW — smoke render |

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| framer-motion explose le bundle homepage | Reveal est server-rendered wrapper → motion lib chargé uniquement dans le client chunk de la page. Mesure post-phase. |
| Page transitions cassent SSR Next 15 | On utilise `motion.div` minimaliste sans `AnimatePresence` (qui requiert client root) — accepte un "swap" simple. |
| FlyToCart event ne trouve pas #cart-icon | guards : si pas trouvé, on skip silencieusement, juste toast |
| Toaster Sonner conflict CSS | Custom richColors=false + theme tokens via globals.css |

## Bundle target

Homepage : 197 KB → ≤ 235 KB (delta ≤ +38 KB acceptable pour motion + toast).
Shared : 102 KB → ≤ 115 KB.

## Validation

- tsc 0, lint 0, vitest verts + 2 nouveaux tests
- build success, bundle dans target
- e2e home reste vert (no breaking)

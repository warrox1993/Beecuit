# Phase 4C — Products & Listings — Design Spec

**Date :** 2026-05-25
**Items roadmap :** 9-11 (ProductCard, CoffretCard, Filtres catégorie)
**Brand :** Au Fil des Saveurs — féminin premium artisanal

## Vision

Appliquer le langage visuel Phase 4B (cordage, gold accents, frame ornemental,
hover gold) aux composants catalogue les plus vus après la homepage.

## Décisions design

### ProductCard premium (item 9)
- **Image** : aspect-[4/5] rounded-2xl, ring inner gold subtle au hover, frame
  doré 1px offset comme le Hero
- **Hover effects** : `scale-[1.015]` sur image + apparition d'un mini CornerScallop
  doré top-right + ring honey-dark/30
- **Prix** : dans un cartouche ornemental (bordure honey-dark/20 + chevrons),
  font-display
- **Layout** : nom Fraunces 1.1rem + category eyebrow + price block bottom

### CoffretCard "boîte cadeau" premium (item 10)
- **Image** : aspect-[4/5] avec scrim chocolat bas + Eyebrow "Coffret" en
  badge gold ornemental top-left
- **Hover** : overlay révèle composition (3 premiers biscuits) en stack
  Fraunces italic + Pinyon « inclus » accent
- **Card body** : ruban gold horizontal subtil sous l'image, nom Fraunces +
  short description, prix avec strikethrough si discount
- **Border** : honey-dark/15 → honey-dark/45 au hover

### Filtres catégorie pills (item 11)
- **Style** : pills `rounded-full` honey-dark/cream active, warm-brown/30 border
  inactive, hover honey-dark/60 border + cream-light bg
- **Variants** : sidebar (desktop colonne) + chips (mobile horizontal scroll)
- **Layout sidebar** : préfixé par mini DotFlourish + eyebrow "Filtrer"

## Composants touchés

| Fichier | Action |
|---|---|
| `components/shop/ProductCard.tsx` | REWRITE — premium frame + hover gold + price cartouche |
| `components/shop/CoffretCard.tsx` | REWRITE — composition reveal hover + ruban gold |
| `components/shop/CategoryFilter.tsx` | RESTYLE — pills sidebar + chips honey-dark/cream |
| `lib/queries/catalog.ts` | EXTEND — `listCoffretsForLocale` expose `breakdownNames` (3 noms biscuits) pour hover |
| `messages/{fr,nl,en,de}.json` | ADD — `shop.coffretIncludes` |

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Listing biscuits régresse visuellement | Tests e2e `out-of-stock.spec.ts` reposent sur le badge stock — préserver |
| CoffretCard hover trop chargé | Reveal sobre, max 3 biscuits, fade-in 250ms |
| Bundle augmente | ProductCard reste server component, zéro nouvelle dep |

## Bundle target

- `/[locale]/biscuits` baseline = 120 KB. Cible ≤ 125 KB.
- `/[locale]/coffrets` baseline = 111 KB. Cible ≤ 116 KB.

## Validation

- tsc 0, lint 0, vitest verts
- build success
- e2e `out-of-stock.spec.ts` + `coffret-purchase.spec.ts` verts

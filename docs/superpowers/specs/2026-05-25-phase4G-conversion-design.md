# Phase 4G — Key pages & Conversion — Design Spec

**Date :** 2026-05-25
**Items roadmap :** 26-30

## Décisions design

### Button states polished (item 26)
- Étendre `Button` shadcn avec un wrapper `BrandButton` (ou ajout variants
  `loading` + `success` + `error-shake`)
- Plus simple : ajouter classes utility CSS dans globals.css :
  - `.btn-loading` : disable + spinner inline
  - `.btn-success` : flash leaf bg + ✓ swap
  - `.btn-error-shake` : keyframe shake 250ms
- AddToCartButton intègre déjà loading (via "…") — on remplace par vrai spinner
  + animation success bump (déjà via Toast).
- Newsletter forms : `submit` state visuel similaire.

### Form validation inline (item 27)
- FormField (Phase 4E) ajoute déjà state error/success.
- On wire un exemple : email validation client-side dans NewsletterFormRefined
  → si email malformé → state="error" + checkmark X animated.
- Création d'un mini hook `useEmailValidation`.

### Notre Histoire redesign (item 28)
- Remplacer ComingSoonPage par vraie page éditoriale scroll storytelling :
  - Hero : grande image + heading "Notre histoire" Pinyon Script "Maison"
  - 3 sections alternées image gauche/droite avec pull-quotes Fraunces italic
  - Signature manuscrite à la fin (Pinyon Script)
- i18n : 4 locales — peu de texte, on garde un FR riche + 3 traductions courtes.

### Biscuit detail (item 29)
- Lightbox image : ajouter modal Sheet (top) qui zoom l'image active
- Section "Pairing suggestions" en bas : 3 badges (café / thé / vin rouge)
  + petit texte Fraunces italic
- Tout en server-side rendering, lightbox = client component minimal.
- Trade-off : on fait Pairing comme **section statique** (pas DB) basée sur
  type de biscuit déterminé via categorySlug. Mapping en `lib/pairings.ts`.

### Checkout flow polish (item 30)
- Stepper visuel 3 étapes (panier → livraison → paiement → confirmation) en haut
  du checkout : ornement minimal RopeDivider + numéros encerclés gold.
- Trust badges en dessous de OrderSummary : "Paiement sécurisé Stripe", "Livraison 24h",
  "Sans frais cachés" — 3 inline SVG + texte petit.
- Sticky summary droite : déjà semi-sticky via grid — on ajoute `md:sticky md:top-28`.

## Composants touchés

| Fichier | Action |
|---|---|
| `app/globals.css` | ADD `.btn-loading`, `.btn-success`, keyframe shake |
| `components/shop/AddToCartButton.tsx` | UPDATE — inline spinner + transient success bump |
| `components/common/NewsletterFormRefined.tsx` | UPDATE — email validation client + error state |
| `components/shop/ProductImages.tsx` | UPDATE — lightbox via Sheet/Dialog |
| `components/shop/PairingSuggestions.tsx` | NEW — 3 inline badges based on categorySlug |
| `lib/pairings.ts` | NEW — mapping categorySlug → pairing types |
| `app/[locale]/(shop)/biscuits/[slug]/page.tsx` | ADD pairing section |
| `components/shop/CheckoutStepper.tsx` | NEW — 4-step indicator |
| `components/shop/CheckoutTrustBadges.tsx` | NEW — 3 trust SVG + text |
| `app/[locale]/(shop)/checkout/page.tsx` | INSERT stepper + trust badges + sticky summary |
| `app/[locale]/(shop)/notre-histoire/page.tsx` | REWRITE — scroll storytelling page |
| `components/common/NotreHistoireContent.tsx` | NEW — sections content (in code, FR primary, translated) |
| i18n | ADD `histoire.*`, `checkout.steps.*`, `checkout.trust.*`, `pairing.*` |

## Scope cuts (assumés)

- **Lightbox** : version simple (modal full-screen avec image + close), pas zoom/pan.
- **Notre Histoire** : 1 hero + 2 sections + 1 signature, pas 5 sections complètes.
- **Stepper** : décoratif, pas de logique navigation back (déjà géré par /panier).

## Bundle target

Homepage : 246 → ≤ 250 KB.

## Validation

- tsc 0, lint 0, vitest verts
- e2e checkout reste vert

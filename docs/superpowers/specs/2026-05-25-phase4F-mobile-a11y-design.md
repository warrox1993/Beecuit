# Phase 4F — Mobile & Accessibility — Design Spec

**Date :** 2026-05-25
**Items roadmap :** 21-25

## Décisions design

### Mobile Sheet/Drawer polish (item 21)
- Sheet existe déjà via Radix Dialog + slide-in-right. On améliore :
  - Themed bg cream-light + border-l honey-dark/15
  - Header avec mini Logo + close button refined
  - Swipe-to-close gesture via `framer-motion` drag listener on a wrapper
    inside SheetContent (handle bar visuel en haut comme un iOS sheet)
- MobileNav reçoit handle bar + drag-y-down to close (only when scrolled to top)

### Mobile bottom nav (item 22)
- Nouveau composant `MobileBottomNav` : fixed bottom, 4 quick links
  (Boutique, Coffrets, Panier, Compte), visible uniquement mobile (md:hidden),
  bg cream-light/95 backdrop-blur, border-t honey-dark/20, h-14.
- Icons : SVG inline (shop bag, gift, basket, user)
- Active state : honey-dark color + tiny dot indicator under icon
- Auto-hide on scroll down (optional later — V1 = always visible)
- Mounted dans `(shop)/layout.tsx`. Page content gets `pb-16 md:pb-0` to clear.

### Touch alternatives au hover (item 23)
- Audit hover states qui n'ont pas d'équivalent tap :
  - CoffretCard composition reveal : ajouter `focus-within:max-h-44 focus-within:opacity-100`
    pour clavier + tap (Link itself can be focused).
  - ProductCard hover gold : déjà visible au tap via `:active`.
- Ajouter `@media (hover: none)` partout où le hover-reveal cache une info
  importante : forcer le revealed state par défaut sur touch devices.

### Accessibility audit (item 24)
- Skip-to-content link en haut du `(shop)/layout.tsx` : `href="#main"`, `sr-only`
  qui devient visible au focus.
- Toutes les images Image/img : alt présent et descriptif.
- ARIA roles/labels : `nav aria-label`, formulaires labels, modals (Sheet OK Radix).
- Logo decorative inside MobileBottomNav : `aria-hidden`.
- Header h1 sur la home (déjà OK avec Hero) — vérifier qu'on n'a qu'un seul h1 par page.
- Le `<main>` doit avoir `id="main"` et `tabIndex={-1}` pour skip-link.

### WCAG AA contrast validation (item 25)
- Vérifs critiques :
  - `text-warm-brown/60` sur cream → ratio ?
  - `text-warm-brown/55` sur cream-light → ratio ?
  - honey-dark sur cream → ratio (CTAs links) ?
- Si en dessous de 4.5:1 (text normal) ou 3:1 (text large), remonter l'opacité.
- Sample manuel : utiliser des couleurs full plutôt que opacity-based pour les textes (préférer un gris défini).

## Composants touchés

| Fichier | Action |
|---|---|
| `components/layout/MobileNav.tsx` | ENHANCE — themed bg, handle bar, drag-to-close (framer-motion) |
| `components/layout/MobileBottomNav.tsx` | NEW |
| `app/[locale]/(shop)/layout.tsx` | ADD skip-link + id=main + mount MobileBottomNav + pb-16 |
| `components/shop/CoffretCard.tsx` | ADD focus-within reveal + @media hover:none default reveal |
| `app/globals.css` | ADD skip-link visible-on-focus styles |
| i18n | ADD `nav.bottomBoutique/Coffrets/Panier/Compte` + `a11y.skipToContent` |
| `tests/unit/components/MobileBottomNav.test.tsx` | NEW |

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Drag-to-close conflict avec scroll vertical | Limiter drag à un handle area (h-2) en haut du sheet |
| Bottom nav cache du contenu en bas de page | Ajouter `pb-16 md:pb-0` au main + tester avec checkout sticky |
| WCAG fix remonte opacity et change le ton | Toléré — clarté > nuance |

## Bundle target

Homepage : 246 → ≤ 252 KB.

## Validation

- tsc 0, lint 0, vitest verts + 1 nouveau test
- Lighthouse a11y >= 95 (à valider hors session)

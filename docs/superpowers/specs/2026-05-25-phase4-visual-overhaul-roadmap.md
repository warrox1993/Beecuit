# Phase 4 — Visual Overhaul « Au Fil des Saveurs » — Roadmap

**Date :** 2026-05-25
**Statut :** Roadmap validée, brainstorm Phase 4A à démarrer
**Brand cible :** Au Fil des Saveurs — Biscuiterie Fine & Gourmet (féminin premium artisan)
**Phase précédente :** Phase 2 B2B (Phase 3 3D abandonnée le 2026-05-25)

## Contexte stratégique

Le site actuel fonctionne mais utilise le nom de travail "BeeCuit" sans identité visuelle aboutie. La cliente a validé le nom commercial **"Au Fil des Saveurs"** avec une direction esthétique **féminine premium artisanale** (références : Pierre Hermé, Ladurée, La Mère Poulard).

Photos de référence reçues : sticker rond chocolat foncé + or, logo calligraphique avec toque de chef minimaliste, cordage ornemental, baseline "BISCUITERIE FINE & GOURMET". Les fichiers vectoriels finaux du logo n'ont pas encore été fournis par la cliente — un placeholder SVG sera créé.

## Vision

Transformer le site d'un e-commerce générique fonctionnel en une vitrine premium féminine artisanale qui :
- porte l'identité **Au Fil des Saveurs** de manière cohérente sur tous les points de contact ;
- respecte les codes du segment biscuiterie artisanale haut de gamme ;
- fait vivre l'interface par des animations subtiles, pas des effets gratuits ;
- couvre 100 % mobile + accessibilité (souvent négligés en V1).

## Décomposition en 7 phases · 30 items

### Phase 4A — Brand Foundation (~3-4j, prioritaire)
Pose les fondations visuelles. Toutes les phases suivantes en dépendent.

1. **Renommage complet** "BeeCuit" → "Au Fil des Saveurs" : translations FR/NL/EN/DE, metadata, footer, manifest, emails, README, package.json.
2. **Palette CSS vars affinée** féminin premium : cream dominant, soft-rose en touches, honey-dark or, warm-brown profond, ajout `--color-brand-chocolate` pour CTAs/accents.
3. **Typo system** : ajouter Pinyon Script (Google Fonts), garder Fraunces, formaliser hiérarchie `display/heading/body/script/caption` avec règles d'usage.
4. **Logo wordmark placeholder SVG** : composition "Au Fil des Saveurs" en serif caps + script italique, toque chef simplifiée, à remplacer par les fichiers cliente quand disponibles.

### Phase 4B — Homepage Refresh (~4-5j)
La page d'accueil est le premier impact, refonte éditoriale.

5. **Hero redesign** éditorial féminin asymétrique, calligraphie sur le mot "Saveurs", image grand format soignée, CTA primaire honey + secondaire ghost.
6. **StoryTeaser** repensée façon magazine artisan : pull-quote calligraphique, photo plein cadre, signature manuscrite.
7. **CoffretsTeaser** layout horizontal premium mettant en avant les 4 coffrets, hover qui révèle la composition.
8. **NewsletterCTA** redesign en forme ovale ornementale, copy chaleureux, input refined.

### Phase 4C — Products & Listings (~3-4j)
La majorité des pages catalogue.

9. **ProductCard redesign** carte arrondie premium, image hero plus grande, hover gold subtil, prix dans bordure ornementale.
10. **CoffretCard redesign** ressentir "boîte cadeau", aperçu des biscuits inclus au hover.
11. **Filtres catégorie** pills élégantes honey/cream au lieu de boutons rectangulaires.

### Phase 4D — Motion & Polish (~3j)
Fait vivre l'interface une fois la base posée.

12. **Reveal-on-scroll** Framer Motion partout, durée 0.5s ease-out, stagger sections.
13. **Page transitions** crossfade subtil + ligne gold tracée entre routes.
14. **Fly-to-cart** mini biscuit doré arc 500ms (signature interaction).
15. **Toast Sonner** themed honey-cream avec icône biscuit gold (success/error/info).

### Phase 4E — UI Polish & Details (~3-4j)
Finitions invisibles mais critiques.

16. **Sticky header** shrink + backdrop-blur + logo qui se réduit au scroll.
17. **Footer redesign** 3 colonnes (navigation + bio atelier + social) + copy chaleureux + copyright fin.
18. **Forms polish** focus rings honey-dark accessible, labels flottantes, success/error states themed.
19. **Loading skeletons** themed honey-cream (ProductGrid, CoffretGrid, autres listes).
20. **Empty states** chaleureux avec ornement SVG + copy invitant (panier vide, commandes, cartes-cadeaux).

### Phase 4F — Mobile & Accessibility (~4j)
Souvent oublié, critique pour 60 %+ trafic + compliance.

21. **Mobile Sheet/Drawer** animations refined (slide-in droite, backdrop fade, swipe-to-close gesture).
22. **Mobile bottom nav** pour quick access (Boutique, Coffrets, Panier, Compte).
23. **Touch-friendly hover alternatives** (long-press feedback, pas d'orphan `:hover` states sur mobile).
24. **Accessibility audit complet** : skip-to-content, ARIA labels/roles formulaires/modals, keyboard navigation, screen reader test.
25. **WCAG AA contrast** validation tous textes/buttons + corrections.

### Phase 4G — Key pages & Conversion (~4-5j)
Drive le revenu.

26. **Button states polished** : default → loading spinner → success ✓ → error shake, sur tous les CTAs.
27. **Form validation inline** avec checkmark vert / X rouge animated + messages chaleureux.
28. **Notre Histoire redesign** en parcours scroll storytelling : sections alternées image/texte, pull-quotes, signature finale.
29. **Biscuit detail** : image lightbox + section "Pairing suggestions" (café/thé/vin).
30. **Checkout flow polish** : stepper visuel (panier → livraison → paiement → confirmation), trust badges discrets, summary sticky droite.

## Estimation totale

~24-29 jours de dev répartis sur 7 sprints. Validation visuelle par la cliente entre chaque phase. Chaque phase a son propre cycle complet : brainstorm détaillé → spec → plan → implémentation → revue → commit/deploy.

## Stack & contraintes globales

- **Aucune nouvelle dépendance majeure** au-delà de : `framer-motion` (anim), `sonner` (toast), `@radix-ui/react-tooltip` (tooltips) — total ≤ +50 KB First Load JS sur l'ensemble.
- **Aucune migration DB**.
- **Aucune nouvelle env var**.
- **Reduced-motion respecté** systématiquement, fallback CSS-only où Framer Motion pas pertinent.
- **WCAG AA minimum** sur tous les éléments interactifs.
- **Bundle target homepage** : ≤ 250 KB First Load JS à la fin du programme (actuellement ~190 KB).

## Workflow par phase

1. Brainstorm détaillé (skill `superpowers:brainstorming`) → décisions visuelles précises pour la phase.
2. Spec écrite dans `docs/superpowers/specs/2026-MM-DD-phase4{X}-{topic}-design.md`.
3. Plan d'implémentation dans `docs/superpowers/plans/2026-MM-DD-phase4{X}-{topic}.md`.
4. Implémentation tâche par tâche avec commits fréquents.
5. Smoke local + bundle audit + screenshot.
6. Push → Vercel preview → revue cliente → corrections → merge à `main`.
7. Memory update (`project_phase4{X}_done.md`).

## Risques transversaux

| Risque | Mitigation |
|---|---|
| Logo cliente arrive tard / change tout | Placeholder SVG dès Phase 4A, swap trivial quand fichiers reçus. |
| Cliente demande changements de palette | Tous les colors via CSS vars, modification 1 fichier `globals.css`. |
| Bundle explose | Audit après chaque phase, refactor immédiat si > +15 KB / phase. |
| Pas de retour cliente entre phases | Continue sur phase suivante en parallèle, garde la branche merge-ready pour rollback rapide. |
| Surcharge motion / utilisateur trouve "trop animé" | Toutes les anim derrière `useReducedMotion()` + variables CSS pour scale globale (0.85× si besoin). |

## Prochaine étape

**Brainstorm Phase 4A — Brand Foundation** maintenant. Suivi par écriture de la spec 4A + plan 4A + implémentation.

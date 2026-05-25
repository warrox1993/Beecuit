# Au Fil des Saveurs — Style Guide

> Phase 4A foundation document. Updated when palette/typo evolves.

## Brand

- **Nom commercial** : Au Fil des Saveurs
- **Baseline** : Biscuiterie Fine & Gourmet
- **Ton** : Féminin premium artisanal — références Pierre Hermé, Ladurée
- **Maison** : Liège (Belgique)

## Palette (CSS vars dans `app/globals.css`)

### Couleurs brutes

| Variable | Valeur | Usage |
|---|---|---|
| `--color-cream` | `#fbf6ee` | Background dominant des pages |
| `--color-cream-light` | `#fdfaf3` | Cards elevated, surfaces secondaires |
| `--color-cream-gold` | `#c9a368` | Texte / icônes sur fond chocolat |
| `--color-warm-brown` | `#4a332a` | Texte body courant |
| `--color-brand-chocolate` | `#2c1810` | CTAs primaires forts, footer, accents profonds |
| `--color-honey` | `#e4a11b` | Or accent vif |
| `--color-honey-dark` | `#b07a0e` | Or accent profond, hover, liens |
| `--color-soft-rose` | `#e8d2c5` | Accent féminin subtil — borders, dividers |
| `--color-cookie` | `#c68b5a` | Accent moyen, tags |
| `--color-leaf` | `#708b58` | Indicateurs bio / naturel, success state |
| `--color-terracotta` | `#c97757` | Accent secondaire |

### Tokens sémantiques (préférés pour les nouveaux composants)

Les composants Phase 2 utilisent encore les couleurs brutes (`bg-cream`,
`text-warm-brown`). Les composants Phase 4B+ doivent utiliser les tokens
ci-dessous pour permettre un futur re-skin sans toucher au markup.

| Token Tailwind | Pointe vers | Usage |
|---|---|---|
| `text-text-primary` | `--color-warm-brown` | Texte body courant |
| `text-text-muted` | `rgb(74 51 42 / 0.7)` | Texte secondaire |
| `text-text-inverse` | `--color-cream-gold` | Texte sur fond chocolat |
| `text-text-accent` | `--color-honey-dark` | Liens, accents textuels |
| `bg-surface` | `--color-cream` | Background pages |
| `bg-surface-elevated` | `--color-cream-light` | Cards elevated |
| `bg-surface-inverse` | `--color-brand-chocolate` | Footer, sections sombres |
| `bg-cta-primary` | `--color-honey-dark` | Boutons primaires |
| `bg-cta-primary-hover` | `--color-brand-chocolate` | Hover boutons primaires |
| `border-border-subtle` | `rgb(74 51 42 / 0.1)` | Borders cards, dividers fins |
| `border-border-accent` | `--color-honey-dark` | Borders accents |
| `bg-accent-feminine` | `--color-soft-rose` | Accent féminin discret |
| `bg-accent-gold` | `--color-cream-gold` | Accent doré chaud |

Les tokens legacy `text-ink`, `bg-surface-elev`, `border-brand-border`,
`text-brand-accent`, `text-brand-accent-strong` sont conservés pour rétro-
compatibilité — éviter dans le nouveau code.

## Typographie

### Fonts (chargées via `next/font/google` dans `app/layout.tsx`)

| Variable CSS | Font | Usage |
|---|---|---|
| `var(--font-display)` → `font-display` | **Fraunces** (variable, opsz axis) | H1, H2, hero, headings prominents, body courant |
| `var(--font-script)` → `font-script` | **Pinyon Script** | Mots-clés émotionnels, accents poétiques |
| `var(--font-body)` → font par défaut | **Inter** | Paragraphes UI, texte courant non-éditorial |
| `var(--font-mono)` → `font-mono` | JetBrains Mono | Code, identifiants techniques |

### Règles d'usage de la script font

Pinyon Script est calligraphique et flowing — magnifique mais fragile. Pour
préserver l'élégance :

- **1 mot script par paragraphe maximum** — sinon ça devient illisible et
  "mariage amateur".
- **Tailles ≥ 24 px** uniquement — en dessous, les liaisons fines de Pinyon
  Script perdent leur lisibilité.
- **Mots types** : « Saveurs », « Découvrir », « Composer », « Nos histoires »,
  « Atelier », « Création », « Maison ».
- **Couleur conseillée** : `text-honey-dark` (or profond) sur fond cream, ou
  `text-cream-gold` sur fond chocolat.

### Exemple

```tsx
<h1>
  <span className="font-display">Découvrez nos</span>{" "}
  <span className="font-script text-honey-dark text-6xl">Saveurs</span>
</h1>
```

## Logo

Composant `<Logo>` dans `components/brand/Logo.tsx` avec 3 variantes :

| Variante | viewBox | Usage |
|---|---|---|
| `variant="full"` | 240 × 240 | Footer, pages institutionnelles. Composition complète : toque chef + AU FIL DES + Saveurs script + baseline + cordage ornemental |
| `variant="wordmark"` | 280 × 90 | Header sticky, pages d'auth. Sans toque ni baseline |
| `variant="mark"` | 64 × 64 | Favicon, social cards, bottom nav mobile. Toque seule dans un cercle |

**Théming** : via `currentColor` — passe une classe `text-*` au composant pour
contrôler la couleur de tous les traits/textes SVG.

```tsx
<Logo variant="wordmark" className="text-warm-brown h-10 w-auto" />
<Logo variant="full" className="text-cream-gold h-32" /> {/* sur fond chocolat */}
```

**Placeholder** : ce SVG est un placeholder ; le fichier final cliente le
remplacera (drop-in : même API). Les ornements de cordage s'inspirent du
sticker doré sur boîte chocolat (référence cliente).

## Animations (Phase 4D)

À venir — pour l'instant, aucune animation custom au-delà des transitions CSS
par défaut sur hover.

## TODO

- [ ] Régénérer favicon depuis `<Logo variant="mark">` ou utiliser fichier
  cliente quand reçu.
- [ ] Mettre à jour les noms de produits Stripe dans le dashboard
  (BeeCuit → Au Fil des Saveurs) avant launch commercial.
- [ ] Réinscrire les handles social `@aufildessaveurs` (Instagram, Facebook)
  ou ajuster les URLs si la cliente garde un autre handle.
- [ ] Migrer le domaine Vercel (`beecuit.vercel.app` → `aufildessaveurs.be` ou
  `.vercel.app`) au launch.

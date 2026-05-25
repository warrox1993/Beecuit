# Phase 4B — Homepage Refresh — Design Spec

**Date :** 2026-05-25
**Items roadmap :** 5-8 (Hero, StoryTeaser, CoffretsTeaser, NewsletterCTA)
**Brand :** Au Fil des Saveurs — féminin premium artisanal
**Refs :** Pierre Hermé, Ladurée, La Mère Poulard

## Vision

Transformer la homepage actuelle (sections symétriques en grid 2-col, palette honey/cream classique) en une expérience éditoriale magazine où chaque section a une composition asymétrique distincte et un ornement signature (cordage gold rappelant le logo). La page doit ressembler à un encart presse féminin gourmand, pas à un template SaaS.

## Décisions design

### Ornements partagés
Création d'un module `components/brand/Ornaments.tsx` exposant :
- `<RopeDivider>` — filet horizontal cordage gold (8 px haut), variants `wave|straight|scallop`. Inspiration : cordage du sticker logo.
- `<CornerScallop>` — petit ornement coin (scallops dorés), variants `tl|tr|bl|br`.
- `<DotFlourish>` — séparateur trois losanges dorés centré (◊ • ◊).

Tous : SVG pure, `currentColor`, prop `className`.

### Hero (item 5)
- **Layout** : asymétrique `md:grid-cols-[7fr_5fr]` avec overlap image-texte. Eyebrow en haut surmonté d'un mini cordage SVG.
- **Typographie** :
  - Eyebrow (Inter caps wide spacing) « Maison liégeoise · 2026 »
  - H1 Fraunces display 6vw : « Le biscuit belge, fait à la main. »
  - Calligraphie « Saveurs » Pinyon Script honey-dark, ~7rem, positionnée en accent au-dessus du titre, légèrement décalée à gauche en negative margin, comme une signature.
  - Prose Fraunces body, leading généreux
- **CTAs** : primaire `bg-cta-primary` (honey-dark) → hover `bg-cta-primary-hover` (brand-chocolate). Secondaire ghost `text-warm-brown` border subtle, hover warm-brown bg.
- **Image** : `aspect-[3/4]` rounded-2xl avec frame doré 1px à 6px d'offset (effet boîte cadeau), CornerScallop top-right. Image conservée actuelle pour Phase 4B (changement contenu différé).
- **Background** : `bg-surface` (cream) avec grain noise subtil via SVG inline data-uri (≤ 200 octets) en overlay.

### StoryTeaser (item 6)
- **Layout** : image carrée à gauche déborde de 30 px hors container (overflow visible), texte droite décalé vers le bas (alignement vertical bottom).
- **Eyebrow** suivi d'un séparateur DotFlourish à gauche.
- **Heading** Fraunces h2 + script « histoire » accent
- **Pull-quote** : citation Fraunces italic 1.5rem entre deux RopeDivider, signature script « — La Maison » Pinyon Script
- **CTA** : lien souligné honey-dark avec underline-offset généreux

### CoffretsTeaser (item 7)
- **Refactor** : passe d'un layout image-texte à un layout horizontal premium 4 mini-cards "boîte cadeau" + 1 colonne titre + CTA à gauche.
- **Cards** : `aspect-[3/4]` rounded-xl, ruban gold horizontal en bas (effet ruban boîte cadeau), nom coffret centré, hover gold ring + révélation 2-3 ingrédients composition.
- **Données** : statique pour Phase 4B (4 noms placeholder + emoji 🎁 si pas d'image). Wire-up aux vrais coffrets DB en Phase 4C (item 10).
- **Layout** : `md:grid-cols-[3fr_8fr]` avec scroll horizontal optionnel sur mobile.

### NewsletterCTA (item 8)
- **Forme** : container `rounded-[2.5rem]` (effet pilule ovale) sur `bg-surface-elevated`, padding très généreux, max-w-3xl centré.
- **Ornements** : RopeDivider wave en haut + bas, dot flourish au centre top.
- **Heading** : « Reçois nos » + script « nouveautés » + « et un —10 % à la première commande »
- **Input** : refined avec border-bottom uniquement (pas de boîte rectangulaire), focus ring honey-dark, button intégré arrow.
- **Disclaimer** italic warm-brown/60

## Composants touchés

| Fichier | Action |
|---|---|
| `components/brand/Ornaments.tsx` | NEW — RopeDivider, CornerScallop, DotFlourish |
| `components/home/Hero.tsx` | REWRITE — asymétrique + script + ornement |
| `components/home/StoryTeaser.tsx` | REWRITE — magazine layout + pull-quote |
| `components/home/CoffretsTeaser.tsx` | REWRITE — 4 mini-cards horizontal premium |
| `components/home/NewsletterCTA.tsx` | REWRITE — pilule ovale ornementée |
| `components/ui-primitives/Section.tsx` | EXTEND — ajout `bg="elevated"` token |
| `messages/{fr,nl,en,de}.json` | ADD — `coffretsList.{name1,name2,name3,name4}`, `storyPullQuote`, `storyPullQuoteSignature`, `heroScriptAccent` |
| `tests/unit/components/Ornaments.test.tsx` | NEW — 3 smoke tests SVG rendering |

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Pinyon Script déjà utilisé au-dessus du H1 + à plusieurs endroits → violation règle "1 mot script max par paragraphe" | Chaque section a 1 script max ; on respecte strictement |
| Image hero Unsplash pas en cohérence avec brand artisanale | Conservée Phase 4B, swap photos prévu en Phase 4G ou Phase post-launch |
| Bundle +KB sur homepage | Ornaments SVG inline (≤ 1 KB), zéro nouvelle dep cette phase |
| Coffrets statiques placeholder | Acceptable, raccord DB en Phase 4C item 10 |
| Tests e2e `home.spec.ts` reposent sur certains textes | Vérifier que `heroTitle` reste affiché, ajouter ids stables si besoin |

## Bundle target

Homepage `/[locale]` baseline = 207 KB First Load JS. Cible Phase 4B = ≤ 215 KB (delta ≤ +8 KB pour ornements SVG + nouveau markup).

## Validation

- `pnpm tsc --noEmit` 0 errors
- `pnpm lint` 0 errors
- `pnpm vitest run tests/unit` 56 + 3 nouveaux = 59 passants
- `pnpm build` success, homepage ≤ 215 KB
- Test e2e `home.spec.ts` reste vert

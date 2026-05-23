# BeeCuit — Phase 1 Polish Design Document

**Date :** 2026-05-23
**Statut :** Validé (brainstorming) — à confirmer avant implémentation
**Auteur :** Jean-Baptiste Dhondt + Claude (brainstorming session)
**Spec parente :** `docs/superpowers/specs/2026-05-22-beecuit-design.md`
**Phase 1 implementation plan :** `docs/superpowers/plans/2026-05-23-phase-1-ecommerce-base.md`
**Phase 1 completion report :** `docs/superpowers/plans/2026-05-23-phase-1-ecommerce-base-COMPLETE.md`

---

## 0. Contexte

Phase 1 (code complet sur branche `phase-1-ecommerce-base`) livre l'e-commerce de base fonctionnel : catalogue 4 langues, panier persistant, checkout Stripe, webhook idempotent, emails transactionnels, admin produits 4-traductions, etc. Tests verts (25 Vitest + 10 Playwright).

Côté visuel cependant, l'UI est volontairement minimale : couleurs honey/crème basiques, typographie système (Fraunces non chargée), cards produit fonctionnelles mais sans personnalité, hero homepage = juste un titre + CTA, photos = placeholders `picsum.photos` aléatoires. C'est "fonctionnel mais squelettique".

Ce polish vise à amener l'UI à un niveau **photographique premium gourmand** (références : Aesop, La Maison du Chocolat, Hotel Chocolat) — sans toucher au scope fonctionnel Phase 1 et sans empiéter sur la 3D prévue Phase 3.

**Règles :**
- Aucun changement de feature, aucune route nouvelle (sauf pages "Bientôt disponible" pour Coffrets, Abonnement, Journal, etc.)
- Direction visuelle "Photographique premium gourmand" : typo Fraunces présente, beaucoup de cream/blanc, photos en lumière dorée, espace généreux
- Photos réelles à fournir par Jean-Baptiste (8 photos produit + 1-2 photos lifestyle homepage) ; en attendant, fallbacks élégants (fonds cream/cookie unis)
- Pas de 3D, pas d'animations sophistiquées (Phase 3)

---

## 1. Périmètre

### Dans le polish Phase 1

| Brique | Contenu |
|---|---|
| Fondations | `next/font/google` (Fraunces + Inter), tokens typo/espace/couleurs sémantiques, primitives `Container/Section/Eyebrow/Heading/Prose` |
| Header | Sticky 80px, logo Fraunces 2xl, nav 4 liens (avec greyout futurs), dropdown locale compact, icône panier badge |
| Footer | 4-col desktop, newsletter placeholder, social icons, copyright |
| Homepage | 6 sections long-scroll : Hero / Featured 3 produits / Histoire / Coffrets teaser / Instagram grid / Newsletter |
| Catalogue `/biscuits` | Sidebar filtres desktop, grid 4/5 cards aérées, page header eyebrow |
| Fiche produit `/biscuits/[slug]` | Split 60/40, photo principale 1500×1500, thumbnails 5-col, sticky info, sections "Histoire" + "À découvrir aussi" |
| `/panier` | Polish typo + photo item ronde 100×100 + bouton checkout bottom |
| `/checkout` | Fieldsets stylés, inputs aérés, OrderSummary sticky avec ombre |
| `/commande-confirmee/[orderNumber]` | Illustration CSS ✓ + Fraunces "Merci !" + récap propre |
| `/compte` + sous-pages | Header eyebrow + H1, sidebar avec actif border-l honey, cards aérées |
| `/sign-in` | Centre vertical, card crème 480px, logo BeeCuit dessus |
| Pages "Bientôt" | `/coffrets`, `/abonnement`, `/journal`, `/notre-histoire`, `/contact`, `/entreprises`, `/cgv`, `/mentions-legales`, `/confidentialite`, `/cookies` : toutes en page "Bientôt disponible" stylée |

### Hors polish Phase 1 (explicite)

- Animations Framer Motion / GSAP / Lenis / smooth scroll → Phase 3
- Vraie 3D (configurateur, viewer, hero animé) → Phase 3
- Mega-menu header → V2
- Vraie newsletter back-end → Phase 4
- Vraies pages "Notre histoire", "FAQ", etc. avec contenu rédigé → Phase 4/5
- Google OAuth → V2 (magic link Phase 0 reste seul provider)
- Mode dark → hors V1

---

## 2. Direction visuelle

**Style :** photographique premium gourmand. Références :
- **Aesop** (aesop.com) : sobriété, typographie serif présente, grosse photo unique, beaucoup de blanc
- **La Maison du Chocolat** (lamaisonduchocolat.com) : gourmand luxueux, cream/dorures, photos chaleureuses
- **Hotel Chocolat** (hotelchocolat.com) : moderne premium, cards produit larges, lifestyle photo
- **Cereal Magazine** (readcereal.com) : magazine layout, typo éditoriale, asymétries calmes

**Caractéristiques :**
- Typo Fraunces très présente (titres énormes, italics ponctuels)
- Palette sourde : beaucoup de cream (`#FBF6EE`), honey (`#E4A11B`) en accent uniquement (CTA, prix), warm-brown (`#4A332A`) pour le texte (pas de noir pur)
- Espace généreux entre sections (py-24+)
- Photos carrées ou portrait (4/5) cadrées avec lumière dorée (golden hour), fond bois/lin/marbre clair, vapeur ou farine éventuelles, jamais de noir
- Animations très subtiles (juste hover scale 1.02, fade-in optionnel) — pas de mouvement bruyant

---

## 3. Photos — stratégie

Jean-Baptiste fournira **8 photos produit** (1500×1500, format carré) — une par produit seed (Spéculoos artisanal, Sablé chocolat noir, Macaron noisette, Cookies pépites chocolat, Galettes pur beurre, Spéculoos sans gluten, Florentins amandes, Spritz vanille) + **1-2 photos lifestyle** pour le hero homepage et la section "Notre histoire".

Workflow :
1. Le polish s'implémente avec les `picsum.photos` placeholders actuels (visuellement moyens mais l'UI fonctionne)
2. Jean-Baptiste uploade les vraies photos via `/admin/produits/[id]` → ImageUploader (déjà fonctionnel depuis Task 22)
3. Pour la photo hero homepage : ajoutée dans `public/images/hero.jpg` et référencée en dur dans le composant Hero (en attendant un admin pour les images marketing en Phase 4)

**Fallbacks en attendant les photos réelles :**
- Cards produit sans image : fond `bg-cookie/30` au lieu de `bg-soft-rose` pur (un peu plus chaud, moins criant)
- Hero homepage sans image : la photo droite est remplacée par un grand rectangle `bg-cookie/40 border border-warm-brown/10 rounded-2xl` avec un emoji 🍪 centré (charmant et pas grave si temporaire)

---

## 4. Fondations

### 4.1 Typographie

**Fonts via `next/font/google`** dans `app/layout.tsx` :

```typescript
import { Fraunces, Inter } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});
```

Body racine reçoit `className={`${fraunces.variable} ${inter.variable}`}`, le `font-family` dans `globals.css` lit ces variables CSS.

### 4.2 Échelle typographique

| Token Tailwind | Cas d'usage | Police / Taille / Tracking |
|---|---|---|
| `text-display` | Hero homepage, marketing key | Fraunces 500, `clamp(2.5rem, 6vw, 5rem)`, tracking `-0.02em`, line-height 1.0 |
| `text-h1` | H1 page (catalogue, produit, compte) | Fraunces 500, `clamp(2rem, 4vw, 3.5rem)`, tracking `-0.02em`, line-height 1.1 |
| `text-h2` | H2 section | Fraunces 500, `clamp(1.5rem, 3vw, 2.5rem)`, line-height 1.15 |
| `text-h3` | H3 card / accent | Fraunces 500, 1.25-1.5rem |
| `text-body-lg` | Lead paragraph, accent | Inter 400, 1.125rem, line-height 1.6 |
| `text-body` | Texte courant | Inter 400, 1rem, line-height 1.55 |
| `text-caption` | Aide, méta, sous-info | Inter 400, 0.875rem, color warm-brown/70 |
| `text-overline` | Eyebrow (au-dessus des titres) | Inter 600, 0.75rem, uppercase, tracking 0.1em, color honey-dark |

### 4.3 Espace

| Token | Valeur | Usage |
|---|---|---|
| `section-y-sm` | `py-12 md:py-16` | Sections compactes (newsletter footer) |
| `section-y` | `py-16 md:py-24` | Sections standard homepage |
| `section-y-lg` | `py-20 md:py-32` | Hero, sections marketing accent |
| `container-x` | `mx-auto max-w-6xl px-6 md:px-8` | Container standard (1152px) |
| `container-x-narrow` | `mx-auto max-w-3xl px-6 md:px-8` | Container narrow (768px, prose) |
| `card-padding` | `p-6 md:p-8` | Cards et panels |
| `gap-grid` | `gap-6 md:gap-8` | Grids produit |

### 4.4 Couleurs (palette Phase 0 + sémantiques)

Tokens Phase 0 (gardés tels quels) :
```
honey #E4A11B  honey-dark #B07A0E  cream #FBF6EE  terracotta #C97757
warm-brown #4A332A  cookie #C68B5A  soft-rose #E8D2C5  leaf #708B58
```

Ajouts sémantiques :
```
--color-surface       = var(--color-cream)
--color-surface-elev  = #FFFFFF
--color-ink           = var(--color-warm-brown)
--color-ink-muted     = rgb(74 51 42 / 0.7)
--color-border        = rgb(74 51 42 / 0.1)
--color-accent        = var(--color-honey)
--color-accent-strong = var(--color-honey-dark)
```

### 4.5 Composants primitifs

`components/ui-primitives/` :

- **`<Container variant="default | narrow">`** — wrapper standard ou prose-width
- **`<Section py="sm | md | lg" bg="default | surface-elev | cookie">`** — section avec rythme vertical et fond optionnel
- **`<Eyebrow>`** — overline `text-overline` honey-dark
- **`<Heading as="h1 | h2 | h3" size="display | h1 | h2 | h3">`** — applique Fraunces avec la bonne taille
- **`<Prose>`** — wrapper pour blocs de texte courant (Inter, max-w-prose, line-height confortable)

Ces 5 primitives suffisent à couvrir 95 % du polish.

---

## 5. Header redesigned

**Comportement :**
- Sticky `top-0 z-50`, fond `bg-cream/95 backdrop-blur-sm`
- Hauteur 80px fixe desktop, 64px mobile
- Border-bottom `border-warm-brown/10` permanent (subtile)
- Au scroll > 50px : ajoute `shadow-sm` (transition douce)

**Composition desktop (3 zones) :**

```
[ Logo BeeCuit ]    [ Nav centrée ]              [ FR ▼  🛒 (3) ]
   Fraunces 2xl       Inter 500 0.95rem            dropdown + icon
   honey color        warm-brown
```

**Nav links** : `Biscuits` / `Coffrets` (greyout cursor-not-allowed avec tooltip "Bientôt disponible" mais cliquable vers `/coffrets` page "Bientôt") / `Abonnement` (idem) / `Journal` (idem)

**Locale switcher** : remplace les 4 liens étalés actuels par un dropdown compact :
```
[ FR ▼ ]
  ┌──────┐
  │ FR   │  (actif souligné)
  │ NL   │
  │ DE   │
  │ EN   │
  └──────┘
```

**Cart icon** : reste l'emoji 🛒 (Phase 4 polish remplacera par un SVG custom), avec badge honey existant.

**Mobile** : nav remplacée par hamburger `☰` ouvrant un drawer slide-in droite (réutilise shadcn `Sheet` à installer).

**Fichiers à modifier :**
- `components/layout/Header.tsx` — refonte complète
- `components/layout/LocaleSwitcher.tsx` — passe en dropdown
- `components/layout/CartIcon.tsx` — inchangé (déjà bien)
- Nouveau : `components/layout/MobileNav.tsx` (drawer mobile)
- Nouveau : `components/layout/NavLink.tsx` (lien avec état actif et état "bientôt disponible")

---

## 6. Footer redesigned

**4 colonnes desktop, stacké mobile**, fond `bg-cream`, border-top warm-brown/10, py-16 :

```
┌────────────┬────────────┬────────────┬────────────────────┐
│ BRAND      │ BOUTIQUE   │ MAISON     │ AIDE & LÉGAL       │
│            │            │            │                    │
│ BeeCuit    │ Biscuits   │ Notre      │ FAQ                │
│ Fraunces   │ Coffrets   │ histoire   │ Livraison          │
│ 2xl       │ Abonnement │ Journal    │ Retours            │
│            │ Cartes     │ Contact    │ CGV                │
│ Tagline   │ cadeaux   │ B2B        │ Mentions légales   │
│ +adresse  │            │            │ Confidentialité    │
│ Liège      │            │            │ Cookies            │
│            │            │            │                    │
│ Horaires  │            │            │ NEWSLETTER         │
│ Mer-sam   │            │            │ [email____] [→]    │
│ 10-18h     │            │            │                    │
└────────────┴────────────┴────────────┴────────────────────┘
─────────── © 2026 BeeCuit · Made with ♥ in Liège · IG · FB
```

**Newsletter** : input email + bouton "S'inscrire" → Server Action stub qui retourne `{success: true}` sans rien stocker (Phase 4 fait le vrai back-end). Toast "Merci ! On te tient au courant".

**Social** : 2 icônes SVG inline (Instagram, Facebook), liens vers `#` Phase 1 (vrais comptes Phase 4).

**Fichier :** `components/layout/Footer.tsx` — refonte complète.

---

## 7. Homepage refondue — 6 sections

### Section 1 — HERO PLEIN ÉCRAN (min-h ~80vh)

**Layout :** 2 colonnes desktop (60/40), stacké mobile (texte d'abord, photo après).

**Gauche (60%, sticky vertical centre) :**
```
<Eyebrow>MAISON BEECUIT — LIÈGE</Eyebrow>
<Heading as="h1" size="display">
  Le biscuit belge,<br/>
  <em>fait à la main</em>.
</Heading>
<Prose>
  Spéculoos cuits doucement, sablés au beurre frais belge, macarons à la noisette
  du Piémont. Tout est fait à Liège, en petites quantités, pour préserver le goût.
</Prose>
<div className="flex gap-3">
  <Button primary>Découvrir nos biscuits →</Button>
  <Button secondary>Notre histoire</Button>
</div>
```

**Droite (40%) :** Photo 600×800 (ou 1200×1600 pour densité retina) — biscuits sur plan de travail bois doré, lumière 17h. Bord `rounded-2xl`, shadow-xl subtle.

### Section 2 — FEATURED (3 produits vedettes)

```
<Section py="lg">
  <Container>
    <Eyebrow>NOS BEST-SELLERS</Eyebrow>
    <Heading as="h2" size="h2">Les biscuits qu'on refait sans cesse</Heading>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-grid mt-12">
      [FeaturedCard × 3]   // version plus grande de ProductCard
    </div>
    <div className="mt-12 text-center">
      <Link href="/biscuits">Voir tout le catalogue →</Link>
    </div>
  </Container>
</Section>
```

Cards :
- Aspect 4/5 (au lieu de 1/1 catalogue) — plus magazine
- Photo top, eyebrow catégorie en dessous, nom Fraunces 1.5rem, prix Fraunces honey-dark 1.25rem
- Hover : `transform scale-[1.02] transition shadow-md`

**Logic :** filtre `products.isFeatured = true` (déjà 2 produits marqués dans seed : Spéculoos + Macaron). Si <3 produits featured, on prend les 3 plus récents.

### Section 3 — NOTRE HISTOIRE (split 50/50)

```
<Section py="lg" bg="surface-elev">
  <Container>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      [Photo atelier 800×800 rounded-2xl]
      <div>
        <Eyebrow>L'HISTOIRE</Eyebrow>
        <Heading as="h2" size="h2">Une maison liégeoise depuis 2026</Heading>
        <Prose>
          BeeCuit est née d'une obsession : faire du biscuit belge un objet de
          dégustation, pas un produit industriel. Dans notre atelier rue [...]
          à Liège, chaque fournée sort dorée à la main, surveillée à la minute.
        </Prose>
        <Link href="/notre-histoire">Lire l'histoire complète →</Link>
      </div>
    </div>
  </Container>
</Section>
```

### Section 4 — COFFRETS TEASER (placeholder)

```
<Section py="lg">
  <Container>
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow>BIENTÔT</Eyebrow>
      <Heading as="h2" size="h2">Composez votre coffret</Heading>
      <Prose>
        Choisis tes biscuits préférés, on assemble pour toi un coffret offert
        dans un emballage cadeau cire d'abeille recyclable. Disponible printemps 2026.
      </Prose>
      [Bouton greyout "M'avertir au lancement"]
    </div>
    <div className="mt-12 flex justify-center">
      [Mockup CSS isométrique d'une boîte 3D — juste rectangle perspective + shadow]
    </div>
  </Container>
</Section>
```

### Section 5 — INSTAGRAM GRID

```
<Section py="md">
  <Container>
    <div className="text-center mb-12">
      <Eyebrow>VIE DE BEECUIT</Eyebrow>
      <Heading as="h2" size="h2">Suivez-nous <a>@beecuit</a></Heading>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      [4 cards photos lifestyle aspect square, hover scale + overlay icon Instagram]
    </div>
  </Container>
</Section>
```

Placeholder : 4 fonds colorés (cookie/soft-rose/leaf/cream pleins) en attendant les vraies photos Instagram. Phase 4 branchera le vrai feed.

### Section 6 — NEWSLETTER (bande pleine largeur)

```
<Section py="lg" bg="cookie/20">   {/* fond teinté chaud */}
  <Container variant="narrow" className="text-center">
    <Heading as="h2" size="h2">
      Reçois nos nouveautés et un <em>-10 %</em> à la première commande
    </Heading>
    <form className="mt-8 flex max-w-md mx-auto gap-2">
      <input type="email" placeholder="ton@email.com" className="..." />
      <Button primary>S'inscrire</Button>
    </form>
    <p className="text-caption mt-4">
      Pas de spam, juste les nouveautés mensuelles. Désinscription en 1 clic.
    </p>
  </Container>
</Section>
```

**Fichier :** `app/[locale]/(shop)/page.tsx` — refonte complète, découpé en sous-composants `components/home/Hero.tsx`, `FeaturedProducts.tsx`, `StoryTeaser.tsx`, `CoffretsTeaser.tsx`, `InstagramGrid.tsx`, `NewsletterCTA.tsx`.

---

## 8. Catalogue `/biscuits`

### Page header

```
<Section py="lg" bg="surface-elev">
  <Container>
    <Eyebrow>NOTRE CATALOGUE</Eyebrow>
    <Heading as="h1" size="h1">Tous nos biscuits</Heading>
    <Prose>Découvre la sélection BeeCuit, cuite à Liège.</Prose>
  </Container>
</Section>
```

### Layout principal (desktop)

```
┌───────────────┬─────────────────────────────────────────┐
│  FILTRES      │  GRID PRODUITS                          │
│  (sticky)     │                                         │
│               │  [Card 4/5] [Card 4/5] [Card 4/5]      │
│  Catégorie    │  [Card 4/5] [Card 4/5] [Card 4/5]      │
│  ☑ Tous       │  ...                                    │
│  ☐ Sablés     │                                         │
│  ☐ Spéculoos  │                                         │
│  ☐ Chocolat   │                                         │
│  ...          │                                         │
└───────────────┴─────────────────────────────────────────┘
```

Sidebar `w-56` sticky, padding-y plus important entre les filtres. Liens checkbox styled `radio-like` (un seul actif à la fois pour Phase 1 — multi-sélection = Phase 2).

Mobile : sidebar disparait, redevient chips horizontaux scrollables au-dessus de la grid (comme actuellement).

### Card produit refondue

```tsx
<Link href="/biscuits/{slug}" className="group block">
  <div className="aspect-[4/5] overflow-hidden rounded-xl bg-cookie/30">
    [img full coverage + group-hover scale-[1.02] transition]
  </div>
  <div className="mt-4 space-y-1">
    <Eyebrow>{category.name}</Eyebrow>
    <Heading as="h3" size="h3" className="!text-lg !font-medium">{name}</Heading>
    <p className="text-honey-dark font-display text-lg">{price} €</p>
  </div>
  {isOutOfStock && <span badge top-right>ÉPUISÉ</span>}
</Link>
```

**Fichiers :**
- `app/[locale]/(shop)/biscuits/page.tsx` — layout 2-col, sidebar component
- `components/shop/CategoryFilter.tsx` — version sidebar verticale (et chip horizontal mobile via prop `variant`)
- `components/shop/ProductCard.tsx` — refonte aspect ratio + typo

---

## 9. Fiche produit `/biscuits/[slug]`

### Layout desktop (split 60/40)

```
┌──────────────────────────────────┬─────────────────────────┐
│  GALERIE PHOTOS                  │  INFO PRODUIT (sticky)  │
│                                  │                         │
│  [Photo principale 1500×1500]    │  <Eyebrow>SPÉCULOOS</…> │
│                                  │  <Heading h1>Spéculoos…│
│  ▢ ▢ ▢ ▢ ▢                       │  </Heading>             │
│  thumbnails 5-col 80×80          │                         │
│                                  │  <p prose>Le classique  │
│                                  │  belge…</p>             │
│                                  │                         │
│                                  │  6.90 €                 │
│                                  │  Fraunces 2rem           │
│                                  │  honey-dark              │
│                                  │                         │
│                                  │  [qty▼] [Ajouter au …→] │
│                                  │                         │
│                                  │  ✓ Livré en 24h Bpost   │
│                                  │  ✓ Cuit à Liège          │
│                                  │  ✓ Sans conservateur     │
│                                  │                         │
│                                  │  ▼ Ingrédients           │
│                                  │  ▼ Allergènes            │
│                                  │  ▼ Valeurs nutritionnelles│
└──────────────────────────────────┴─────────────────────────┘

[Section full-width "L'histoire de ce biscuit"]
[Section full-width "À découvrir aussi" — 4 cards produits liés]
```

### Section "À découvrir aussi"

Logique simple Phase 1 : 4 autres produits aléatoires de la même catégorie (ou catégorie nulle → 4 plus récents).

### Trust indicators

3 lignes après le prix :
```
✓  Livré en 24h Bpost
✓  Cuit à Liège
✓  Sans conservateur
```
Inter 0.875rem, icône check honey, ligne séparatrice subtle entre chaque.

### Accordéons (`<details>` déjà présents, polish style)

- `<summary>` Fraunces 1rem font-medium, padding y-3, icône `>` qui pivote au hover
- Border-top warm-brown/10 entre chaque
- Contenu en `<Prose>` ou tableau stylisé

**Fichiers :**
- `app/[locale]/(shop)/biscuits/[slug]/page.tsx` — refonte layout
- `components/shop/ProductImages.tsx` — thumbnails plus grands
- `components/shop/TrustIndicators.tsx` — nouveau composant
- `components/shop/RelatedProducts.tsx` — nouveau composant
- `lib/queries/catalog.ts` — ajout `listRelatedProducts(productId, locale, limit=4)`

---

## 10. Pages secondaires (polish léger)

### `/panier`

- Items en cards rounded-xl avec photo 100×100 ronde (au lieu de carré actuel)
- Quantity selector + bouton remove en colonne droite alignés
- Subtotal en footer card élevée
- Bouton "Passer commande" full-width sticky bottom mobile

### `/checkout`

- Fieldsets stylés : `<legend>` en Eyebrow, border-top subtle, gap interne 3-4
- Inputs : padding `py-3 px-4`, focus ring `ring-2 ring-honey/50 ring-offset-2`, transition
- OrderSummary sidebar : card élevée `shadow-md`, sticky top-24

### `/commande-confirmee/[orderNumber]`

```
<Section py="lg">
  <Container variant="narrow" className="text-center">
    <div className="mx-auto h-24 w-24 rounded-full bg-honey/10 flex items-center justify-center">
      <svg className="text-honey-dark"...checkmark 48px />
    </div>
    <Heading as="h1" size="h1" className="mt-8">Merci !</Heading>
    <Prose>Ta commande #{orderNumber} est confirmée. Tu recevras un email avec…</Prose>
    [Card récap items + total]
    [2 boutons : Continuer mes achats / Voir mes commandes]
  </Container>
</Section>
```

### `/compte` + sous-pages (`/compte`, `/compte/commandes`, `/compte/adresses`)

- Header page : Eyebrow "MON COMPTE", H1 page-specific
- Sidebar : items avec état actif `border-l-2 border-honey -ml-3 pl-3`
- Cards d'information : `rounded-xl border border-warm-brown/10 bg-surface-elev p-6`
- Empty states améliorés : illustration CSS simple + texte chaleureux

### `/sign-in`

```
<div className="min-h-[80vh] flex items-center justify-center bg-cream py-12">
  <Container variant="narrow" className="max-w-md">
    <Link href="/" className="block text-center mb-12">
      <Heading as="h1" size="h2" className="text-honey">BeeCuit</Heading>
    </Link>
    <Card className="bg-surface-elev p-8 rounded-2xl shadow-sm">
      <Heading as="h2" size="h3">Se connecter à BeeCuit</Heading>
      <Prose>Reçois un lien par email — pas de mot de passe à retenir.</Prose>
      <form>...</form>
    </Card>
  </Container>
</div>
```

### Pages "Bientôt disponible" (`/coffrets`, `/abonnement`, `/journal`, `/notre-histoire`, `/contact`, `/entreprises`, `/cgv`, `/mentions-legales`, `/confidentialite`, `/cookies`)

Toutes utilisent le même composant `<ComingSoonPage>` :

```
<Section py="lg">
  <Container variant="narrow" className="text-center">
    <Eyebrow>{eyebrow}</Eyebrow>
    <Heading as="h1" size="h1">{title}</Heading>
    <Prose>{description}</Prose>
    <p className="text-honey-dark mt-8">Disponible {when}</p>
    <Button secondary asChild>
      <Link href="/">Retour à l'accueil</Link>
    </Button>
  </Container>
</Section>
```

Configuration par route dans un fichier `lib/coming-soon-pages.ts`.

---

## 11. Implémentation — Ordre Approche B

1. **Setup fondations** (~3 h)
   - `next/font/google` Fraunces + Inter dans `app/layout.tsx`
   - Tokens typo/espace dans `app/globals.css` (`@theme` extensions)
   - Primitives `Container, Section, Eyebrow, Heading, Prose` dans `components/ui-primitives/`
   - Quick test : `/fr` doit afficher Fraunces correctement

2. **Header + Footer refondus** (~3 h)
   - Header sticky 80px, locale dropdown, navlinks futurs avec greyout
   - MobileNav drawer (avec shadcn Sheet)
   - Footer 4-col + newsletter stub + social

3. **Homepage** (~6 h)
   - 6 sous-composants (Hero, FeaturedProducts, StoryTeaser, CoffretsTeaser, InstagramGrid, NewsletterCTA)
   - `app/[locale]/(shop)/page.tsx` orchestre
   - Featured products : query `isFeatured = true` (fallback : 3 plus récents)
   - Placeholders élégants si pas de photos réelles

4. **Catalogue + fiche produit** (~6 h)
   - Sidebar filtres desktop + CategoryFilter `variant` prop
   - ProductCard aspect 4/5 refondue
   - Fiche produit split 60/40, thumbnails 5-col 80×80
   - TrustIndicators component
   - RelatedProducts component + query `listRelatedProducts`

5. **Pages "Bientôt disponible"** (~2 h)
   - Composant `ComingSoonPage` + config 10 pages
   - Routes créées sous `app/[locale]/(shop)/` pour les unes, `app/[locale]/(account)/` pour aucune

6. **Polish cart + checkout + confirmation + account + sign-in** (~3 h)
   - Surface upgrade typo/espacement sur chaque, pas de redesign profond

7. **Visual QA + responsive** (~2 h)
   - Capture chaque page desktop + mobile
   - Lighthouse perf check (cible 90+)
   - Ajustements

**Estimé total :** ~25 h (~3 jours dev solo concentré).

---

## 12. Tests

Pas de nouveaux tests fonctionnels (le scope ne change pas). On ajoute :

- **Vitest unit** : éventuellement tester `<ComingSoonPage>` rendering simple
- **Playwright E2E** : vérifier qu'aucune page existante ne casse (re-run de la suite)
- **Visual regression** : pas en Phase 1 — un test Lighthouse manuel suffit pour vérifier perf

---

## 13. Critères de succès

- [ ] Fraunces et Inter chargées et visibles (vérifier via DevTools fonts panel)
- [ ] Homepage scroll fluide, 6 sections distinctes visibles
- [ ] Hero produit "wow" : photo + grand titre Fraunces + 2 CTA
- [ ] Cards catalogue aspect 4/5 avec hover scale subtle
- [ ] Fiche produit avec sticky info side + section "à découvrir aussi"
- [ ] Header sticky avec border subtile au scroll
- [ ] Footer 4-col avec newsletter stub fonctionnelle (toast feedback)
- [ ] Pages "Bientôt" stylées (pas de 404)
- [ ] Tous les tests Phase 1 restent verts (25 Vitest + 10 Playwright)
- [ ] Lighthouse Performance 90+ sur homepage et /biscuits

---

## 14. Hors scope (rappel explicite)

- Animations Framer Motion / GSAP / Lenis → Phase 3
- 3D R3F / configurateur 3D / viewer 3D → Phase 3
- Mega-menu header → V2
- Vraie newsletter back-end (stockage + envois) → Phase 4
- Contenu rédactionnel réel des pages "Notre histoire", FAQ, etc. → Phase 4/5
- Mode dark, app mobile, Google OAuth → hors V1
- Refonte admin (`/admin/*`) — pas touché par ce polish, c'est outillage interne

---

## 15. Décisions verrouillées

Pour ne pas re-discuter pendant l'implémentation :

- **Photos manquantes** = fallback `bg-cookie/30` avec emoji 🍪 centré, JAMAIS placeholder gris ni picsum
- **Hauteur header** = 80px desktop / 64px mobile, sticky avec backdrop-blur-sm
- **Nav greyout futurs** = liens cliquables vers page "Bientôt", pas désactivés (meilleure découverte)
- **Locale switcher** = dropdown compact (FR ▼), pas les 4 liens étalés actuels
- **Newsletter** = Server Action stub qui retourne success, ne stocke rien (Phase 4 fait le vrai back-end)
- **Cards produit** = aspect 4/5 portrait (au lieu de 1/1 carré actuel)
- **Fiche produit** = split 60/40 (60 photo, 40 info), sticky info droite desktop
- **Featured products homepage** = filtre `isFeatured = true` (fallback : 3 plus récents)
- **Section "Bientôt"** = composant unique `<ComingSoonPage>` configuré par route
- **Trust indicators fiche produit** = 3 lignes fixes : "Livré en 24h Bpost / Cuit à Liège / Sans conservateur"

---

**Fin du document.**

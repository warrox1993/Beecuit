# Journal éditorial — Au Fil des Saveurs — Design

**Date :** 2026-05-25
**Statut :** Spec validée, prêt pour plan d'implémentation
**Phase :** Pré-launch (feature production-grade complète avant ouverture commerciale)
**Brand :** Au Fil des Saveurs — Biscuiterie Fine & Gourmet

## Contexte

La route `/journal` est actuellement un placeholder `ComingSoonPage` avec ETA "Été 2026". La cliente — non technique — souhaite un journal éditorial vivant dès le launch pour porter le savoir-faire artisan, capter du trafic SEO (recettes, conseils cuisine) et faire vivre la marque sur la durée. Le brainstorm du 2026-05-25 a tranché en faveur d'une feature **production-grade complète au launch** avec **3-5 articles seed**, **storage DB + admin UI live** (la cliente écrit sans dev), **multilingue FR primary + traductions optionnelles**, et **support photos + vidéos (embed + upload)**.

## Vision

Transformer `/journal` d'un placeholder vide en une vitrine éditoriale premium qui :
- porte la voix de la maison (recettes, savoir-faire, coulisses, saisons) ;
- convertit en boutique (produits liés en bas d'article, featured home) ;
- capture du trafic organique (JSON-LD Recipe, sitemap, RSS, OG dynamique) ;
- s'écrit sans intervention dev (admin WYSIWYG Tiptap, upload Blob, publication 1-clic).

## Architecture data

### Schéma DB (drizzle)

```sql
journal_articles
  id                    uuid PK
  slug                  text UNIQUE NOT NULL          -- auto-généré depuis titre FR, éditable
  status                enum('draft','published','archived') DEFAULT 'draft'
  category              enum('recettes','savoir-faire','saisons','atelier') NOT NULL
  cover_image           text NOT NULL                  -- URL Vercel Blob, ratio 16:9
  cover_alt_fr          text NOT NULL
  pinterest_image       text NULL                      -- optionnel, ratio 2:3 ; sinon crop auto du cover
  author                text DEFAULT 'Au Fil des Saveurs'
  reading_minutes       int                            -- auto-calculé à la sauvegarde (200 mots/min)
  is_featured           boolean DEFAULT false          -- 1 seul à la fois (enforced transaction)
  -- Champs recette locale-agnostic (NULL si category != 'recettes')
  recipe_prep_min       int NULL
  recipe_cook_min       int NULL
  recipe_difficulty     enum('facile','moyen','avance') NULL
  -- Auto-send newsletter
  journal_email_sent_at timestamptz NULL               -- set au 1er send pour idempotence
  -- Dates
  published_at          timestamptz NULL               -- set la 1ère fois draft→published, jamais écrasé
  created_at            timestamptz DEFAULT now()
  updated_at            timestamptz DEFAULT now()
  featured_product_slugs jsonb DEFAULT '[]'            -- override manuel produits liés ; sinon auto-extrait
```

```sql
journal_article_translations
  id                  uuid PK
  article_id          uuid FK → journal_articles ON DELETE CASCADE
  locale              enum('fr','nl','en','de') NOT NULL
  title               text NOT NULL
  excerpt             text NOT NULL                    -- max 200 chars, auto-généré si vide
  body_json           jsonb NOT NULL                   -- doc ProseMirror (format natif Tiptap)
  seo_title           text NULL                        -- fallback sur title
  seo_description     text NULL                        -- fallback sur excerpt
  -- Recette localisée (NULL si category != 'recettes')
  recipe_yield_label  text NULL                        -- ex: "24 biscuits"
  recipe_ingredients  jsonb NULL                       -- [{name, qty, unit}, ...]
  recipe_steps        jsonb NULL                       -- [{n, text}, ...]
  UNIQUE(article_id, locale)
```

```sql
journal_email_log
  id              uuid PK
  article_id      uuid FK → journal_articles
  locale          enum('fr','nl','en','de')
  recipient_email text
  status          enum('sent','failed','bounced')
  resend_id       text NULL                            -- ID Resend pour debug
  error_message   text NULL
  sent_at         timestamptz DEFAULT now()
```

```sql
-- NOUVELLE TABLE : l'action `subscribeToNewsletter` est actuellement un stub
-- (`lib/actions/newsletter.actions.ts` console.log + return success). Cette
-- feature livre donc aussi l'infrastructure newsletter (prérequis du auto-send).
newsletter_subscribers
  id                  uuid PK
  email               text UNIQUE NOT NULL
  locale              enum('fr','nl','en','de') NOT NULL
  status              enum('pending','confirmed','unsubscribed') DEFAULT 'pending'
  journal_opt_in      boolean DEFAULT false
  confirm_token       text UNIQUE NOT NULL                -- DOI confirmation
  unsubscribe_token   text UNIQUE NOT NULL                -- 1-clic unsubscribe
  source              text NULL                           -- 'home','journal_inline','checkout'
  created_at          timestamptz DEFAULT now()
  confirmed_at        timestamptz NULL
  unsubscribed_at     timestamptz NULL
```

**Double Opt-In (DOI) requis** par le RGPD/ePrivacy belge : à l'inscription, on enregistre `status='pending'` + envoie un email de confirmation avec `confirm_token`. L'auto-send ne cible que `status='confirmed'`. C'est la conformité légale standard et c'est aussi l'occasion de livrer une infra newsletter propre.

### Catégories

| Slug | Label FR | Esprit |
|---|---|---|
| `recettes` | Recettes | Cuisiner avec / autour des biscuits |
| `savoir-faire` | Savoir-faire | Techniques, ingrédients, choix de l'atelier |
| `saisons` | Saisons | Offres saisonnières, fêtes, calendrier gourmand |
| `atelier` | L'atelier | Coulisses, vie de la maison (remplace l'ancien "Histoires d'abeilles") |

### Règle multilingue

- Article visible sur `/fr/journal` si `status='published'` ET translation FR existe (FR obligatoire).
- Sur `/nl|/en|/de/journal` : visible **seulement** si la translation locale existe (pas de fallback FR visible dans la liste).
- Accès direct `/{locale}/journal/[slug]` sans translation locale → redirect vers `/fr/journal/[slug]?fallback=1` qui affiche un banner discret "Article disponible en français uniquement".

### Body : doc ProseMirror + custom nodes

Stockage `body_json jsonb`. Nodes whitelist :

- **Standard StarterKit** : paragraph, heading (h2/h3), bold, italic, link, list ordered/unordered, blockquote, code inline
- **Custom nodes** :
  - `image` — `{src, alt, caption?, blob_path}`
  - `video-embed` — `{provider: 'youtube'|'vimeo', url, video_id}`
  - `video-upload` — `{src, poster?, blob_path}`
  - `product-card` — `{product_slug}`
  - `callout` — `{variant: 'note'|'astuce'|'attention', text}`

Validation serveur : tout doc reçu via admin action est passé à `validateProseMirrorDoc(json)` qui rejette les nodes hors whitelist + valide les attrs (URLs Blob signées, slugs produits existants).

## Admin UI (`/admin/journal`)

Admin **hors `[locale]`** (chemin `/admin/journal`, cohérent avec les autres pages admin existantes `/admin/produits`, `/admin/coffrets`, etc.). Auth enforced dans `app/admin/layout.tsx` qui appelle `await auth()` + check `session.user.role === 'admin'`. Pas de middleware racine. Pas de changement de pattern auth pour cette feature.

### Pages

- `/admin/journal` — liste : table avec status / category / featured / locales dispo
- `/admin/journal/new` — création (étape 1 : titre FR + slug auto + category)
- `/admin/journal/[id]` — édition d'un article (toutes locales en tabs)

### Layout édition

**Header sticky** :
- Titre article + status badge + dates
- Boutons : `Sauvegarder brouillon` · `Publier` · `Dépublier` · `Aperçu` (ouvre `/fr/journal/[slug]?preview={token}` dans un nouvel onglet, token HMAC TTL 15 min)

**Tabs locales** : FR / NL / EN / DE
- FR toujours présent (obligatoire pour publier)
- NL/EN/DE optionnels avec badge "Non traduit" / "Brouillon" / "Complet"
- Contenu par tab : titre, excerpt, body Tiptap, champs recette si category='recettes'

**Sidebar droite** (locale-agnostic) :
- Catégorie (select)
- Image cover (upload Blob, crop 16:9 client-side via canvas, downsize max 2000px, alt text FR)
- Image Pinterest 2:3 (optionnel, sinon crop auto serveur)
- Toggle "À la une" (confirmation modal qui affiche l'article actuellement featured à remplacer)
- Champs recette globaux (prep/cook/difficulté) si category='recettes'
- Featured product slugs (override manuel des produits liés)
- Toggle "Envoyer l'email aux abonnés du journal au publish" (défaut true)
- Slug (read-only après création, bouton "modifier" avec warning SEO)
- Email preview live (rendu template avec article courant)

### Éditeur Tiptap — extensions

| Toolbar button | Node ProseMirror |
|---|---|
| Heading H2 | heading[level=2] |
| Heading H3 | heading[level=3] |
| Bold / Italic / Link | marks standard |
| Liste numérotée / à puces | orderedList / bulletList |
| Citation | blockquote (rendu pull-quote brand) |
| 🖼️ Image | custom `image` (upload Blob inline) |
| ▶️ Vidéo embed | custom `video-embed` (paste URL YouTube/Vimeo) |
| 🎬 Vidéo upload | custom `video-upload` (upload Blob) |
| 🍯 Produit | custom `product-card` (search products → select 1) |
| 💡 Callout | custom `callout` (3 variants note/astuce/attention) |

Toolbar minimaliste brand-themed (boutons warm-brown, hover honey). Reduced-motion respecté.

### Workflow recette

Si `category='recettes'`, chaque tab locale affiche en plus du body :
- **Yield** (input text, ex: "24 biscuits")
- **Ingrédients** : liste éditable (add/remove/reorder), chaque ligne = qty + unit + name
- **Étapes** : liste éditable numérotée (add/remove/reorder), textarea par étape

Ces champs sont **séparés** du body Tiptap. À l'affichage public, ils sont rendus dans un encart structuré (avec JSON-LD Recipe). Le body Tiptap couvre la narration (intro, histoire, conseil de dégustation).

### Sécurité

- Upload Blob : mime whitelist (image/* ou video/*), max size 10 MB image / 100 MB vidéo, filename sanitize, signed upload URL.
- Body JSON : validation whitelist nodes côté serveur.
- Preview token : HMAC signé via env var `JOURNAL_PREVIEW_SECRET`, TTL 15 min, scope `journal:preview:{article_id}`.

## Frontend public

### Routes

```
/[locale]/journal                                 # liste paginée
/[locale]/journal/categorie/[slug]                # filtré par catégorie
/[locale]/journal/[slug]                          # article détail
/[locale]/journal/[slug]/print                    # version imprimable (recettes)
/[locale]/journal/feed.xml                        # Atom feed par locale
/api/og/pinterest/[slug]                          # crop Pinterest 2:3 dynamique
```

### `/[locale]/journal` — liste

Structure top-to-bottom :

1. **Hero** : RopeDivider + Eyebrow script "Au fil des saveurs" + H1 "Journal de la maison" + lead i18n + DotFlourish.
2. **Article featured** (si `is_featured=true` + translation locale existe) : hero card asymétrique image 60% / texte 40%.
3. **Filtres catégorie** : 4 pills honey-cream (réutilise `CategoryFilter` de Phase 4C), URL synced (`?category=recettes`).
4. **Grille** : 3 col desktop / 2 tablet / 1 mobile, pagination 9/page, composant `JournalCard`, stagger Reveal (Phase 4D).
5. **Empty state** si aucun article publié pour la locale : `EmptyState` primitive (Phase 4E) + CTA newsletter inline.

### `JournalCard`

- Image cover 16:9 rounded-lg, hover gold subtle (cohérent `ProductCard`)
- Eyebrow `CATÉGORIE · 6 MIN DE LECTURE`
- Titre Fraunces (line-clamp 2) + excerpt (line-clamp 3) + date "15 juin 2026"
- Hover : image scale 1.02, frame gold appear
- `<Link prefetch>` standard Next.js

### `/[locale]/journal/[slug]` — détail

Top-to-bottom :

1. **Hero full-bleed** (cohérent Notre Histoire) — cover max-h 60vh, overlay gradient warm-brown, sur l'overlay (centered max-w-3xl) : RopeDivider + Eyebrow `catégorie · reading_minutes min` + H1 + excerpt lead + DotFlourish + date/auteur petits.
2. **Body container** max-w-prose font Fraunces :
   - **TOC sticky** desktop left rail si ≥3 H2
   - **Encart recette** (si category='recettes') AVANT body : card cream-elevated + CornerScallop, grid 2 cols meta (yield/prep/cook/difficulté) | ingrédients, bouton "Imprimer la recette"
   - **Body Tiptap rendered** (server-side, voir mapping)
   - **Étapes recette** (si recette) APRÈS body : liste numérotée stylisée gros chiffres or
   - **Signature manuscrite** SVG en bas
   - **Partage social** inline : Pinterest / Facebook / Email / Copy
3. **Produits liés** : Section eyebrow contextuel ("Les biscuits de cette recette" / "Les biscuits mentionnés"), grille 1-3 `ProductCard`, CTA "Découvrir tous nos biscuits".
4. **Newsletter inline** : variant compact de `NewsletterFormRefined` avec opt-in "Journal" pré-coché (contexte fin de lecture).
5. **"À lire aussi"** : 3 articles même catégorie random parmi published, exclude current, réutilise `JournalCard`.

### Rendu Tiptap → React (server-side)

`lib/journal/render.tsx` exporte `renderArticleBody(json: ProseMirrorDoc)` :

| Node | Composant |
|---|---|
| paragraph | `<p>` body classes |
| heading h2 | `<h2 id={slug-from-text}>` (anchor TOC + deep link) |
| heading h3 | `<h3>` |
| bold / italic / link | inline brand classes |
| bulletList / orderedList | `<ul>` / `<ol>` styled |
| blockquote | `<Blockquote>` pull-quote Fraunces italic + DotFlourish |
| `image` | `<Figure>` next/image lazy + caption |
| `video-embed` | `<VideoEmbed provider url>` lazy iframe + brand thumbnail |
| `video-upload` | `<video controls poster preload="metadata">` |
| `product-card` | `<ProductCard variant="inline" slug>` |
| `callout` | `<Callout variant>` themed |

RSC, zéro hydration sauf composants interactifs (lightbox image, share buttons). **Tiptap n'est PAS dans le bundle public** (admin only).

### Print view recettes

`/[locale]/journal/[slug]/print` :
- Layout vide (pas de Header/Footer global, layout root distinct)
- CSS `@page A4`, polices system serif (pas de Google fonts → impression rapide)
- Contenu : titre + auteur + date + yield + temps + difficulté + ingrédients + étapes + footer URL article + © Au Fil des Saveurs
- Le lien "Imprimer" dans l'encart recette ouvre cette route et déclenche `window.print()` au load

## SEO & discoverability

### Per article

- Metadata Next.js generator :
  - `title = seo_title || title`
  - `description = seo_description || excerpt`
  - OG image = `app/[locale]/journal/[slug]/opengraph-image.tsx` (next/og, compose cover + ornement gold + titre + wordmark)
  - `alternates.canonical` = version locale courante
  - `alternates.languages` = hreflang map auto-générée pour chaque locale où translation existe
- JSON-LD systématique :
  - `Article` (headline, datePublished, dateModified, image, author, publisher)
  - `BreadcrumbList` (Accueil → Journal → Catégorie → Article)
  - `Recipe` si `category='recettes'` (image, prepTime ISO 8601, cookTime, recipeYield, recipeIngredient[], recipeInstructions[], author)

### Sitemap

`app/sitemap.ts` (déjà dynamique) étendu :
- Pour chaque article published, pour chaque locale dispo : `{ url, lastModified: updated_at, alternates }`.
- Mise à jour via `revalidatePath('/sitemap.xml')` à chaque publish/unpublish/edit.

### RSS Atom feed

`app/[locale]/journal/feed.xml/route.ts` :
- Title `"Journal — Au Fil des Saveurs"`
- 20 derniers articles published pour la locale
- Items : title, link, summary (excerpt), published date, author, category, enclosure image
- `revalidate = 600`

### Pinterest

- Meta tags : `og:image` = `pinterest_image` si fourni, sinon `cover_image` ; `<meta name="pinterest-rich-pin" content="true">`
- Bouton "Save" inline en fin d'article + overlay flottant sur images de catégorie `recettes`
- Pas de tracking Pinterest pour l'instant (compliance cookies)

### Partage social — détails

- **Pinterest** : URL `https://www.pinterest.com/pin/create/button/?url={url}&media={pinterest_image||cover}&description={title}`
- **Facebook** : `https://www.facebook.com/sharer/sharer.php?u={url}` (target=_blank, rel=noopener)
- **Email** : `mailto:?subject={title}&body={excerpt}%0A%0A{url}`
- **Copy** : `navigator.clipboard.writeText(url)` + toast Sonner "Lien copié"

Icônes SVG inline cohérentes avec Footer social SVG (Phase 4E), warm-brown hover honey.

## Article featured sur homepage

Composant server `<JournalFeatured />` :
- Fetch article avec `is_featured=true` et translation locale existante, retourne `null` sinon
- Position homepage : entre `StoryTeaser` et `CoffretsTeaser`
- Layout asymétrique magazine, image 60% / texte 40% desktop, stacké mobile
- Eyebrow script "Au fil des saveurs · Le journal" + catégorie + reading_minutes
- Titre Fraunces display (line-clamp 2) + excerpt (line-clamp 2)
- CTA secondaire ghost "Lire l'article" + lien petit "Tous les articles" → /journal
- Reveal stagger sur scroll (Phase 4D)
- Bundle impact <2 KB

**Contrainte unique featured** : transaction drizzle dans `setFeatured` server action — `UPDATE journal_articles SET is_featured=false WHERE is_featured=true` puis `UPDATE journal_articles SET is_featured=true WHERE id={target}`.

## Newsletter

### Infrastructure (livrée par cette feature)

Le projet n'a actuellement **pas** de persistance newsletter — `subscribeToNewsletter` (`lib/actions/newsletter.actions.ts`) est un stub `console.log`. Cette feature livre l'infra complète :

1. Table `newsletter_subscribers` (cf. schéma data plus haut) avec Double Opt-In
2. Action `subscribeToNewsletter` réécrite pour :
   - Persister le subscriber (`status='pending'`)
   - Capturer `locale` (depuis le contexte i18n du composant qui appelle l'action)
   - Capturer `source` (`'home'`, `'journal_inline'`, `'checkout'`)
   - Générer `confirm_token` + `unsubscribe_token` (crypto.randomUUID)
   - Envoyer l'email de confirmation DOI via `sendEmail`
3. Route `/api/newsletter/confirm/[token]` : flip `status='confirmed'`, set `confirmed_at`
4. Route `/api/newsletter/unsubscribe/[token]` : flip `status='unsubscribed'`, set `unsubscribed_at`
5. Idempotence : si un email existe déjà (`UNIQUE`), on renvoie le mail de confirmation (cas où l'utilisateur a perdu le 1er mail)

### Opt-in séparé "Journal"

UI signup :
- Sur la home (`NewsletterFormRefined`) : case **non pré-cochée** "Recevoir aussi le journal mensuel (recettes, conseils, coulisses)" + helper text "Vous recevrez nos nouveautés boutique • Si activé, aussi 1 email par article publié"
- En fin d'article (variant inline) : case **pré-cochée** par défaut (contexte = lecture journal, consentement implicite raisonnable, mais visible et décochable)
- Le champ `journal_opt_in` est capturé à l'inscription et persiste tel quel après confirmation DOI

### Auto-send sur publish

Déclenchement direct depuis server action `publishArticle`, sans queue. La fonction `await` l'envoi avant de rendre la main (Vercel Function timeout 300s par défaut, ~5s pour 500 subs en batched).

```ts
// pseudo-code
async function publishArticle(id, sendEmail = true) {
  const article = await db.transaction(async (tx) => {
    const updated = await tx.update(journalArticles)
      .set({ status: 'published', published_at: sql`COALESCE(published_at, NOW())` })
      .where(eq(journalArticles.id, id))
      .returning()
    return updated[0]
  })
  revalidatePaths(article)
  if (sendEmail && !article.journal_email_sent_at) {
    await sendArticleEmails(article)
    await db.update(journalArticles)
      .set({ journal_email_sent_at: new Date() })
      .where(eq(journalArticles.id, id))
  }
}
```

`sendArticleEmails(article)` :
- Pour chaque locale de l'article où translation existe
- Pour chaque subscriber `status='confirmed'` ET `journal_opt_in=true` ET `locale=cette_locale`
- **Helper batch à créer** dans `lib/email/client.ts` : `sendBatchEmails(emails: EmailPayload[])` qui utilise `resend.batch.send([...])` (Resend SDK supporte 100 emails/batch). Le helper existant `sendEmail` reste pour les envois 1:1.
- Log dans `journal_email_log` (sent / failed / bounced) par destinataire
- Resend free tier : 3000 emails/mois, 100/jour → confortable pour 1 article/mois × 500 subs (= 500 emails, étalable si > 100/jour via délai entre batches)

**Template email** :
- Brand-themed cream + warm-brown
- Hero cover image + eyebrow catégorie
- Titre + excerpt + CTA "Lire l'article"
- Footer "Vous recevez cet email parce que vous avez activé le journal · Se désabonner"
- Lien désabonnement = token HMAC qui flip `journal_opt_in=false`

**Idempotence** : `journal_email_sent_at` empêche un 2ème send même si l'article est dépublié puis republié. Si la cliente veut renvoyer, action admin séparée "Renvoyer l'email" qui reset le timestamp avec confirmation modale.

## Automatisations gratuites

Au-delà des automatisations déjà couvertes (revalidation, sitemap, JSON-LD, hreflang, OG image, RSS) :

| # | Auto | Implémentation |
|---|---|---|
| A | Slug auto depuis titre FR à la création | `slugify(title)` + collision check, éditable ensuite |
| B | Excerpt auto si vide | 1er paragraphe stripped du body, capé à 200 chars |
| C | Reading time auto | 200 mots/min du body FR, recalculé à chaque save |
| D | Image cover downsize client | Canvas resize max 2000px largeur avant upload Blob |
| E | Image Pinterest auto | Route `/api/og/pinterest/[slug]` qui crop 2:3 du cover |
| F | published_at auto | Set la 1ère fois draft→published, jamais écrasé |
| G | revalidatePath cascade | Server actions publish/unpublish/edit |
| H | Featured unique | Transaction drizzle |
| I | Email preview live admin | Composant qui rend le template avec article courant |
| J | Hreflang auto par locale dispo | Metadata generator |
| K | JSON-LD Recipe depuis champs structurés | Metadata generator |
| L | Anchor IDs sur H2 | Render Tiptap |
| M | OG image dynamique per article | `opengraph-image.tsx` |
| N | Auto-flag drafts > 90 jours | Server query (badge admin uniquement) |

Skipped explicitement : auto-cross-posting Pinterest/Facebook (besoin OAuth), traduction auto (la cliente écrit), LLM suggestions produits (coût API), cron digest hebdo (redondant avec auto-send).

## i18n

### Cleanup

- Supprime `comingSoon.journal` block des 4 locales
- Supprime entrée `journal` de `lib/coming-soon-pages.ts`
- Remplace toutes occurrences "Histoires d'abeilles" par "L'atelier" / équivalents brand-aligned

### Keys ajoutées (FR primary, NL/EN/DE traductions courtes au launch)

```jsonc
"journal": {
  "title": "Journal de la maison",
  "lead": "Recettes, savoir-faire et coulisses de l'atelier.",
  "empty": "Le journal arrive bientôt. Abonnez-vous à la newsletter pour ne rien manquer.",
  "categories": {
    "all": "Tout",
    "recettes": "Recettes",
    "savoir-faire": "Savoir-faire",
    "saisons": "Saisons",
    "atelier": "L'atelier"
  },
  "readingTime": "{minutes} min de lecture",
  "publishedOn": "Publié le {date}",
  "tableOfContents": "Sommaire",
  "recipe": {
    "yield": "Pour", "prep": "Préparation", "cook": "Cuisson",
    "difficulty": "Difficulté", "ingredients": "Ingrédients",
    "steps": "Étapes", "print": "Imprimer la recette"
  },
  "share": {
    "label": "Partager",
    "pinterest": "Épingler", "facebook": "Partager",
    "email": "Envoyer par mail", "copy": "Copier le lien",
    "copied": "Lien copié"
  },
  "relatedProducts": {
    "recettes": "Les biscuits de cette recette",
    "default": "Les biscuits mentionnés",
    "cta": "Découvrir tous nos biscuits"
  },
  "alsoRead": "À lire aussi",
  "newsletter": {
    "optInLabel": "Recevoir aussi le journal mensuel",
    "optInHelp": "Recettes, conseils et coulisses, 1 email par article publié."
  },
  "fallbackBanner": "Article disponible en français uniquement.",
  "featured": {
    "eyebrow": "Au fil des saveurs · Le journal",
    "cta": "Lire l'article",
    "all": "Tous les articles"
  }
}
```

## Articles seed (5)

| # | Cat. | Titre FR proposé | Raison |
|---|---|---|---|
| 1 | atelier | "Bienvenue chez Au Fil des Saveurs" | Article de lancement, présente la maison, signature cliente |
| 2 | savoir-faire | "Le spéculoos liégeois, racines et tradition" | Pillar SEO local |
| 3 | recettes | "Tiramisu au spéculoos d'Au Fil des Saveurs" | Pillar Recipe → rich results Google |
| 4 | saisons | "Pâques 2026 : nos coffrets en édition limitée" | Tie-in commercial actuel |
| 5 | recettes | "Crumble aux biscuits avoine et pommes" | 2ème recette + montre biscuits avoine |

**Workflow seed** :
- Cliente fournit texte FR par mail/doc
- Dev importe via admin (1ʳᵉ utilisation = test du workflow réel)
- Traductions NL/EN/DE post-launch au fil de l'eau

## Navigation

- Header / MobileNav / Footer : lien "Journal" existe déjà, pointera vers la vraie page
- Breadcrumbs sur détail : `Accueil / Journal / [Catégorie] / [Article]` (JSON-LD + composant visuel sticky discret)

## Performance & bundles

- `<Link prefetch>` standard sur `JournalCard`
- TOC active state = pure CSS `:target` + IntersectionObserver minimaliste (<1KB)
- Rendu body server-side (RSC), Tiptap admin-only
- **Targets** :
  - Homepage : +2 KB (`JournalFeatured`), reste sous 250 KB
  - `/journal` (liste) : ≤ 130 KB First Load
  - `/journal/[slug]` (détail) : ≤ 150 KB First Load
  - `/journal/[slug]/print` : ≤ 60 KB
  - Admin `/admin/journal/*` : lazy chunks Tiptap, non comptabilisé public

## Sécurité & validation

- Upload Blob : mime whitelist, max size, sanitize, signed upload URL
- Body JSON : validation whitelist serveur via `validateProseMirrorDoc`
- Preview token : HMAC env var `JOURNAL_PREVIEW_SECRET`, TTL 15 min
- Unsubscribe token : HMAC env var `JOURNAL_UNSUB_SECRET`, scope email+article
- CSP : on autorise les iframes YouTube/Vimeo sur les pages détail (à ajouter à `next.config.ts` ou middleware)

## Tests

- **Unit (vitest)** :
  - `slugify(title)` + collision handling
  - `calculateReadingMinutes(json)`
  - `generateExcerpt(json, maxChars)`
  - `buildHreflangMap(translations)`
  - `formatDuration(minutes)` ISO 8601 PT15M
- **Integration** :
  - Server actions `publishArticle`, `unpublishArticle`, `setFeatured` (transaction featured unique)
  - `validateProseMirrorDoc` (rejet nodes hors whitelist, validation product slugs)
  - `sendArticleEmails` mocké Resend (vérifie batching + log)
- **E2E manuel** (coverage actuel projet) :
  - Flow create → publish → email reçu → article live (sitemap + RSS + JSON-LD validés via Schema.org validator)
  - Flow draft preview via token
  - Print recette
  - Flow newsletter opt-in journal + unsubscribe

## Migration & rollout

Ordre d'exécution :
1. Migration drizzle : `newsletter_subscribers` (nouvelle), `journal_articles`, `journal_article_translations`, `journal_email_log`
2. Réécriture `subscribeToNewsletter` action + routes confirm/unsubscribe + email DOI
3. Build feature complète (admin + public + render + RSS + OG + sitemap + auto-send + batch email helper)
4. Wire UI : option journal sur `NewsletterFormRefined` (home + variant inline article)
5. Seed 5 articles via admin
6. Smoke test publish 1 article → check : email reçu, featured affiché home, sitemap, RSS, JSON-LD valides, OG image, DOI flow, unsubscribe 1-clic
7. Commit + push prod

## Env vars nouvelles

- `JOURNAL_PREVIEW_SECRET` (HMAC preview token, TTL 15 min)

Resend (`AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`) déjà présent dans le projet. Les tokens DOI / unsubscribe newsletter sont des UUIDs persistés en DB (`confirm_token`, `unsubscribe_token`), pas des HMAC — donc pas d'env var supplémentaire.

## Risques

| Risque | Mitigation |
|---|---|
| Cliente non-tech bloque sur Tiptap | Toolbar minimaliste, doc rapide écrite par dev, première publication accompagnée |
| Bundle public explose | Tiptap admin-only, render serveur, lazy iframes vidéo, audit bundle à chaque commit feature |
| Auto-send spam ressenti | Opt-in séparé clair, unsubscribe 1-clic, throttle Resend, idempotence `journal_email_sent_at` |
| Translations FR seules visibles dans NL/EN/DE | Filtrage strict en query : articles cachés si pas de translation locale |
| Drafts non publiés s'accumulent | Auto-flag > 90 jours en admin (informatif) |
| Image cover trop lourde | Downsize client-side avant upload + next/image transformations runtime |

## Hors scope (V2 post-launch)

- Commentaires lecteurs (overhead modération)
- Recherche full-text dans le journal (peu d'articles V1)
- Bookmarks compte utilisateur
- Versioning historique des articles
- Auto-translate FR→autres locales
- Auto-cross-posting Pinterest/Facebook (besoin OAuth + tokens)
- Tags libres en plus des catégories

## Prochaine étape

Spec validée. Passage à l'écriture du plan d'implémentation (`docs/superpowers/plans/2026-05-25-journal.md`) via la skill `writing-plans`.

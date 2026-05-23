# BeeCuit — Phase 1 (E-commerce de base unitaires) — Design Document

**Date :** 2026-05-23
**Statut :** Validé (brainstorming) — à confirmer avant implémentation
**Auteur :** Jean-Baptiste Dhondt + Claude (brainstorming session)
**Spec parente :** `docs/superpowers/specs/2026-05-22-beecuit-design.md`

---

## 0. Contexte

Phase 0 (Fondations) est terminée et déployée sur https://beecuit.vercel.app : Next.js 15 + Tailwind v4 + shadcn/ui + Drizzle/Neon + Auth.js v5 magic links + next-intl FR/NL/DE/EN + CI GitHub Actions + Vercel auto-deploy. Voir `docs/superpowers/plans/2026-05-22-phase-0-fondations.md` pour le détail.

Phase 1 ajoute le premier vrai e-commerce fonctionnel sur ces fondations : un visiteur de Belgique peut découvrir des biscuits unitaires (sachets/paquets individuels), les ajouter à un panier, payer avec Stripe (Bancontact + CB + Apple/Google Pay), recevoir un email de confirmation, et suivre sa commande dans son espace compte. L'admin peut gérer le catalogue et les commandes.

**Règle de discipline :** Phase 1 ne touche pas aux coffrets, à l'abonnement, au B2B, au 3D, ni à aucune feature secondaire (promo, cartes cadeaux, fidélité, wishlist, blog, avis). Ces périmètres sont strictement reportés à Phase 2+. Le passage à Phase 2 ne se fait que si Phase 1 est terminée et fonctionnelle.

---

## 1. Périmètre Phase 1

### Dans Phase 1

| Brique | Contenu |
|---|---|
| Layout global | Header + footer minimaux (logo, nav 4 liens, switcher langue, icône panier) |
| Catalogue | Page liste `/biscuits` (avec filtre catégorie) + page détail `/biscuits/[slug]` |
| Admin produits | `/admin/produits` CRUD + édition stricte 4 traductions |
| Admin catégories | `/admin/categories` CRUD simple |
| Admin commandes | Liste + détail + action "marquer expédiée" + n° tracking |
| Admin livraison | Éditeur des tarifs `shipping_rates` |
| Panier | Persistant DB + Server Actions, drawer slide-over + page `/panier` |
| Checkout | `/checkout` single-page à sections → Stripe Checkout hosted |
| Livraison | bpost Express 24h à domicile uniquement (tarifs par tranche de poids) |
| Stock | Hard tracking, blocage panier à 0, re-vérification au checkout |
| Webhook Stripe | Idempotent, marque commande payée, déduit stock, envoie email |
| Emails transactionnels | Confirmation commande + Notification expédition |
| Espace compte | Mes commandes (liste + détail) + Mes adresses (CRUD) |
| Page confirmation | `/commande-confirmee/[orderNumber]` post-paiement |
| Tests | Unit (Vitest) + intégration + E2E (Playwright) |

### Hors Phase 1 (reportés)

- **Phase 2 :** coffrets pré-composés, abonnement (3×3), B2B (devis), Mondial Relay, DHL, Click & Collect, bpost points retrait
- **Phase 3 :** configurateur 3D `/composer`, viewer 3D fiches produit, hero 3D, animations GSAP/Lenis, pipeline assets 3D
- **Phase 4 :** programme fidélité, codes promo, cartes cadeaux, wishlist, avis clients, blog, notifications in-app, cross-sell
- **Phase 5 :** 2FA TOTP admin, lots/DLC FIFO, audit logs, conformité finale (CGV, RGPD audit, médiateur conso), SEO complet (hreflang, JSON-LD avancés, OG dynamiques), Sentry + PostHog + UptimeRobot
- **Hors V1 :** PayPal, dark mode, app mobile, AR, marketplace, vente hors Belgique

---

## 2. Modèle de données

### Extensions des tables existantes (Phase 0)

**`products`** :
- Ajouter `category_id` (FK vers `categories`, nullable, ON DELETE SET NULL)
- Le champ `product_type` enum reste mais Phase 1 n'utilise que `'biscuit'`
- Le champ `model_3d_url` reste vide (utilisé Phase 3)

**`orders`** :
- Ajouter `stripe_session_id` (text, unique) — idempotence webhook
- Ajouter `stripe_payment_intent_id` (text, nullable)
- Ajouter `shipping_address_snapshot` (jsonb) — adresse au moment de la commande
- Ajouter `billing_address_snapshot` (jsonb)
- Ajouter `shipping_method` (text, ex: `'bpost_express_24h'`)
- Ajouter `shipping_tracking_number` (text, nullable)

### Nouvelles tables Phase 1

**`product_translations`** — 4 langues obligatoires à la création
```
id, product_id (FK ON DELETE CASCADE),
locale (enum fr/nl/de/en),
name, slug,
short_description, long_description,
ingredients, allergens (text[]),
nutritional_facts_per_100g (jsonb : { energy_kcal, fat_g, carbs_g, protein_g, salt_g }),
seo_title, seo_description,
UNIQUE(product_id, locale),
UNIQUE(locale, slug)
```

**`product_images`**
```
id, product_id (FK ON DELETE CASCADE),
url, alt_text,
sort_order (int, default 0),
is_primary (boolean, default false)
```

**`categories`** + **`category_translations`**
```
categories: id, slug (unique), sort_order, is_active
category_translations: id, category_id (FK ON DELETE CASCADE), locale, name, description (nullable)
UNIQUE(category_id, locale)
```

**`addresses`** — adresses sauvegardées par les clients connectés
```
id, user_id (FK ON DELETE CASCADE),
label (text, ex: 'Maison', nullable),
first_name, last_name,
line1, line2 (nullable),
postal_code, city,
country (text, default 'BE'),
phone (nullable),
is_default_shipping (boolean, default false),
is_default_billing (boolean, default false),
created_at, updated_at
```

**`carts`** + **`cart_items`** — panier persistant (anonyme ou auth)
```
carts:
  id, user_id (nullable, FK), session_token (nullable, indexed),
  created_at, updated_at
  -- exactement un de user_id OU session_token est NOT NULL

cart_items:
  id, cart_id (FK ON DELETE CASCADE),
  product_id (FK ON DELETE CASCADE),
  quantity (int > 0),
  added_at,
  UNIQUE(cart_id, product_id)  -- merge automatique si même produit ajouté 2 fois
```

**`order_items`** — lignes commande avec snapshots
```
id, order_id (FK ON DELETE CASCADE),
product_id (FK ON DELETE SET NULL),  -- snapshot survit même si produit supprimé
product_name_snapshot (text),
product_sku_snapshot (text),
unit_price_cents_snapshot (int),
quantity (int),
line_total_cents (int)
```

**`shipping_rates`** — tarifs livraison éditables admin
```
id,
method (text, ex: 'bpost_express_24h'),
country (text, default 'BE'),
weight_grams_max (int),
price_cents (int),
free_shipping_threshold_cents (int, nullable),
sort_order (int, default 0)
```

**`stripe_webhook_events`** — log des événements traités, pour idempotence
```
id (= stripe event_id, primary key, text),
event_type (text),
processed_at (timestamp),
order_id (text, nullable, FK ON DELETE SET NULL)
```

### Tables explicitement NON créées en Phase 1

`subscriptions`, `subscription_boxes`, `coffret_contents`, `b2b_inquiries`, `discounts`, `discount_redemptions`, `loyalty_accounts`, `loyalty_transactions`, `wishlist_items`, `gift_cards`, `gift_card_redemptions`, `posts`, `post_translations`, `reviews`, `product_batches`, `order_item_batches`, `audit_logs`, `notifications`.

### Décisions structurantes

- Snapshots dans `order_items` et `orders` (adresses) pour stabilité historique : la suppression d'un produit ne casse pas une commande passée.
- Panier anonyme via cookie httpOnly `cart_session_token` (UUID), merge avec compte au login via Server Action.
- Tarifs livraison en DB (admin peut ajuster sans redeploy).
- Stripe IDs (`session_id`, `payment_intent_id`) stockés pour idempotence webhook et trace.
- Slugs uniques par locale (pas globalement) — un produit a 4 slugs différents.
- 4 traductions obligatoires : enforced au niveau application (Zod) + DB (transaction atomique : insert produit + 4 translations ensemble ou tout rollback).

---

## 3. Routes et organisation du code

### Routes publiques (`app/[locale]/`)

```
(shop layout = header + footer)
├── page.tsx                               # Homepage (à étoffer)
├── biscuits/page.tsx                      # Liste catalogue
├── biscuits/[slug]/page.tsx               # Fiche produit
├── panier/page.tsx                        # Panier complet
├── checkout/page.tsx                      # Checkout single-page
└── commande-confirmee/[orderNumber]/page.tsx

(account layout = header + footer + nav latérale compte)
├── compte/page.tsx                        # Dashboard
├── compte/commandes/page.tsx              # Liste commandes
├── compte/commandes/[orderNumber]/page.tsx
├── compte/adresses/page.tsx               # CRUD adresses
└── compte/sign-in (existant Phase 0)
```

### Routes admin (`app/admin/`, non multilingue, français interne)

```
admin/layout.tsx                           # Layout avec sidebar + auth check
├── page.tsx                               # Dashboard (KPIs basiques)
├── produits/page.tsx                      # Liste + recherche/filtre
├── produits/nouveau/page.tsx              # Création (4 traductions)
├── produits/[id]/page.tsx                 # Édition
├── categories/page.tsx                    # CRUD catégories
├── commandes/page.tsx                     # Liste commandes
├── commandes/[orderNumber]/page.tsx       # Détail commande
└── livraison/page.tsx                     # Éditeur tarifs bpost
```

### Routes API (`app/api/`)

```
api/
├── auth/[...nextauth]/route.ts            # Phase 0
└── webhooks/stripe/route.ts               # Phase 1
```

### Composants (`components/`)

```
layout/
  Header.tsx, HeaderClient.tsx
  Footer.tsx
  LocaleSwitcher.tsx
  CartIcon.tsx, CartBadge.tsx

shop/
  ProductCard.tsx, ProductGrid.tsx
  ProductDetail.tsx, ProductImages.tsx, AddToCartButton.tsx
  CategoryFilter.tsx
  CartDrawer.tsx, CartItemRow.tsx
  CheckoutForm.tsx, OrderSummary.tsx

account/
  OrderList.tsx, OrderDetailCard.tsx
  AddressList.tsx, AddressForm.tsx
  AccountSidebar.tsx

admin/
  AdminSidebar.tsx
  ProductForm.tsx, ProductTranslationTabs.tsx, ProductTable.tsx
  CategoryForm.tsx
  OrderTable.tsx, OrderDetailAdmin.tsx
  ShippingRatesEditor.tsx

ui/  (shadcn primitives à ajouter au fur et à mesure : dialog, sheet, table, input, textarea, select, badge, tabs, form, dropdown-menu)
```

### Server Actions (`lib/actions/`)

```
cart.actions.ts          addToCart, updateQuantity, removeItem, mergeAnonymousCart
checkout.actions.ts      createCheckoutSession, calculateShipping
address.actions.ts       create/update/delete/setDefault

admin/products.actions.ts    create/update/delete (transaction avec 4 traductions)
admin/categories.actions.ts
admin/orders.actions.ts      markAsShipped, markAsDelivered
admin/shipping.actions.ts    create/update/delete rate
admin/images.actions.ts      upload, reorder, setPrimary, delete
```

### Libs (`lib/`)

```
db/, env.ts, auth.ts          # Phase 0

shipping/bpost.ts             # calculateShipping(weight, country) → lit shipping_rates
stripe/
  client.ts                   # init Stripe SDK (server-only)
  checkout.ts                 # createCheckoutSession helper
  webhook.ts                  # verify + handlers
email/
  client.ts                   # Resend init (existant Phase 0 minimal)
  templates/
    OrderConfirmation.tsx     # React Email
    OrderShipped.tsx
validators/
  product.ts, cart.ts, checkout.ts, address.ts
```

### Cart UX retenue

Deux complémentaires :
- **`<CartDrawer>`** slide-over depuis la droite, s'ouvre au clic icône panier dans header OU automatiquement après "Ajouter au panier"
- **`/panier`** page complète accessible via lien "Voir mon panier" dans le drawer, pour review avant `/checkout`

### Admin auth

Pas de 2FA TOTP en Phase 1. Vérification simple `session?.user?.role === 'admin'` sur le layout admin. La 2FA va dans Phase 5 avec le reste de la conformité avant lancement.

Première promotion admin : query SQL manuelle directe sur Neon
```sql
UPDATE users SET role = 'admin' WHERE email = 'jeanbaptiste.dhondt1@gmail.com';
```

---

## 4. Parcours achat de A à Z

### Étape 1 — Découverte et ajout au panier

**Anonyme :**
1. Visiteur arrive sur `/biscuits` → grille de produits avec filtres catégorie
2. Clic produit → `/biscuits/[slug]` avec photos + descriptions (selon locale)
3. Sélectionne quantité, clic "Ajouter au panier" (désactivé si `stock_quantity === 0`)
4. Server Action `addToCart` : trouve ou crée un `carts` row avec `session_token` UUID stocké en cookie httpOnly, insère ou incrémente `cart_items`
5. `<CartDrawer>` s'ouvre automatiquement avec le nouvel item

**Connecté :** identique mais `carts.user_id` au lieu de `session_token`.

**Login pendant qu'un panier anonyme existe :** Server Action `mergeAnonymousCart` au callback de login :
- Si user a déjà un panier : fusionne (somme des quantités si même produit)
- Sinon : attache le panier anonyme au user
- Supprime le cookie `cart_session_token`

### Étape 2 — Review panier

`/panier` affiche les items :
- Photo + nom localisé + prix unitaire + qty (modifiable) + sous-total
- Sous-total panier
- Boutons "Continuer mes achats" et "Passer commande"

**Stock check au load** : si un item a `stock < qty`, warning + reset qty au max dispo (ou retire l'item si stock = 0).

### Étape 3 — Checkout (single-page à sections)

`/checkout` requiert un email (invité ou connecté). Composé de :

```
1. Contact (email pré-rempli si connecté, opt-in newsletter)
2. Adresse livraison (dropdown "Mes adresses" si connecté)
3. Adresse facturation (checkbox "Identique à livraison", par défaut coché)
4. Livraison (radio bpost Express 24h, tarif calculé live selon poids)
5. Récap (sous-total, livraison, TVA 6 % incluse, total)
6. Bouton "Payer avec Stripe"
```

**Calcul livraison** : Server Action `calculateShipping(weight, country)` → lit `shipping_rates` filtrant par méthode + `weight_grams_max >= weight` (le plus petit qui couvre) → retourne prix.

**Au clic "Payer"** : Server Action `createCheckoutSession` :
1. Re-vérifie stock dispo (peut avoir changé depuis l'ajout au panier)
2. Re-vérifie tarif livraison
3. Crée `orders` row en statut `pending` avec snapshots adresses, total, locale
4. Crée Stripe Checkout Session :
   - `line_items` = items du panier + ligne livraison
   - `tax_rates` = `STRIPE_TAX_RATE_ID` (6 % inclusive, food BE)
   - `success_url` = `https://beecuit.vercel.app/[locale]/commande-confirmee/{orderNumber}`
   - `cancel_url` = `https://beecuit.vercel.app/[locale]/checkout`
   - `payment_method_types` = `['bancontact', 'card']`
   - `locale` = locale courante
   - `metadata.order_id` = id de notre commande
   - `customer_email` = email saisi
5. Stocke `stripe_session_id` dans `orders`
6. Redirige vers Stripe Checkout hosted URL

### Étape 4 — Paiement chez Stripe

Stripe Checkout gère Bancontact, CB, Apple/Google Pay, 3DS, SCA, interface localisée. Aucun code custom.

### Étape 5 — Webhook (source de vérité)

Endpoint `POST /api/webhooks/stripe`. Écoute `checkout.session.completed` :

1. Vérifie signature HMAC avec `STRIPE_WEBHOOK_SECRET` (401 si invalide)
2. Idempotence : insert dans `stripe_webhook_events` avec event_id en PK. Si conflict (déjà traité) → 200 immédiatement
3. Récupère `orders` row via `metadata.order_id`
4. Si déjà `paid` → 200 (double protection)
5. Transaction DB :
   - Update `orders` : status → `paid`, `paid_at`, `stripe_payment_intent_id`
   - Pour chaque `order_items` : decrement `products.stock_quantity`
   - Si stock devient négatif → log alerte (ne devrait jamais arriver)
6. Hors transaction : envoie email confirmation (Resend, en async)
7. Vide le `cart` correspondant (si user_id ou session_token retrouvable)
8. Réponse 200 à Stripe

**Si stock check échoue au webhook** (race condition rare) : marque order `cancelled`, déclenche refund automatique via Stripe API, envoie email "désolé sold out".

### Étape 6 — Page confirmation

Stripe redirige vers `/[locale]/commande-confirmee/{orderNumber}` :
- Lit l'order en DB, vérifie statut `paid` (si `pending` → polling 5s puis affiche "traitement en cours, vérifie ton email")
- Affiche : "Merci, ta commande #BCT-2026-001234 est confirmée"
- Récap items + total + adresse livraison + ETA (24-48h ouvrées)
- Lien "Suivre ma commande" → `/compte/commandes/[orderNumber]` (si connecté) sinon "On t'a envoyé un email"
- Bouton "Continuer mes achats"

### Étape 7 — Marquage expédié (admin)

Admin va dans `/admin/commandes/[orderNumber]` → bouton "Marquer comme expédiée" + champ n° tracking bpost → Server Action :
- Update `orders.status = 'shipped'`, `shipping_tracking_number`
- Envoie email "Ta commande est en route" avec lien tracking bpost

### Génération n° de commande

Format `BCT-YYYY-NNNNNN`. Implémentation : séquence Postgres dédiée + format côté application (à finaliser dans le plan d'implémentation).

### Gestion d'erreurs

| Scénario | Réponse |
|---|---|
| Cart vide au checkout | Redirect `/panier` + toast "Ton panier est vide" |
| Stock insuffisant à `createCheckoutSession` | Toast "X est en rupture" + reload `/panier` |
| Stripe Checkout creation fail | Toast erreur + log Vercel, garde commande en `pending` |
| Webhook signature invalide | 401 + log alerte |
| Webhook arrive plusieurs fois | Idempotence via `stripe_webhook_events`, retourne 200 |
| Race condition stock au webhook | Refund auto + email "désolé" |
| User ferme tab pendant paiement | Order reste `pending` ; webhook arrivera si paiement réussi ; cron quotidien archive les `pending` > 24h (à faire en Phase 5) |

---

## 5. Admin

### Layout

`app/admin/layout.tsx` :
- Vérifie `session?.user?.role === 'admin'` (sinon redirect `/fr/sign-in?callbackUrl=/admin`)
- Sidebar gauche fixe : Dashboard, Produits, Catégories, Commandes, Livraison, Sign-out
- Topbar : email user + indicateur env (DEV/STAGING/PROD)
- Tout en français (admin pas exposé client)

### `/admin/produits` — Liste

- Table shadcn avec : Photo principale, SKU, Nom (FR), Catégorie, Prix, Stock, Statut, Actions
- Recherche par nom FR ou SKU, filtre par catégorie + statut
- Pagination 20/page
- Bouton "Nouveau produit" → `/admin/produits/nouveau`
- Indicateur : ligne rouge clair si stock < 5, grisée si stock = 0

### `/admin/produits/nouveau` et `/admin/produits/[id]` — Formulaire

**Colonne gauche — données partagées :**
- SKU (text, unique, required)
- Type (select : biscuit)
- Catégorie (select des catégories actives)
- Prix TTC (number, € → cents en DB)
- Poids (number, grammes)
- Stock (number)
- Actif (switch)
- En vedette (switch)
- Section images : drop zone multi-upload, drag-and-drop pour réordonner, bouton "Photo principale"

**Colonne droite — Tabs FR / NL / DE / EN** (toutes obligatoires) :
- Nom (text)
- Slug (kebab-case, auto-généré depuis nom mais éditable)
- Description courte (text, max 160 chars)
- Description longue (textarea, max 2000 chars)
- Ingrédients (textarea)
- Allergènes (multi-select : Gluten, Lait, Œuf, Soja, Arachide, Fruits à coque, Sésame, Sulfites)
- Valeurs nutritionnelles /100g (5 champs : énergie kcal, mat. grasses g, glucides g, protéines g, sel g)
- SEO title (text, max 60 chars)
- SEO description (text, max 160 chars)

**Validation** : Zod schema strict refuse si une des 4 traductions a un champ vide. Tabs avec point rouge si traduction incomplète. Bouton "Enregistrer" disabled tant que validation rouge.

**Boutons** : Enregistrer, Annuler, et en mode édition : Supprimer (avec confirm modal).

### `/admin/categories` — CRUD

- Liste : nom FR, slug, nombre de produits, sort_order, actions
- Form : slug + 4 traductions (nom + description)
- Suppression : vérifie "X produits utilisent cette catégorie", confirme, set products.category_id = NULL

### `/admin/commandes` — Liste

- Table : N° commande, Date, Client (email), Total, Statut (badge coloré), Actions
- Filtres : statut, date range, recherche par email/n° commande
- Click ligne → `/admin/commandes/[orderNumber]`

### `/admin/commandes/[orderNumber]` — Détail

- Récap items (snapshots) + adresses (snapshots) + totaux + méthode paiement
- Historique statuts (timestamps pending → paid → shipped → delivered)
- Actions selon statut :
  - `paid` : bouton "Marquer expédiée" → modal saisie n° tracking bpost → confirme → envoie email
  - `shipped` : bouton "Marquer livrée" (manuel, bpost API webhook = Phase 2)
  - `cancelled` : info "Annulée le ... — remboursement Stripe ..."
- Bouton "Voir dans Stripe" (ouvre `dashboard.stripe.com/payments/{id}`)
- Note interne (textarea libre, stockée dans `orders.metadata`)

### `/admin/livraison` — Tarifs bpost

Table éditable :

| Méthode | Poids max (g) | Prix TTC (€) | Free shipping si total ≥ | Actions |
|---|---|---|---|---|
| bpost_express_24h | 1000 | 5,50 | 50,00 | Édit/Suppr |
| bpost_express_24h | 2000 | 7,50 | 50,00 | Édit/Suppr |
| bpost_express_24h | 5000 | 12,00 | 50,00 | Édit/Suppr |

Bouton "Ajouter une tranche" en bas.

### Upload images : choix techno

**Vercel Blob** pour Phase 1 (au lieu de Cloudflare R2 prévu spec d'origine) :
- Plus simple à intégrer (`@vercel/blob`, 5 lignes pour upload)
- Free tier 1 GB → suffisant pour Phase 1 (~30-50 produits × 5 photos)
- Pas de compte/bucket externe à configurer
- Migration vers R2 en Phase 3 (assets 3D plus lourds) prévue

### Server Actions admin

```
admin/products.actions.ts
  createProduct(data + 4 translations + images[])
  updateProduct(id, data + 4 translations + images[])
  deleteProduct(id)  -- soft delete : is_active = false

admin/categories.actions.ts
  create/update/delete category

admin/orders.actions.ts
  markAsShipped(orderNumber, trackingNumber)
  markAsDelivered(orderNumber)

admin/shipping.actions.ts
  create/update/delete rate

admin/images.actions.ts
  uploadImage(productId, file)
  reorderImages(productId, [imageIds])
  setPrimaryImage(productId, imageId)
  deleteImage(imageId)
```

Toutes vérifient `auth()` + `role === 'admin'` en première ligne.

---

## 6. Tests, env vars, seed, déploiement, monitoring

### Tests

**Unit (Vitest)** — fonctions pures :
```
tests/unit/
  shipping.test.ts           calculateShipping(weight) → bonne tranche
  tax.test.ts                VAT 6 % inclusive extraction
  order-totals.test.ts       sous-total + livraison + arrondi
  cart-merge.test.ts         fusion anonymous + auth
  validators/                Zod schemas (product/cart/checkout/address)
  slug.test.ts               kebab-case generation
```

**Integration (Vitest avec DB Neon branch dev)** :
```
tests/integration/
  cart-actions.test.ts          add/update/remove + persistance
  product-crud.test.ts          création 4 trad, refus si une manque
  stock-decrement.test.ts       webhook simulation → stock--
  webhook-idempotency.test.ts   même event 2 fois = 1 effet
  webhook-signature.test.ts     rejet si HMAC invalide
```

**E2E (Playwright)** — scénarios critiques :
```
tests/e2e/
  home.spec.ts                  (Phase 0)
  auth.spec.ts                  (Phase 0)
  guest-purchase.spec.ts        parcours achat invité bout-en-bout
  auth-purchase.spec.ts         parcours achat connecté
  out-of-stock.spec.ts          bouton désactivé + warning panier
  admin-create-product.spec.ts  form 4 langues, refus si NL manque
  admin-mark-shipped.spec.ts    marquer expédié + email envoyé
```

**Cibles CI :**
- Unit + intégration sur PR (Stripe sandbox, Resend test)
- E2E sur PR (Stripe sandbox)
- Tous tests verts en < 5 min

**Stripe en local :** test cards officielles (`4242 4242 4242 4242`) + `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

### Env vars à ajouter (en plus de Phase 0)

```bash
# Stripe (test mode en dev/staging, live en prod)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_TAX_RATE_ID="txr_..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

Validation Zod dans `lib/env.ts` étendue.

### Seed data

`scripts/seed/index.ts` — script idempotent (UPSERT par sku/slug) :

```
5 catégories : Sablés, Spéculoos, Chocolat, Saisonniers, Sans Gluten
8 produits demo avec 4 traductions complètes :
  • Spéculoos artisanal 200g — 6,90 €
  • Sablé chocolat noir 180g — 8,50 €
  • Macaron noisette x6 — 12,00 €
  • Cookies pépites chocolat 250g — 9,90 €
  • Galettes pur beurre 150g — 5,90 €
  • Spéculoos sans gluten 180g — 7,90 €
  • Florentins amandes 200g — 10,50 €
  • Spritz vanille 200g — 7,50 €
  Chaque produit : 2 photos placeholder, stock 50
3 tarifs bpost Express : 1000g/5,50€, 2000g/7,50€, 5000g/12,00€
1 user admin (toi)
```

Lancement : `pnpm seed`. Ré-exécutable sans doublons.

### Setup Stripe (manuel, 1 fois)

1. Créer compte Stripe ou réutiliser
2. **Settings → Payment methods** : activer Bancontact + Carte
3. **Tax Rates → Add** : 6 % inclusive, type VAT, country BE, name "TVA Belgique 6% Alimentation" → copier `txr_xxx` dans `STRIPE_TAX_RATE_ID`
4. **Webhooks → Add endpoint** : URL = `https://beecuit.vercel.app/api/webhooks/stripe`, événements = `checkout.session.completed` → copier signing secret dans `STRIPE_WEBHOOK_SECRET`
5. **Radar** : activé par défaut, free, gardé

Documenté pas-à-pas dans le plan d'implémentation.

### Déploiement

- Vercel auto-deploy sur push main (configuré Phase 0)
- Migrations Drizzle appliquées manuellement depuis local avant chaque push qui touche le schéma (`pnpm db:migrate`)
- Pas de modification CI au-delà de la matrix existante

### Monitoring Phase 1

Minimum nécessaire :
- **Vercel Analytics** : free, activé en 1 clic dashboard
- **Stripe Dashboard** : monitoring natif paiements/échecs
- **Logs Vercel** : pour debug webhooks (Functions tab)

Reporté :
- **Sentry** → Phase 4 ou 5
- **PostHog** → Phase 4
- **UptimeRobot** → Phase 5

### Performance (cible Phase 1)

Pas de budgets stricts (la spec section 5 vise Phase 3 quand le 3D arrive). Phase 1 simplement :
- RSC par défaut, client components uniquement pour formulaires et panier
- Images via Vercel Blob → Vercel Image Optimization auto (AVIF/WebP)
- `/biscuits` (liste) : SSG avec revalidate 60s
- `/biscuits/[slug]` : dynamic (stock variable)
- Lighthouse cible informelle : 90+ sur homepage et catalog

---

## 7. Estimation et critères de succès

**Estimation effort solo :** 4-5 semaines de travail focalisé.

**Découpage indicatif (à affiner dans le plan d'implémentation) :**
1. Layout global + extensions schéma + nouvelles tables Drizzle (~3-4 j)
2. Catalogue public (liste + détail) (~4-5 j)
3. Admin produits + traductions strictes + upload images (~5-6 j)
4. Admin catégories + commandes + livraison (~3-4 j)
5. Panier (DB + Server Actions + drawer + page) (~4 j)
6. Checkout + intégration Stripe + webhook + emails (~5-6 j)
7. Espace compte (commandes + adresses) (~2-3 j)
8. Tests E2E + intégration + bug fixes (~3-4 j)

**Critères de succès Phase 1 :**

- [ ] Un visiteur peut parcourir le catalogue en FR/NL/DE/EN
- [ ] Un visiteur invité peut acheter (sans créer de compte)
- [ ] Un visiteur connecté peut acheter et voir sa commande dans `/compte`
- [ ] Bancontact + CB fonctionnent en prod (test avec carte réelle, 1 €)
- [ ] Webhook Stripe est appelé et marque la commande payée
- [ ] Email de confirmation arrive (vérifié sur Gmail)
- [ ] Admin peut créer un produit avec 4 traductions strictes
- [ ] Admin peut marquer une commande expédiée et l'email part
- [ ] Stock se décrémente correctement
- [ ] Tous tests CI verts (unit + intégration + E2E)
- [ ] Deploy Vercel verte sans erreur middleware
- [ ] Lighthouse 90+ sur homepage et /biscuits

---

## 8. Décisions prises au moment du spec (verrouillage des détails mineurs)

Ces points avaient été pointés comme ambigus pendant le brainstorming, ils sont tranchés ici pour ne pas être rediscutés pendant l'implémentation :

- **Format n° de commande :** `BCT-YYYY-NNNNNN` (séquence Postgres dédiée, formatée côté application). Cohérent avec le nom de marque, lisible humainement.
- **Photos placeholder pour seed :** `picsum.photos` (URLs déterministes), zéro asset à gérer en repo, remplaçables par de vrais visuels à n'importe quel moment via l'UI admin.
- **Allergènes multi-select :** les **14 allergènes standards UE 1169/2011** (Gluten, Crustacés, Œufs, Poissons, Arachides, Soja, Lait, Fruits à coque, Céleri, Moutarde, Sésame, Anhydride sulfureux et sulfites, Lupin, Mollusques). Liste exhaustive — conformité légale même si certains sont rares en biscuiterie.
- **Auto-slug :** auto-généré depuis le nom à la **création seulement**. Figé après création pour ne pas casser les URLs SEO. Éditable manuellement en admin si besoin (mais avec warning "Changer le slug cassera les liens existants").
- **Texte des emails transactionnels :** rédigés directement dans les templates React Email pendant l'implémentation. Pas besoin de validation préalable, ils seront ajustables après coup sans impact technique.

Aucune décision restante à brainstormer avant le plan d'implémentation.

---

**Fin du document.**

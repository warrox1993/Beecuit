# BeeCuit — Design Document

**Date :** 2026-05-22
**Statut :** Validé (brainstorming) — à confirmer avant implémentation
**Auteur :** Jean-Baptiste Dhondt + Claude (brainstorming session)

---

## 1. Vision & contexte

**BeeCuit** est une boutique e-commerce premium pour un magasin de biscuits artisanal basé à Liège, Belgique. Le projet vise une expérience d'achat immersive avec une forte composante 3D et animations, dans un univers visuel chaleureux ("cozy & gourmand").

### Contexte projet

- **Type :** vraie boutique à lancer (paiements réels, vraies commandes)
- **Marque :** fictive — créée intégralement dans le cadre du projet
- **Périmètre géographique :** Belgique (FR/NL/DE/EN)
- **Maintenance :** dev solo (Jean-Baptiste), code + maintien
- **Budget assets externes :** 0 € (toutes ressources libres ou générées)
- **Modèle de lancement :** scope complet en une seule release V1, durée flexible (16-23 semaines estimées)

### Identité de marque

| Aspect | Choix |
|---|---|
| Nom | BeeCuit (bee + biscuit) |
| Direction artistique | Cozy & gourmand chaleureux |
| Univers | Cuisine artisanale, lumière dorée du soir, vapeur, terracotta/crème/brun chaud |
| Tonalité | Réconfortant, accessible premium |
| Style 3D | Stylisé premium (low-poly raffiné), pas photoréaliste |
| Références | Spline.design, Stripe illustrations, Bruno Simon, Vercel |

### Palette & typo

```
Couleurs :
  --honey       #E4A11B   accent doré principal
  --honey-dark  #B07A0E   hover / textes accent
  --cream       #FBF6EE   fond clair principal
  --terracotta  #C97757   secondaire chaud
  --warm-brown  #4A332A   texte primaire (au lieu du noir)
  --cookie      #C68B5A   surfaces / cards
  --soft-rose   #E8D2C5   touches douces
  --leaf        #708B58   accent végétal discret

Typographies :
  Display : Fraunces (serif chaleureux, variable, Google Fonts)
  Body    : Inter (lisibilité, variable)
  Mono    : JetBrains Mono (références produit, codes promo)
```

---

## 2. Périmètre fonctionnel

### Catalogue & offres

- **Biscuits unitaires** (au sachet / paquet) — ~10-20 références
- **Coffrets pré-composés** — 4-6 thématiques fixes ("Découverte", "Gourmand", "Chocolat"...)
- **Configurateur 3D de coffrets** — l'utilisateur compose lui-même son coffret (6, 12 ou 24 biscuits)
- **Abonnement mensuel** — formules Mini (6), Classique (12), Famille (24), avec choix d'engagement (sans, 6 mois, 12 mois)
- **Offre B2B** — devis personnalisés, cadeaux d'entreprise avec gravure / logo

### Localisation & livraison

- **Langues :** FR (Wallonie), NL (Flandre), DE (Ostbelgien), EN (international/convenience)
- **Zone de vente :** Belgique uniquement (V1)
- **TVA :** 6 % (denrées alimentaires belges), calculée via Stripe Tax
- **Modes de livraison :**
  - Points de retrait bpost
  - Points relais Mondial Relay
  - Express bpost 24h
  - Express DHL 24h
  - Click & Collect en magasin (Liège)

### Paiements

- **Bancontact** (essentiel en Belgique, ~40 % des paiements e-commerce locaux)
- **Cartes bancaires** Visa / Mastercard
- **Apple Pay** + **Google Pay** (express checkout mobile)
- *(PayPal différé, pas en V1)*

### Comptes & engagement

- **Checkout invité** activé (réduit l'abandon)
- **Comptes clients** optionnels avec historique, abonnement, wishlist, fidélité
- **Avis clients** sur produits (modération admin)
- **Blog / Journal de la maison** (recettes, savoir-faire) — multilingue
- **Programme fidélité par points** (1 € = 10 pts, 100 pts = 5 € off)
- **Codes promo** (% / montant fixe / livraison offerte, conditions)
- **Cartes cadeaux** (envoi planifié, utilisation partielle, expiration 12 mois)
- **Wishlist** (favoris pour comptes connectés)
- **Notifications in-app** (cloche header)

### Gestion opérationnelle

- **Gestion lots / DLC** (FIFO automatique, alertes péremption)
- **Logs d'audit admin** (traçabilité actions back-office)
- **Recommandations cross-sell** (job analyse co-occurrences commandes 90j)
- **Newsletter** (opt-in explicite, désinscription en 1 clic)

---

## 3. Architecture technique

### Approche retenue

**Monolithe Next.js** : une seule application qui gère front public, espace client, admin, API, checkout. Idéal pour un dev solo, viable sur free tiers jusqu'à plusieurs centaines de commandes/mois.

### Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Langage | TypeScript strict |
| UI | Tailwind CSS v4 + shadcn/ui |
| 3D | React Three Fiber + Drei + Rapier (physique) + Three.js |
| Animation 2D | GSAP (ScrollTrigger) + Framer Motion + Lenis (smooth scroll) |
| ORM | Drizzle (typesafe) |
| Base de données | Postgres sur Neon (free tier, branching dev/staging) |
| Auth | Auth.js v5 (magic links + Google OAuth) |
| i18n | next-intl (URLs prefixées /fr/, /nl/, /de/, /en/) |
| Paiements | Stripe Checkout + Subscriptions + Tax |
| Emails | Resend + React Email (free tier 3000/mois) |
| Stockage | Cloudflare R2 (free tier 10 GB) — modèles 3D, photos |
| Hosting | Vercel (free tier) |
| Monitoring | Sentry (errors) + Vercel Analytics + PostHog (analytics) |
| Rate limiting | Upstash Redis (free tier) |
| Tests | Vitest (unit/integration) + Playwright (E2E) |
| CI/CD | GitHub Actions |
| Outils de traduction | DeepL free tier (500k chars/mois) pour brouillons |

### Structure des routes

```
app/
├── [locale]/                         # FR, NL, DE, EN
│   ├── (shop)/
│   │   ├── page.tsx                  # / — homepage avec hero 3D
│   │   ├── biscuits/                 # catalogue unitaires
│   │   ├── biscuits/[slug]/          # fiche produit + viewer 3D
│   │   ├── coffrets/
│   │   ├── coffrets/[slug]/
│   │   ├── composer/                 # CONFIGURATEUR 3D
│   │   ├── abonnement/
│   │   ├── entreprises/              # offre B2B
│   │   ├── journal/                  # blog
│   │   ├── journal/[slug]/
│   │   ├── notre-histoire/
│   │   ├── boutique-liege/
│   │   ├── contact/
│   │   ├── panier/
│   │   ├── checkout/
│   │   ├── commande-confirmee/[id]/
│   │   ├── cgv/
│   │   ├── mentions-legales/
│   │   ├── confidentialite/
│   │   └── cookies/
│   └── (account)/
│       ├── compte/                   # dashboard
│       ├── compte/commandes/
│       ├── compte/abonnement/
│       ├── compte/adresses/
│       ├── compte/cartes-cadeaux/
│       ├── compte/fidelite/
│       ├── compte/wishlist/
│       ├── compte/avis/
│       ├── compte/preferences/
│       └── compte/rgpd/
├── admin/                            # back-office (non multilingue)
│   ├── dashboard/
│   ├── produits/
│   ├── coffrets/
│   ├── stock/
│   ├── commandes/
│   ├── abonnements/
│   ├── b2b/
│   ├── avis/
│   ├── carte-cadeaux/
│   ├── promotions/
│   ├── fidelite/
│   ├── blog/
│   ├── livraison/
│   ├── newsletter/
│   ├── audit/
│   └── utilisateurs/
└── api/
    ├── webhooks/stripe/
    ├── checkout/
    ├── shipping/rates/
    └── contact-b2b/
```

### Organisation du code

```
beecuit/
├── app/                              # routes (au-dessus)
├── components/
│   ├── 3d/                           # scènes R3F : hero, configurateur, viewer
│   ├── shop/                         # produits, panier, checkout
│   ├── account/
│   ├── admin/
│   ├── blog/
│   ├── layout/                       # header, footer, nav
│   └── ui/                           # shadcn/ui + custom primitives
├── lib/
│   ├── db/                           # Drizzle schemas + migrations
│   ├── stripe/                       # client, helpers, webhook handlers
│   ├── i18n/                         # config, helpers, dictionnaires
│   ├── shipping/                     # calcul tarifs bpost / Mondial Relay
│   ├── auth/                         # Auth.js config
│   ├── email/                        # templates React Email + helpers Resend
│   ├── analytics/
│   ├── three/                        # utils 3D : loaders, optim, presets
│   └── validators/                   # schémas Zod partagés
├── public/
│   ├── models/                       # .glb compressés Draco (fallback / petits assets)
│   └── images/
├── messages/                         # next-intl
│   ├── fr.json
│   ├── nl.json
│   ├── de.json
│   └── en.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                          # Playwright
├── scripts/
│   ├── blender/                      # scripts Python automatisation 3D
│   └── seed/                         # données d'amorçage
└── ...config files
```

---

## 4. Modèle de données

> Voir section complète dans la séance de brainstorming. Synthèse des tables ci-dessous.

### Tables produits & catalogue

- `products` (type: biscuit / coffret / subscription_plan)
- `product_translations` (4 locales)
- `product_images`
- `coffret_contents` (relation many-to-many biscuit↔coffret)
- `categories` + `category_translations` + `product_categories`
- `product_relations` (cross-sell)
- `product_batches` + `order_item_batches` (lots / DLC, FIFO)

### Tables utilisateurs & adresses

- `users` (role: customer / b2b / admin, locale préférée)
- `accounts` (Auth.js providers)
- `sessions`
- `addresses`

### Tables commandes

- `orders` (status, totaux, snapshots adresses, locale, méthode livraison, Stripe IDs)
- `order_items` (snapshots noms, metadata coffrets custom / gravure B2B)

### Tables abonnements

- `subscriptions` (lié à Stripe Subscription, plan, jour livraison, statut)
- `subscription_boxes` (historique compositions livrées)

### Tables B2B

- `b2b_inquiries` (devis avec brief gravure)

### Tables fidélisation

- `discounts` + `discount_redemptions`
- `loyalty_accounts` (balance, tier) + `loyalty_transactions`
- `wishlist_items`
- `gift_cards` + `gift_card_redemptions`

### Tables contenu

- `posts` + `post_translations` (blog MDX)
- `reviews` (avec status modération, is_verified_purchase)

### Tables opérationnelles

- `carts` + `cart_items` (anonymes + auth)
- `contacts` (messages reçus)
- `newsletter_subscribers`
- `shipping_zones` + `shipping_rates`
- `audit_logs`
- `notifications`

### Choix structurants

- **i18n** via tables `_translations` séparées (par locale) — meilleures perfs et flexibilité que JSON
- **Snapshots** dans `order_items` (nom, prix au moment de la commande) — historique stable
- **Coffrets custom** stockés dans `order_items.metadata` (pas de produit DB éphémère)
- **State machine ordres** : enum status avec transitions explicites en code
- **Tarifs livraison en DB** (éditables admin sans redéploiement)
- **Lots / DLC FIFO** : consommation auto au paiement, FIFO sur `best_before`

---

## 5. Expérience 3D & UI

### Scènes 3D

#### Scène hero (homepage)

Diorama isométrique stylisé d'un atelier de biscuiterie. Lumière dorée chaude.

- Plan de travail bois, rouleau, farine, pots de miel, biscuits
- Four ancien en arrière avec vapeur (shader procédural)
- 3 abeilles low-poly en trajectoires sinusoïdales
- Étagère avec coffrets BeeCuit empilés
- Particules de farine (~80 instances)
- Lumière volumétrique (shader fragment)

**Interactions :** caméra scroll-driven (GSAP ScrollTrigger), parallaxe souris (5°), abeilles attirées vers curseur, lévitation au hover des coffrets, transition cinématique au clic.

#### Configurateur 3D (`/composer`)

Boîte 3D ouverte vue de 3/4. Au clic sur un biscuit du catalogue, le biscuit "tombe" via physique Rapier et se range automatiquement (algorithme de packing par rangées avec rotation aléatoire ±15°). Compteur live "X / Y biscuits", total. Variantes Mini/Classique/Grand/Découverte.

Stockage composition en `cart_items.metadata` puis `order_items.metadata`.

#### Viewer produit (pages produit individuelles)

Canvas R3F occupant ~50 % écran (desktop) / 70vh (mobile). OrbitControls avec limites soft, auto-rotation lente quand inactif. Toggle "exploded view" pour coffrets. Échelle réelle avec pièce de 2 € comme repère.

#### Touches 3D ambiantes

Petits biscuits flottants en background des sections, étoiles dorées au scroll, curseur custom avec abeille discrète (desktop only).

### Animations 2D

- **Lenis** smooth scroll (sauf admin)
- **GSAP ScrollTrigger** pour timelines liées au scroll (reveals, parallaxes, masques)
- **Framer Motion** pour micro-interactions, transitions cards, layoutId hero
- **View Transitions API** (Next.js 15) entre pages
- **CSS @scroll-timeline** pour effets peu coûteux

### Fallbacks (cruciaux)

| Contexte | Comportement |
|---|---|
| `prefers-reduced-motion` | Aucune animation auto, scènes 3D en statique (1ère frame), pas de Lenis |
| Mobile bas de gamme (memory < 4 Go / GPU faible) | Hero remplacé par image statique HQ + vidéo loop 720p, configurateur sans shadows/particules, viewer remplacé par carrousel 4 photos |
| Chargement | Skeletons, poster image avant canvas 3D |

### Stratégie assets 3D (0 €)

| Élément | Source |
|---|---|
| Décor cuisine + ustensiles | Quaternius / Kenney.nl (CC0) |
| Biscuits BeeCuit signature | Meshy.ai free tier + script Blender automatisation |
| Abeilles animées | Mixamo (Adobe gratuit) |
| Packaging coffrets | Procédural Three.js (boîtes paramétrées) |
| HDRIs éclairage | Poly Haven (CC0) |
| Textures (bois, pierre, tissu) | AmbientCG (CC0) |
| Particules (farine, étincelles, miettes) | Procédural Three.js |
| Pipeline final | gltf-pipeline (Draco compression) + KTX2 textures |

**Note honnêteté :** ce niveau est "premium stylisé", pas "photoréaliste Awwwards". Le photoréaliste nécessite un artiste 3D dédié, hors budget.

### Budgets performance

| Métrique | Mobile | Desktop |
|---|---|---|
| LCP | < 2.5 s | < 1.5 s |
| FCP | < 1.5 s | < 1 s |
| INP | < 200 ms | < 100 ms |
| CLS | < 0.1 | < 0.1 |
| Bundle initial JS gzipped | < 200 KB | < 250 KB |
| Hero canvas startup | < 1.5 s après LCP | < 800 ms |
| FPS scène hero | ≥ 30 | ≥ 60 |

---

## 6. Parcours commerciaux

### Tunnel B2C

```
Catalogue → Panier → Checkout unifié → Stripe Checkout → Webhook → Confirmation
```

**Choix :** Stripe Checkout hosted page pour V1 (gère Bancontact / CB / Apple-Google Pay / 3DS / SCA / multilingue / TVA auto). Migration vers Embedded Checkout possible en V2.

### Étape checkout (page unique multi-sections)

1. Contact (email + opt-in newsletter)
2. Livraison (5 modes, calcul tarif live via Server Action sur `shipping_rates`)
3. Code promo / fidélité / carte cadeau (3 champs cumulables sous règles)
4. Récap (sous-total, livraison, réduction, TVA, total)
5. Bouton "Payer avec Stripe"

### Sécurité paiement

- Webhook Stripe signature HMAC vérifiée
- Aucune logique métier dans `success_url` (manipulable) — tout via webhook
- Idempotency keys sur création d'orders
- Rate limit sur `/api/checkout/*` (Upstash)
- Stripe Radar activé

### Tunnel abonnement

3 formules × 3 engagements. Jour de livraison choisi par client. Job mensuel sélectionne biscuits du mois (rotation thématique). Gestion client : pause 1-3 mois, modification adresse, annulation immédiate. Stripe Customer Portal pour la facturation.

### Tunnel B2B (devis manuel)

Formulaire détaillé (entreprise, n° TVA, quantité, date, brief gravure + upload logo) → DB `b2b_inquiries` → email admin → admin envoie Stripe Payment Link → paiement → status `won`.

### Cartes cadeaux

Produit virtuel avec champs spéciaux (destinataire, message, date envoi). Email Resend programmé à `delivery_at` (job cron quotidien). Code unique cryptographique. Utilisable au checkout (déduit du total, ne réduit pas TVA), restitution partielle.

### Emails transactionnels (Resend + React Email, 4 locales)

| Trigger | Email |
|---|---|
| Inscription | Bienvenue chez BeeCuit |
| Magic link | Ton lien de connexion |
| Paiement confirmé | Ta commande est confirmée |
| Expédition | Ta commande est en route + n° suivi |
| Livraison | Profite + demande d'avis |
| Abonnement renouvelé | Ta box du mois arrive |
| CB expirante | Mets à jour ta carte |
| Carte cadeau reçue | Quelqu'un t'a offert... |
| Devis B2B reçu | Demande bien reçue |
| Anniversaire compte | Joyeux anniversaire + code -10 € |

---

## 7. Admin, espace client, contenu

### Back-office `/admin`

Auth séparée (role admin) + 2FA TOTP. shadcn/ui denses, utilitaire et efficace. Sections : dashboard, produits, coffrets, stock (lots/DLC), commandes, abonnements, B2B, avis (modération), cartes cadeaux, promotions, fidélité, blog, livraison (édition tarifs), newsletter, audit, utilisateurs.

### Espace client

Dashboard, commandes (+ factures PDF), abonnement (modifier/pauser/annuler), adresses, cartes cadeaux, fidélité, wishlist, avis, préférences, RGPD (export + suppression).

### Auth

Auth.js v5, magic link email (passwordless) en provider principal + Google OAuth. Sessions JWT 30 j, CSRF natif, rate limit 3/min/IP sur magic link.

### i18n & traductions

next-intl, URLs prefixées (`/fr/`, `/nl/`, `/de/`, `/en/`). Détection Accept-Language + cookie `NEXT_LOCALE`. 3 niveaux :
1. Interface (`messages/{locale}.json`) — traduit manuellement
2. Contenu produits (`product_translations`) — édité admin, brouillons DeepL
3. Contenu blog/pages (`post_translations` + MDX par locale)

Slugs neutres (kebab-case, partagés entre langues) pour éviter duplications URL.

### Avis clients

Invitation par email 7 jours après livraison (job cron). Modération admin avant publication. Affichage : étoiles moyennes, distribution, badge "avis vérifié" si `is_verified_purchase`. Anti-spam : honeypot + rate limit + mots interdits.

### Blog (Journal)

MDX par locale (composants React custom : `<RelatedProduct slug="..." />`). Éditeur admin : textarea + preview live. Catégories (Recettes, Savoir-faire, Histoires d'abeilles, Saisons). RSS par locale. Open Graph + JSON-LD `Article`.

### Notifications

Cloche header → dropdown notifications non lues. Page `/compte` liste récentes. Génération auto : changement statut commande, abonnement, gift reçu, demande d'avis.

---

## 8. Conformité, sécurité, performance, SEO

### Conformité légale (Belgique + UE)

- **RGPD :** bannière cookies (3 catégories), page `/cookies` détaillée, registre traitements, export/suppression données via espace client
- **CGV** adaptées droit belge : rétractation 14 j hors denrées périssables, dérogations explicites, PDF
- **Mentions légales :** identité, BCE, TVA, hébergeur, médiateur conso
- **Marketing :** opt-in explicite, lien désabonnement obligatoire dans emails commerciaux, double opt-in
- **Étiquetage alimentaire UE 1169/2011 :** ingrédients, allergènes en gras, valeurs nutritionnelles /100g — champs DB prévus
- **TVA belge 6 %** via Stripe Tax
- **Accessibilité :** vise WCAG 2.1 AA

### Sécurité applicative

- Headers : CSP strict, HSTS, X-Frame-Options DENY, Referrer-Policy
- Validation Zod sur tous inputs
- Rate limiting Upstash sur endpoints sensibles
- Secrets Vercel env, rotation
- Webhooks Stripe : signature HMAC vérifiée
- Auth : sessions sécurisées (httpOnly, sameSite=strict, secure), rotation login
- SQL injection impossible (Drizzle prepared statements)
- XSS : rehype-sanitize sur MDX
- File uploads : validation MIME + magic bytes, taille limite
- Admin : 2FA TOTP obligatoire
- Backups : Neon PITR 7 jours

### Performance (au-delà des budgets section 5)

- Bundle splitting, chunk 3D lazy
- next/image AVIF + WebP, Cloudflare R2 + Image Resizing
- Modèles Draco + textures KTX2 BasisU
- LOD 3 niveaux, frustum culling auto
- Suspense + streaming SSR, poster avant canvas
- Variable fonts self-hosted, `font-display: swap`, subset Latin/Latin-Ext
- ISR catalogue 60 s, SWR fiche produit 1 h, SSG blog
- Neon pooled, indexes ciblés, N+1 traqué en dev

### SEO multilingue

- Sitemap par locale + index principal
- hreflang auto sur paires de langues
- JSON-LD : `Product`, `Offer`, `Review`, `Article`, `LocalBusiness`, `BreadcrumbList`, `FAQPage`, `Organization`
- OG images dynamiques (`@vercel/og`) par produit
- Meta titles/descriptions uniques par locale
- robots.txt disallow `/admin/`, `/compte/`, `/checkout`
- 404 / 500 stylisées multilingues

---

## 9. Tests, déploiement, monitoring

### Pyramide de tests

- **Unit (Vitest)** : utils, Server Actions, calculs (livraison, TVA, points), validators Zod, ~5 s CI
- **Integration (Vitest)** : flows DB + Stripe sandbox, ~30 s CI
- **E2E (Playwright)** : 5-10 scénarios critiques (achat invité bout-en-bout, inscription + 1ère commande, composer coffret, s'abonner, refus cookies puis achat), 2-5 min CI
- **Tests visuels** UI critiques : Playwright screenshots ou Chromatic free tier

Pas de TDD strict pour le 3D (difficile à tester).

### Environnements

```
DEV (localhost)      → Stripe test, Neon branch dev, R2 dev, Resend test
STAGING (Vercel)     → Stripe test, Neon branch staging, R2 staging, Resend test
PROD (Vercel)        → Stripe live, Neon main, R2 prod, Resend live
```

### Git workflow

```
main         → prod (Vercel auto-deploy)
staging      → preview Vercel
feature/*    → preview Vercel par PR
```

### CI/CD (GitHub Actions)

- **on PR :** lint + typecheck + unit + integration + Lighthouse CI
- **on merge main :** deploy prod (avec manual approval)

### Monitoring

- **Sentry** errors (free 5k events/mois)
- **Vercel Analytics** web vitals
- **PostHog** analytics + heatmaps + funnels (free 1M events)
- **UptimeRobot** uptime SMS alert
- **Logs DB** Neon

### Alertes

- Erreur 5xx > 1 % sur 5 min → Sentry email
- Échec checkout > 5 % sur 1 h → custom webhook alert
- Down > 2 min → UptimeRobot SMS

---

## 10. Roadmap de construction

Estimation totale : **16-23 semaines** de travail focalisé pour le dev solo.

**Note sur l'implémentation :** ce spec décrit le produit complet (V1). Les plans d'implémentation détaillés seront produits **phase par phase** (un plan par phase ci-dessous), pour rester gérables et reviewables. Le premier plan d'implémentation portera sur la Phase 0.

### Phase 0 — Fondations (1-2 sem)
Setup Next.js 15 + TS strict + Tailwind + shadcn + lint/format. DB Neon + Drizzle + premières tables (products, users, orders). Auth.js v5 + magic links + 1 page protégée test. next-intl + URLs locales + 1 page traduite test. Vercel deploy + variables env + GitHub Actions.

### Phase 1 — E-commerce de base (3-4 sem)
Catalogue produits unitaires + page liste + page détail (sans 3D encore). Admin : CRUD produits + traductions. Panier (DB + Server Actions). Checkout Stripe + webhooks + emails confirmation. Calcul livraison. Espace compte minimal : commandes + adresses.

### Phase 2 — Coffrets, abonnement, B2B (3-4 sem)
Coffrets pré-composés + interface composition admin. Abonnement (Stripe Subscriptions + job mensuel). B2B (formulaire devis + admin + payment links). Cartes cadeaux complet.

### Phase 3 — 3D & animations (4-6 sem)
Setup R3F + Drei. Génération/import biscuits via Meshy + Blender scripts. Configurateur 3D (Rapier). Viewer 3D sur fiches produit. Hero 3D + ScrollTrigger. Touches 3D ambiantes + GSAP/Lenis/Framer.

### Phase 4 — Fidélisation, contenu, polish (3-4 sem)
Programme fidélité. Codes promo. Avis clients. Wishlist. Notifications in-app. Blog (admin + pages + MDX). Cross-sell.

### Phase 5 — Lancement (2-3 sem)
Conformité finale (CGV, RGPD, audit accessibilité). Lots/DLC + audit logs en prod. Tests E2E complets. Perf finale (budgets). SEO complet (sitemap, hreflang, JSON-LD, OG). Beta privée → corrections. Soft launch → hard launch.

### Post-lancement (itérations)
Embedded Checkout. Hero 3D V2 plus ambitieux. App mobile si demande. Migration assets payants si CA le permet.

---

## 11. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Modèles 3D générés IA inutilisables (qualité) | Moyenne | Élevé | Tester Meshy/Tripo dès Phase 3 début ; fallback procédural Three.js + low-poly Quaternius ; alternative ultime : modeler nous-mêmes les biscuits via primitives simples + textures |
| Perf 3D inacceptable sur mobile | Moyenne | Élevé | Fallbacks définis dès Phase 3, monitoring web vitals dès staging, possibilité de désactiver 3D sur certains breakpoints |
| Conformité belge incomplète | Faible | Élevé | Phase 5 dédiée + relecture juridique avant lancement (mention requise : médiateur conso) |
| Traduction NL/DE/EN approximative | Moyenne | Moyen | DeepL pour brouillons + relecture humaine recommandée par locuteur natif avant publication V1 |
| Charge dev solo trop lourde | Moyenne | Moyen | Phases découpées explicitement, possibilité de reporter Phase 4 (fidélisation) post-lancement si calendrier serré |
| Coût Vercel/Neon dépassé après lancement | Faible | Faible | Free tiers couvrent < 1000 commandes/mois ; monitoring usage avant upgrade payant |
| Faillite Stripe / changement de tarification | Faible | Élevé | Architecture abstraite (lib/stripe/ encapsulée) facilite la migration ; documenter les hooks Stripe pour pouvoir les retoucher |
| Demande de configurateur 3D pour gravure B2B en V1 | Moyenne | Moyen | B2B en V1 reste devis manuel ; configurateur gravure 3D = V2 |

---

## 12. Décisions ouvertes / à confirmer

Aucune au stade du spec — toutes les décisions structurantes ont été tranchées en brainstorming. Les détails fins (textes exacts des CGV, choix précis des modèles Meshy à utiliser, design exact des emails) seront résolus dans la phase d'implémentation correspondante.

---

## 13. Hors scope V1 (explicite)

- Application mobile native
- PWA installable (peut être ajoutée plus tard sans refonte)
- Push notifications navigateur
- Marketplace multi-vendeurs
- Programme parrainage
- Live chat / chatbot
- Réalité augmentée (AR Quick Look biscuits)
- Vente hors Belgique
- Configurateur 3D pour gravure B2B (devis manuel suffit en V1)
- PayPal
- Mode dark
- API publique pour partenaires

---

**Fin du document.**

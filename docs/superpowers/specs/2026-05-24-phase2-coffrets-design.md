# Phase 2 — Sous-projet « Coffrets » — Design

**Date** : 2026-05-24
**Périmètre** : premier des 4 sous-projets de Phase 2 (les 3 autres — abonnement, B2B, cartes cadeaux — auront chacun leur propre spec).
**Estimation** : ~1 semaine de dev.

---

## 1. Vision

Permettre aux clients d'acheter des **coffrets cadeaux thématiques pré-composés** (4-6 thématiques en V1, 1 taille fixe par thématique), assemblés à la commande à partir du stock de biscuits unitaires existant. Le coffret est positionné comme un **cadeau prêt-à-offrir** avec personnalisation légère (message + emballage premium optionnel) et un prix attractif (somme des biscuits − remise).

**Hors scope V1 (reportés à des phases ultérieures)**
- Configurateur 3D / composition libre par le client → Phase 3
- Coffrets avec choix de taille à l'achat (1 produit = 1 taille fixe en V1)
- Variantes coffret (ex : « Découverte sans gluten ») — créer un coffret distinct si besoin
- Réservation stock au panier (le check reste au checkout, pattern Phase 1)
- Bundle dynamique « biscuit + biscuit » non nommé

---

## 2. Décisions structurantes validées

| # | Décision | Choix |
|---|---|---|
| D1 | Niveau personnalisation client | Pré-composés seulement (pas de compo libre en V1) |
| D2 | Matrice taille × thématique | 1 taille fixe par thématique (4-6 produits coffret au total) |
| D3 | Calcul prix | Auto-calculé : `somme(biscuits × qté) − discount%`, discount défini par l'admin par coffret |
| D4 | Stock | Dérivé des biscuits inclus, pas de stock coffret propre (assembly à la commande) |
| D5 | Personnalisation achat | Message cadeau optionnel (textarea 200 chars) + choix emballage standard/premium (+2,50 €) |
| D6 | Photos | Hybride : photo dédiée par coffret (uploadée admin via Blob) + mosaïque des biscuits inclus en section « Contenu » |
| D7 | Affichage public | Page dédiée `/coffrets` (catalogue + détail) **ET** apparition dans le listing `/biscuits` avec badge « Coffret » et canonical URL → `/coffrets/[slug]` |
| D8 | Layout détail | Validé via mockup : photo gauche, infos + breakdown prix + gift + add-to-cart à droite, section contenu en dessous |

---

## 3. Data model

### 3.1 Nouvelle table : `coffret_contents`

Relation M2M biscuit ↔ coffret avec quantités. Déjà annoncée dans le spec global ligne 246.

```ts
// lib/db/schemas/coffret_contents.ts
import { pgTable, text, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./products";

export const coffretContents = pgTable(
  "coffret_contents",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    coffretId: text("coffret_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    biscuitId: text("biscuit_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
  },
  (t) => ({
    uniqueCoffretBiscuit: uniqueIndex("uniq_coffret_biscuit").on(t.coffretId, t.biscuitId),
  }),
);
```

**SQL CHECK supplémentaire** (hand-written migration) :
```sql
ALTER TABLE coffret_contents
  ADD CONSTRAINT coffret_quantity_positive CHECK (quantity > 0);
```

**Pourquoi `onDelete: restrict` côté biscuit** : empêche l'admin de supprimer un biscuit utilisé dans un coffret actif — protection métier.

### 3.2 Extension de `products`

```sql
ALTER TABLE products
  ADD COLUMN discount_percent INTEGER
  CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 99));
```

- `NULL` pour les biscuits (champ ignoré côté logique)
- `0-99` pour les coffrets (15 = remise 15% vs somme des biscuits)
- `base_price_cents` reste tel quel : utilisé pour biscuits, **ignoré pour coffrets** (prix calculé live)

### 3.3 Structure `order_items.metadata` pour coffrets

Champ jsonb existant Phase 1. Pour un coffret, on stocke un **snapshot complet** :

```json
{
  "type": "coffret",
  "giftMessage": "Joyeux anniversaire Mamie !",
  "packagingTier": "premium",
  "snapshot": {
    "discountPercent": 15,
    "biscuits": [
      { "biscuitId": "uuid", "name": "Spéculoos artisanal", "quantity": 2, "unitPriceCents": 690 },
      { "biscuitId": "uuid", "name": "Cookies pépites choco", "quantity": 2, "unitPriceCents": 990 },
      { "biscuitId": "uuid", "name": "Sablé pur beurre", "quantity": 2, "unitPriceCents": 590 }
    ]
  }
}
```

**Pourquoi le snapshot** : traçabilité historique. Si un biscuit est modifié/supprimé ou si le coffret change de compo plus tard, on garde la photo exacte de ce qui a été vendu (factures, SAV, comptabilité). Pattern déjà utilisé Phase 1 pour les biscuits unitaires.

### 3.4 Emballage premium

Pas un produit DB, juste une **constante** :

```ts
// lib/coffret/constants.ts
export const PREMIUM_PACKAGING_SURCHARGE_CENTS = 250; // 2,50 €
```

- Tier stocké dans `metadata.packagingTier` (`"standard"` ou `"premium"`)
- Surcharge ajoutée à `unit_price_cents` de la ligne `order_items` (coffret + 250 cents si premium)
- Sur Stripe Checkout : **une seule ligne par coffret** avec son prix total (packaging inclus). Le tier reste visible dans l'admin order detail UI et dans l'email de fulfillment (badge « PREMIUM »).
- Choix d'implémentation : 2 coffrets avec packaging différents = 2 lignes `order_items` distinctes (metadata diffère)

### 3.5 Migration et seed

- Fichier : `drizzle/0004_coffrets.sql` (hand-written, comme Phase 1)
- Contenu : `ALTER products`, `CREATE TABLE coffret_contents`, CHECK constraints, indexes
- Snapshot Drizzle : `drizzle/meta/0004_snapshot.json` régénéré
- **Seed initial** : 4 coffrets thématiques avec photos Unsplash + compositions :
  - « Découverte 6 » : 2 spéculoos + 2 cookies + 2 sablés — discount 15%
  - « Gourmand 12 » : 4 cookies + 4 macarons + 4 florentins — discount 20%
  - « Chocolat 12 » : 6 sablés choco + 4 cookies + 2 florentins — discount 18%
  - « Sans Gluten 6 » : 4 spéculoos SG + 2 macarons — discount 12%

### 3.6 Pourquoi pas de table `coffrets` séparée

Le spec global a prévu `coffret_contents` mais **pas** une table extension `coffrets`. On garde le pattern « un seul `products` avec discriminant `type` » de Phase 1. Plus simple, moins de JOIN, pas de duplication translations. Le seul attribut spécifique au type coffret = `discount_percent` (nullable).

---

## 4. Routes & pages

### 4.1 Public

| Route | Fichier | Description |
|---|---|---|
| `/[locale]/coffrets` | `app/[locale]/(shop)/coffrets/page.tsx` | Listing 4-6 coffrets, grid 2-3 colonnes |
| `/[locale]/coffrets/[slug]` | `app/[locale]/(shop)/coffrets/[slug]/page.tsx` | Détail (layout mockup validé section 8) |
| `/[locale]/biscuits` | _modifié_ | Inclut coffrets avec badge. Filtre `?type=coffret` ajouté pour navigation |

**SEO** : `<link rel="canonical" href="/coffrets/[slug]">` posée sur les deux URLs (la canonique aussi dans `/biscuits`) pour éviter le duplicate content.

### 4.2 Admin

| Route | Description |
|---|---|
| `/admin/coffrets` | Liste table + CTA « Nouveau coffret » |
| `/admin/coffrets/nouveau` | Form création (réutilise patterns Phase 1) |
| `/admin/coffrets/[id]` | Form édition |

**Form admin** (basé sur `/admin/produits/[id]`) :
- Champs produit standard (SKU, type=coffret forcé, weightGrams, isActive, isFeatured)
- Section « Composition » : multi-select des biscuits actifs + qté par biscuit + sous-total live
- Champ `discount_percent` (slider 0-50%, valeur défaut 15%)
- **Preview prix live** affichée à côté : « Somme biscuits 45,40 € − 15% = 38,59 € »
- Traductions FR/NL/EN/DE (même contrainte stricte que biscuits Phase 1)
- Upload Blob (photo principale + secondaire)

### 4.3 Navigation existante

Pas de changement header/footer/mobile nav. L'item « Coffrets » du header pointe déjà vers `/coffrets` (actuellement `ComingSoonPage` à remplacer).

---

## 5. Pricing & stock logic

### 5.1 Calcul prix coffret (live, jamais snapshot)

```ts
// lib/coffret/pricing.ts
export async function computeCoffretPrice(coffretId: string): Promise<CoffretPrice> {
  // 1. Fetch coffret_contents JOIN products (biscuits) JOIN product_translations (locale courante)
  // 2. subtotal = sum(biscuit.basePriceCents × quantity)
  // 3. discount = ceil(subtotal × coffret.discountPercent / 100)
  // 4. total = subtotal − discount
  // Retourne breakdown détaillé pour affichage
}

type CoffretPrice = {
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  totalCents: number;
  breakdown: Array<{
    biscuitId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineCents: number;
  }>;
};
```

**Appelé dans** :
- Page détail coffret (rendu SSR)
- Page liste coffrets (boucle)
- Server action `addToCart` (validation server-side, jamais confiance dans le prix envoyé par le client)
- Webhook Stripe (vérif anti-tampering — comparer le total Stripe avec le total recalculé)

**Arrondi** : ceil au cent supérieur pour le discount (le client paye un cent de plus = négligeable, on évite que le total finisse à 19,89999...).

### 5.2 Vérification disponibilité

```ts
// lib/coffret/availability.ts
export async function isCoffretAvailable(
  coffretId: string,
  requestedQty = 1,
): Promise<CoffretAvailability> {
  // Une seule requête SQL :
  // SELECT min(floor(b.stock_quantity / cc.quantity)) AS max_orderable
  // FROM coffret_contents cc
  // JOIN products b ON b.id = cc.biscuit_id
  // WHERE cc.coffret_id = $1 AND b.is_active = true
}

type CoffretAvailability =
  | { available: true; maxOrderable: number }
  | { available: false; blockingBiscuit: { id: string; name: string; needed: number; inStock: number } };
```

Affichage public :
- Si dispo : bouton « Ajouter au panier » + (optionnel) « Plus que X en stock » si maxOrderable ≤ 5
- Si rupture : badge « Temporairement indisponible » + bouton désactivé + tooltip indiquant quel biscuit manque (admin only ? À discuter en plan)
- Admin peut aussi désactiver entièrement via `isActive=false` (le coffret n'apparaît plus du tout)

### 5.3 Décrémentation stock en cascade (webhook Stripe)

Dans `lib/webhooks/stripe.ts` (existant Phase 1), pour chaque `order_item` de type coffret :
```ts
for (const orderItem of coffretItems) {
  for (const biscuit of orderItem.metadata.snapshot.biscuits) {
    await tx.update(products)
      .set({ stockQuantity: sql`stock_quantity - ${biscuit.quantity * orderItem.quantity}` })
      .where(eq(products.id, biscuit.biscuitId));
  }
}
```

- Wrapped dans la même transaction que le reste du webhook (atomicité totale)
- Hérite de l'idempotence existante via `stripe_events` table
- Si un biscuit passe à 0 → coffret deviendra unavailable au prochain `isCoffretAvailable` (auto-géré)

### 5.4 Anti-tampering Stripe

Au moment de créer la Stripe Checkout Session (Phase 1 pattern), pour les coffrets :
- On envoie le **prix calculé serveur** comme `line_item.price_data.unit_amount` (jamais le prix du client)
- Si premium packaging activé : ligne supplémentaire avec `unit_amount = PREMIUM_PACKAGING_SURCHARGE_CENTS`
- Le webhook compare le `amount_total` Stripe au total recalculé serveur — log warning si divergence (devrait être impossible mais ceinture+bretelles)

---

## 6. Components & UI patterns

### 6.1 Nouveaux composants

| Composant | Rôle |
|---|---|
| `components/shop/CoffretCard.tsx` | Card listing `/coffrets` (photo, titre, prix calculé, badge thématique) |
| `components/shop/CoffretBreakdown.tsx` | Bloc breakdown prix (mockup validé) |
| `components/shop/GiftMessageInput.tsx` | Textarea 200 chars + compteur |
| `components/shop/PackagingTierSelector.tsx` | Radio 2 options (standard/premium +2,50 €) |
| `components/admin/CoffretCompositionEditor.tsx` | Multi-select biscuits + qté + sous-total live |
| `components/admin/CoffretPricePreview.tsx` | Affiche « somme − discount = total » en temps réel |

### 6.2 Composants réutilisés sans modif

- `ProductImages.tsx` — supporte déjà plusieurs photos
- `ImageUploader.tsx` — upload Blob (admin)
- `RelatedProducts.tsx` — adapté pour afficher d'autres coffrets si type=coffret

### 6.3 Composants étendus

- `AddToCartButton.tsx` — props optionnels `giftMessage` et `packagingTier`
- `CartItemRow.tsx` — affiche message cadeau (icône ✉️) + badge « Premium » si applicable
- `lib/queries/catalog.ts` — ajout `listCoffrets()`, `getCoffretBySlug()`, modif `listProducts()` pour inclure coffrets
- `lib/actions/cart.actions.ts` — `addToCart` accepte `metadata = { giftMessage, packagingTier }`
- `lib/queries/cart.ts` — `getCart` calcule prix mixte (biscuits + coffrets + surcharges packaging)
- `lib/actions/admin/products.actions.ts` — `createProduct`/`updateProduct` gèrent le champ `coffretContents` quand type=coffret

---

## 7. Edge cases & error handling

| Cas | Comportement |
|---|---|
| Biscuit supprimé alors qu'utilisé dans un coffret | Bloqué par FK `restrict`. Admin doit d'abord vider la compo ou désactiver le coffret. Message d'erreur explicite. |
| Biscuit `isActive=false` | Coffret reste actif en DB mais `isCoffretAvailable` retourne `false`. Affichage public = indisponible. |
| Stock biscuit passe à 0 entre add-to-cart et checkout | Detected au checkout via `isCoffretAvailable(qty)`. Erreur claire + lien pour retirer du panier. |
| Admin crée coffret sans biscuit (compo vide) | Validation Zod server-side : `min(1)` biscuit, `min(1)` quantité par biscuit. |
| Admin met discount à 100% (gratuit) | Limité par DB CHECK (0-99). UI propose slider max 50% par défaut. |
| Message cadeau > 200 chars | `maxLength` HTML côté UI + validation Zod 200 server-side. |
| Caractères spéciaux dans message | Stockés tels quels en DB. Échappement HTML à l'affichage admin (React le fait nativement). Pas de markdown. |
| Premium packaging sans message cadeau | Autorisé — un client peut vouloir un bel emballage pour lui-même. |
| Panier mixte (biscuits unitaires + coffrets) | Supporté. `getCart` calcule total mixte correctement. |
| Webhook Stripe en doublon | Idempotent via `stripe_events` table (Phase 1). Décrémentation cascade hérite de cette protection. |
| Coffret avec slug identique à un biscuit | Bloqué par contrainte `uniq_locale_slug` sur `product_translations` (Phase 1). |
| Coffret marqué `isFeatured=true` | Apparaît dans la home « Best-sellers » comme un produit normal (pas de différenciation V1). |

---

## 8. Layout détail validé (mockup)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌──────────────────┐    COFFRET — 6 biscuits                 │
│   │                  │    Découverte                            │
│   │                  │    [description courte]                  │
│   │    Photo boîte   │                                          │
│   │                  │    ┌─────────────────────────┐           │
│   │                  │    │ Breakdown détaillé       │           │
│   │                  │    │ Spéculoos ×2   13,80 €  │           │
│   └──────────────────┘    │ Cookies ×2     19,80 €  │           │
│                            │ Sablé ×2       11,80 €  │           │
│                            │ ────────────────────    │           │
│                            │ Sous-total    45,40 €   │           │
│                            │ Remise -15%   -6,81 €   │           │
│                            │ ────────────────────    │           │
│                            │ Total         38,59 €   │           │
│                            │ TVA 6% incluse          │           │
│                            └─────────────────────────┘           │
│                                                                 │
│                            ┌─────────────────────────┐           │
│                            │ ✉️ Message cadeau (opt) │           │
│                            │ [textarea]              │           │
│                            └─────────────────────────┘           │
│                                                                 │
│                            ┌─────────────────────────┐           │
│                            │ 📦 Emballage            │           │
│                            │ ( ) Standard  (•) Prem  │           │
│                            └─────────────────────────┘           │
│                                                                 │
│                            [ Ajouter au panier 38,59 € ]        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ CE COFFRET CONTIENT                                             │
│ 6 biscuits sélectionnés                                         │
│ ┌────────┐ ┌────────┐ ┌────────┐                                │
│ │ photo  │ │ photo  │ │ photo  │                                │
│ │ Spec   │ │ Cookies│ │ Sablé  │                                │
│ │ ×2     │ │ ×2     │ │ ×2     │                                │
│ └────────┘ └────────┘ └────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Tests

| Type | Cible | Outil |
|---|---|---|
| Unit | `computeCoffretPrice` — calcul correct avec qty, discount, arrondi cents | Vitest |
| Unit | `isCoffretAvailable` — cas dispo, rupture sur 1+ biscuit, biscuit `isActive=false` | Vitest |
| Integration | Création coffret admin : insert products + coffret_contents en transaction | Vitest + Neon test DB |
| Integration | `addToCart(coffret, metadata)` : insert cart_item avec metadata correct | Vitest + Neon test DB |
| Integration | Webhook Stripe : décrémentation cascade stocks biscuits transactionnelle | Vitest + Neon test DB |
| E2E | Guest : home → /coffrets → fiche → add to cart avec message + premium → checkout (test mode Stripe) | Playwright |

**Couverture cible** : ≥ 80% sur `lib/coffret/*`.

---

## 10. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Confusion utilisateur entre coffret et biscuit (les deux dans `/biscuits`) | Moyenne | Faible | Badge visuel « Coffret » fort + lien canonical → `/coffrets/[slug]` pour SEO |
| Discount mal configuré → coffret plus cher que somme | Faible | Moyen | Validation UI admin + warning visuel si `discount_percent = 0` |
| Stock biscuit décrémenté 2× (race condition concurrent orders) | Faible | Moyen | Transaction PG sérializable côté webhook + idempotence stripe_events. Surveillance via logs. |
| Premium packaging non livré (oubli operationel) | Moyenne | Moyen | Affichage flag « PREMIUM » visible dans `/admin/commandes/[id]` + dans l'email fulfillment admin |
| Mockup pas adapté au mobile | Moyenne | Faible | Layout responsive : breakdown empilé sous photo en mobile, sections en pile verticale |
| FK restrict empêche admin de bouger un biscuit | Moyenne | Faible | Message d'erreur explicite indiquant quel coffret bloque + lien direct |

---

## 11. Décisions ouvertes / à confirmer pendant le plan

- **Slug auto** : générer le slug coffret depuis le `name` français comme pour les biscuits, OU laisser l'admin le saisir manuellement ? (Recommandation : auto avec override possible, pattern Phase 1)
- **Tooltip admin only sur indispo** : exposer le biscuit bloquant aux clients (« indisponible car rupture sur Spéculoos artisanal ») ou rester générique côté public ?
- **Cart UX edit** : l'utilisateur peut-il modifier le message cadeau depuis `/panier` ou seulement depuis la fiche produit ? (Recommandation : édition possible aussi depuis le panier, +0,5 jour)
- **Email confirmation** : adapter le template `OrderConfirmation.tsx` (Phase 1) pour afficher coffrets différemment (avec compo) ou identique aux biscuits ?

Ces points seront tranchés lors de la rédaction du plan d'implémentation.

---

## 12. Hors scope explicite V1 Coffrets (rappel)

- Configurateur 3D / compose libre par client (Phase 3 prévu)
- Variantes (taille au choix sur un même produit)
- Wishlist / favoris (Phase 4 Fidélisation)
- Avis clients sur coffrets (Phase 4 Fidélisation)
- Recommandations cross-sell « biscuit acheté → suggérer coffret thématique » (Phase 4)
- Cartes cadeaux applicables aux coffrets (Phase 2 sous-projet « Cartes cadeaux »)
- Subscriptions coffret (Phase 2 sous-projet « Abonnement »)

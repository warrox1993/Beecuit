# Phase 2 — Sous-projet « Cartes cadeaux » — Design

**Date** : 2026-05-24
**Périmètre** : 2/4 sous-projets de Phase 2 (après Coffrets, avant Abonnement et B2B).
**Estimation** : ~3-5 jours.

---

## 1. Vision

Permettre l'achat de **cartes cadeaux numériques** (5 montants fixes) à offrir par email. Le destinataire reçoit un email à la `delivery_at` avec un code cryptographique qu'il peut utiliser au checkout sur des biscuits et coffrets (utilisation partielle possible, expiration 12 mois).

**Hors scope V1**
- PDF imprimable, envoi physique
- Montants custom
- Cumul avec code promo (Phase 4)
- Utilisable sur abonnement (Phase 2 sous-projet Abonnement)
- Multiple gift cards par order

---

## 2. Décisions structurantes validées

| # | Décision | Choix |
|---|---|---|
| GC1 | Format | Numérique email-only |
| GC2 | Montants | 5 fixes : 15 / 25 / 50 / 75 / 100 € |
| GC3 | Code | Maison cryptographique format `BC-XXXX-XXXX-XXXX` (12 hex chars groupés) |
| GC4 | Envoi | Programmé à `delivery_at`, cron quotidien Vercel 09:00 UTC |
| GC5 | Expiration | 12 mois après `delivery_at` |
| GC6 | Utilisation | Partielle, 1 carte par order |
| GC7 | Scope usage | Biscuits + coffrets (pas abonnement) |
| GC8 | Cumul | Pas de cumul avec promo en V1 |
| GC9 | TVA | Réduit le total payé, ne réduit pas la TVA (spec ligne 416) |

---

## 3. Data model

### 3.1 Nouvelle table `gift_cards`
```ts
// lib/db/schemas/gift_cards.ts
export const giftCards = pgTable("gift_cards", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  initialAmountCents: integer("initial_amount_cents").notNull(),
  remainingAmountCents: integer("remaining_amount_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  purchaserUserId: text("purchaser_user_id").references(() => users.id, { onDelete: "set null" }),
  purchaserEmail: text("purchaser_email").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  message: text("message"),
  deliveryAt: timestamp("delivery_at", { mode: "date" }).notNull(),
  deliveredAt: timestamp("delivered_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  purchaseOrderId: text("purchase_order_id").references(() => orders.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
```

### 3.2 Nouvelle table `gift_card_redemptions`
```ts
export const giftCardRedemptions = pgTable("gift_card_redemptions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: text("gift_card_id").notNull().references(() => giftCards.id, { onDelete: "restrict" }),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  amountCents: integer("amount_cents").notNull(),
  stripeCouponId: text("stripe_coupon_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
```

### 3.3 Extension `products` enum
```sql
ALTER TYPE product_type ADD VALUE 'gift_card';
```
5 produits virtuels seedés : `GIFT-015` (basePriceCents 1500), `GIFT-025` (2500), `GIFT-050` (5000), `GIFT-075` (7500), `GIFT-100` (10000). Tous avec `weight_grams = 0`, `stock_quantity = 999999`, traductions FR/NL/EN/DE génériques. Filtrés OUT des listings `/biscuits` et `/coffrets` via clause `type IN ('biscuit', 'coffret')`.

### 3.4 Extension `cart_items.metadata`
Nouveau variant :
```ts
{
  type: "gift_card",
  recipientEmail: string,
  recipientName: string | null,
  message: string | null,
  deliveryAt: string,  // ISO timestamp
}
```

### 3.5 Extension `orders`
```sql
ALTER TABLE orders ADD COLUMN gift_card_redemption_id text REFERENCES gift_card_redemptions(id) ON DELETE SET NULL;
```
Nullable. Permet de tracer quelle redemption a réduit le total (utile pour refunds futurs).

### 3.6 Migration et seed
- `drizzle/0005_gift_cards.sql` (hand-written)
- `scripts/seed-gift-card-products.mjs` : crée les 5 SKUs `GIFT-*`

---

## 4. Routes & pages

### 4.1 Public
| Route | Fichier | Description |
|---|---|---|
| `/[locale]/cartes-cadeaux` | `app/[locale]/(shop)/cartes-cadeaux/page.tsx` | Page achat : 5 montants en cards + form (email destinataire, nom, message, date envoi) → add to cart |
| `/[locale]/checkout` | _modifié_ | Champ « Code carte cadeau » avec apply/remove + total recalculé live |
| `/[locale]/compte/cartes-cadeaux` | `app/[locale]/(account)/compte/cartes-cadeaux/page.tsx` | Cartes achetées (statut envoyé) + cartes reçues utilisables (solde + bouton reveal code) |

### 4.2 Admin
| Route | Description |
|---|---|
| `/admin/cartes-cadeaux` | Liste + recherche code/email + filtre statut + désactiver |

### 4.3 Cron + API
| Route | Description |
|---|---|
| `/api/cron/gift-cards-deliver` | Cron quotidien 09:00 UTC. Vercel headers `Authorization: Bearer ${CRON_SECRET}`. Idempotent. |

### 4.4 vercel.json
```json
{
  "crons": [
    { "path": "/api/cron/gift-cards-deliver", "schedule": "0 9 * * *" }
  ]
}
```

### 4.5 Navigation
- Footer : ajout link « Cartes cadeaux »
- Admin sidebar : entry « Cartes cadeaux » après Coffrets

---

## 5. Génération de code

```ts
// lib/gift-cards/code.ts
import { randomBytes } from "node:crypto";

export function generateGiftCardCode(): string {
  // 6 random bytes = 12 hex chars, formatted BC-XXXX-XXXX-XXXX
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `BC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}
```

Insertion DB protégée par `unique(code)`. Retry max 3× en cas de collision (extrêmement improbable : 16⁻¹² ≈ 3.5e-15 par tentative).

---

## 6. Redemption logic au checkout

### 6.1 Server action `applyGiftCard`
```ts
// lib/actions/gift-cards.actions.ts
export async function validateGiftCardCode(code: string): Promise<{
  valid: true; cardId: string; amountAvailableCents: number;
} | { valid: false; error: string }> {
  // SELECT gift_cards WHERE code = ? AND is_active = true
  // Check delivered_at IS NOT NULL (sinon "pas encore activée")
  // Check expires_at > NOW() (sinon "expirée")
  // Check remaining_amount_cents > 0 (sinon "épuisée")
}
```

### 6.2 Au moment du checkout (createCheckoutSession)
- L'input checkout accepte un nouveau champ optionnel `giftCardCode`
- Si fourni : valider (server-side), calculer `deductionCents = min(remainingAmountCents, orderSubtotalCents)`
- Stripe Coupon créé inline : `stripe.coupons.create({ amount_off: deductionCents, currency: 'eur', duration: 'once', name: 'Carte cadeau BeeCuit' })`
- Session Stripe créée avec `discounts: [{ coupon: coupon.id }]`
- L'order draft stocke (en attendant le webhook) : `metadata.giftCardId`, `metadata.giftCardDeductionCents`, `metadata.stripeCouponId`

### 6.3 Webhook `checkout.session.completed`
- Si l'order avait un gift card pending : créer `gift_card_redemptions` row + décrémenter `gift_cards.remaining_amount_cents` + set `orders.gift_card_redemption_id` + clear metadata fields
- Tout dans la même transaction que les autres updates webhook (idempotent via stripe_events)

### 6.4 TVA et invoice
La TVA est calculée par Stripe sur le sous-total des line_items (tax_behavior=inclusive). Le coupon est appliqué APRÈS, donc la TVA reste inchangée. Conforme à GC9 et spec ligne 416.

---

## 7. Cron + email delivery

### 7.1 Route `/api/cron/gift-cards-deliver`
```ts
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  // SELECT gift_cards WHERE delivery_at <= NOW() AND delivered_at IS NULL AND is_active
  // For each: sendEmail({ to: recipientEmail, template: GiftCardDelivery, props: ... })
  //           UPDATE gift_cards SET delivered_at = NOW() WHERE id = ?
  // Log count + errors
}
```

### 7.2 Email template `GiftCardDelivery.tsx`
React Email. Affiche :
- Nom du destinataire si présent, sinon "Hello"
- Nom de l'acheteur ("Jean t'a offert...")
- Montant + format BeeCuit branding
- Code (gros, copiable)
- Message personnel (italic block)
- Bouton "Utiliser ma carte" → lien `/cartes-cadeaux/utiliser?code=BC-...` (page qui pré-remplit le code au checkout)
- Date d'expiration
- FR seulement en V1 (pattern Phase 1)

### 7.3 Idempotence
La condition `delivered_at IS NULL` garantit qu'une carte n'est envoyée qu'une fois. Si l'email Resend fail (network, etc.), `delivered_at` reste NULL et la prochaine exécution réessaiera. Pas de retry exponentiel V1.

### 7.4 Env var nouvelle
- `CRON_SECRET` : généré aléatoirement, ajouté à `.env.local` + Vercel (3 envs)

---

## 8. Components & UI patterns

### Nouveaux
| Composant | Rôle |
|---|---|
| `components/shop/GiftCardAmountPicker.tsx` | 5 cards radio des montants |
| `components/shop/GiftCardForm.tsx` | Form recipient/message/date pour add-to-cart |
| `components/shop/GiftCardCodeInput.tsx` | Input + apply/remove au checkout, avec feedback `validateGiftCardCode` |
| `components/shop/GiftCardReveal.tsx` | Code masqué `BC-****-****-****` + bouton « Reveal » + copy-to-clipboard |
| `components/admin/GiftCardTable.tsx` | Table admin avec status badge + actions |

### Étendus
| Composant | Modif |
|---|---|
| `components/shop/CheckoutForm.tsx` | Slot pour `GiftCardCodeInput` + recalcul du total affiché |
| `lib/email/templates/` | Ajout `GiftCardDelivery.tsx` |

---

## 9. Edge cases & error handling

| Cas | Comportement |
|---|---|
| Code invalide / inexistant | Erreur claire : « Code inconnu » |
| Code valide mais `delivered_at IS NULL` (envoi futur) | Erreur : « Carte pas encore activée (envoi prévu le DD/MM) » |
| Code expiré (`expires_at < NOW()`) | Erreur : « Carte expirée le DD/MM » |
| Solde insuffisant (`remaining = 0`) | Erreur : « Carte déjà utilisée intégralement » |
| Solde > total commande | Déduction partielle, solde restant conservé |
| Carte appliquée puis order abandonné | Coupon Stripe créé mais inutilisé. Pas de cleanup V1 (Stripe coupons one-time auto-expirent au checkout) |
| Double redemption simultanée | Optimistic locking : `UPDATE gift_cards SET remaining_amount_cents = X WHERE id = ? AND remaining_amount_cents >= deductionAmount`. Si 0 rows affected, throw |
| Refund order avec carte appliquée | V1 : no auto-restore. Admin restore manuellement via UPDATE direct. À automatiser Phase 4 |
| Carte achetée puis acheteur supprime son compte | `purchaser_user_id` passe à NULL (ON DELETE SET NULL). La carte reste valide |
| Order avec gift card refusé par Stripe (paiement échoué) | Pas de webhook checkout.session.completed → pas de redemption créée → carte intacte |
| Email destinataire invalide / bounce | Resend log l'erreur. Admin voit "non livré" mais delivered_at est SET (on n'est pas Sendgrid). À V2 : retry sur soft bounce |
| Cron loupe une journée (Vercel outage) | Carte simplement envoyée le jour d'après (decay graceful) |
| Acheteur s'envoie la carte à lui-même | Autorisé (cas d'usage : tester, ou s'auto-récompenser) |
| Plusieurs cartes même code (collision) | Bloqué par `unique(code)`, retry up to 3× |

---

## 10. Tests

| Type | Cible | Outil |
|---|---|---|
| Unit | `generateGiftCardCode` produit le bon format, n'a pas de doublons sur 10000 itérations | Vitest |
| Unit | `validateGiftCardCode` : tous les cas d'erreur (inexistant, pas activé, expiré, épuisé) | Vitest avec mocks |
| Integration | `createCheckoutSession` avec giftCardCode applique le Stripe coupon | Vitest + Neon test DB + Stripe mock |
| Integration | Webhook crée `gift_card_redemptions` + décrémente `remaining_amount_cents` | Vitest + Neon test DB |
| Integration | Cron `gift-cards-deliver` envoie l'email + set `delivered_at` (idempotent : 2× run = 1 email) | Vitest + Neon test DB + Resend mock |
| E2E | Guest achète carte 50 € → cron simulé envoie l'email → utilise le code dans une nouvelle commande de 30 € → solde restant 20 € | Playwright (avec triggering manuel du cron route) |

Couverture cible ≥ 80% sur `lib/gift-cards/`.

---

## 11. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Cron ne tourne pas (Vercel hobby limits) | Faible | Élevé | Tester delivery manuellement via fetch + monitoring premier mois |
| Stripe Coupons s'accumulent en DB Stripe | Moyenne | Faible | Coupons `duration: once` auto-cleaned. Pas d'impact perf ni coût |
| Double redemption race condition | Faible | Moyen | Optimistic UPDATE WHERE remaining_amount_cents >= deduction (atomique en PG) |
| Refund order avec gift card → solde perdu | Moyenne | Moyen | Documenter procédure admin manuelle. Automatiser Phase 4 |
| Code généré collision | Très faible | Faible | Retry up to 3× sur unique violation |
| Email bounce non détecté | Moyenne | Faible | `delivered_at` set quoi qu'il arrive. Admin voit pas. V2 : Resend webhook events |

---

## 12. Décisions ouvertes pour le plan

- **Slug auto** des produits virtuels GIFT-* : `carte-cadeau-15-euros`, etc.
- **Reveal du code dans `/compte/cartes-cadeaux`** : masqué par défaut ou shown directement ? (Recommandation : masqué + bouton « Voir », pour éviter screenshots accidentels)
- **`/cartes-cadeaux/utiliser?code=...`** : juste un redirect avec query OU une vraie page qui pré-remplit ? (Recommandation : redirect vers `/checkout?giftCardCode=...` qui le pré-remplit)
- **Locale email destinataire** : utiliser la locale de l'acheteur ? Détecter sur le top-level domain du recipient_email ? (Recommandation : FR uniquement V1)

---

## 13. Hors scope V1 (rappel)

- PDF imprimable
- Envoi postal
- Montants custom
- Cumul avec code promo
- Application sur abonnement
- Multiple cartes par order
- Auto-refund du solde si order refundé
- Notifications Resend webhook events (bounce/complaint)
- Locale dynamique des emails (FR only)
- Reveal protégé par 2FA

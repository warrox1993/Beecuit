# Phase 2 — Sous-projet « Abonnement » — Design

**Date** : 2026-05-24
**Périmètre** : 3/4 sous-projets de Phase 2 (après Coffrets, Cartes cadeaux ; reste B2B).
**Estimation** : ~1.5-2 semaines.

---

## 1. Vision

Permettre aux clients d'**acheter mensuellement une box personnalisée** de biscuits artisanaux BeeCuit. 3 tailles (Mini 6 / Classique 12 / Famille 24) × 3 engagements (sans / 6 mois / 12 mois) = 9 plans. Facturation et expédition synchrones le **1er du mois** pour tous. **Composition personnalisée par client** avant deadline (~25 du mois pour la box du mois suivant) ; fallback algorithmique si pas de composition. **Pause illimitée** + annulation immédiate via UI custom dans `/compte/abonnement`. Stripe Customer Portal pour la gestion CB et factures.

**Hors scope V1**
- Coffrets en abonnement (seulement biscuits unitaires)
- Cartes cadeaux applicables sur subscription
- Skip 1 mois (différent de pause)
- Code promo sur subscription
- Changement de formule en cours d'abonnement
- Renouvellement engagement auto à expiration

---

## 2. Décisions structurantes validées

| # | Décision | Choix |
|---|---|---|
| AB1 | Scope V1 | Production-grade complet |
| AB2 | Formules | 3 tailles : Mini 6 / Classique 12 / Famille 24 |
| AB3 | Engagements | 3 niveaux : sans / 6 mois / 12 mois |
| AB4 | Discount par engagement | Sans 0% · 6 mois −5% · 12 mois −10% |
| AB5 | Contenu mensuel | Personnalisé par client (UI composition) |
| AB6 | Fallback no-composition | Algorithme : best-sellers + 1 nouveauté |
| AB7 | Date cycle | 1er du mois fixe pour tous |
| AB8 | Pause | Illimitée jusqu'à reprise manuelle |
| AB9 | Annulation | Immédiate (côté Stripe : `cancel_at_period_end`) ; engagement = engagement (pas de remboursement) |
| AB10 | Stripe Customer Portal | Activé pour : mise à jour CB, voir factures, historique. PAS pour annuler/pauser (notre UI) |

---

## 3. Pricing matrix (9 Stripe Prices)

| Formule | Sans engagement | 6 mois (−5%) | 12 mois (−10%) |
|---|---|---|---|
| **Mini** (6 biscuits/mois) | 19,90 € | 18,90 € | 17,90 € |
| **Classique** (12 biscuits/mois) | 29,90 € | 28,40 € | 26,90 € |
| **Famille** (24 biscuits/mois) | 49,90 € | 47,40 € | 44,90 € |

Tous prix TTC, TVA 6 % inclusive. Recurring monthly. Prix configurables côté admin via Stripe Dashboard (les Price IDs sont stockés en env vars + DB pour la lookup).

**Stratégie d'engagement** : on stocke `engagement_months` (0/6/12) en metadata Stripe Subscription + colonne DB. **Pas** de Stripe Subscription Schedule (trop complexe). Application UI : pendant la période d'engagement, le bouton "Annuler" prévient le client qu'il continuera à payer jusqu'à fin de l'engagement (Stripe `cancel_at_period_end=true` après date d'expiration de l'engagement).

---

## 4. Data model

### 4.1 Nouvelle table `subscriptions`

```ts
// lib/db/schemas/subscriptions.ts
export const subscriptionFormat = pgEnum("subscription_format", ["mini", "classique", "famille"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",       // signed up, awaiting first billing on 1st of month
  "active",         // billing + shipping ongoing
  "paused",         // user paused
  "cancelled",      // cancelled, but may still ship pending boxes within engagement
  "expired",        // engagement complete or fully ended
  "past_due",       // payment failed, Stripe retrying
]);

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  format: subscriptionFormat("format").notNull(),  // mini/classique/famille
  engagementMonths: integer("engagement_months").notNull(),  // 0 / 6 / 12
  status: subscriptionStatus("status").notNull().default("trialing"),
  startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
  engagementEndsAt: timestamp("engagement_ends_at", { mode: "date" }),  // null if no engagement
  pausedAt: timestamp("paused_at", { mode: "date" }),  // set when user pauses
  cancelledAt: timestamp("cancelled_at", { mode: "date" }),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot").$type<Record<string, unknown>>().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
```

### 4.2 Nouvelle table `subscription_boxes` (historique des box mensuelles)

```ts
export const subscriptionBoxStatus = pgEnum("subscription_box_status", [
  "composing",      // user can still edit until deadline
  "locked",         // deadline passed, composition frozen
  "shipped",        // shipping order created (link to orders table)
  "skipped",        // subscription was paused/cancelled before shipping
]);

export const subscriptionBoxes = pgTable("subscription_boxes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  cycleYearMonth: text("cycle_year_month").notNull(),  // "2026-06" — natural key for the month
  status: subscriptionBoxStatus("status").notNull().default("composing"),
  compositionDeadline: timestamp("composition_deadline", { mode: "date" }).notNull(),
  shippingOrderId: text("shipping_order_id").references(() => orders.id, { onDelete: "set null" }),
  composedBy: text("composed_by"),  // "user" | "fallback" — set when locked
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (t) => ({
  uniqueSubMonth: uniqueIndex("uniq_subscription_box_month").on(t.subscriptionId, t.cycleYearMonth),
}));
```

### 4.3 Nouvelle table `subscription_box_items`

```ts
export const subscriptionBoxItems = pgTable("subscription_box_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  boxId: text("box_id").notNull().references(() => subscriptionBoxes.id, { onDelete: "cascade" }),
  biscuitId: text("biscuit_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
}, (t) => ({
  uniqueBoxBiscuit: uniqueIndex("uniq_box_biscuit").on(t.boxId, t.biscuitId),
}));
```

### 4.4 Migration `0006_subscriptions.sql`

Tables ci-dessus + CHECK quantité positive + CHECK total biscuits = taille formule (Mini=6, Classique=12, Famille=24).

### 4.5 Env vars nouvelles

```
STRIPE_PRICE_MINI_NONE=price_xxx
STRIPE_PRICE_MINI_6M=price_xxx
STRIPE_PRICE_MINI_12M=price_xxx
STRIPE_PRICE_CLASSIQUE_NONE=price_xxx
STRIPE_PRICE_CLASSIQUE_6M=price_xxx
STRIPE_PRICE_CLASSIQUE_12M=price_xxx
STRIPE_PRICE_FAMILLE_NONE=price_xxx
STRIPE_PRICE_FAMILLE_6M=price_xxx
STRIPE_PRICE_FAMILLE_12M=price_xxx
```

Lookup table en code :
```ts
// lib/subscription/pricing.ts
export const SUBSCRIPTION_PRICES = {
  mini: { none: env.STRIPE_PRICE_MINI_NONE, "6m": env.STRIPE_PRICE_MINI_6M, "12m": env.STRIPE_PRICE_MINI_12M },
  classique: { ... },
  famille: { ... },
};
export const FORMAT_SIZES = { mini: 6, classique: 12, famille: 24 } as const;
```

---

## 5. Tunnel souscription

### 5.1 Page `/[locale]/abonnement` (publique)

Pricing table 3×3, CTA "S'abonner" pour chaque combo. Au clic :
1. Si pas auth → redirect `/sign-in?return=/abonnement?format=X&engagement=Y`
2. Si auth → Server action `createSubscriptionCheckout(format, engagement)`

### 5.2 Server action `createSubscriptionCheckout`

```ts
// lib/actions/subscription.actions.ts
export async function createSubscriptionCheckout(format: Format, engagement: Engagement) {
  // Require auth
  const session = await auth();
  if (!session?.user?.id) throw new Error("Auth required");

  // Fetch/create Stripe Customer for this user (cached on first call)
  const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email);

  // Lookup the Stripe Price ID
  const priceId = SUBSCRIPTION_PRICES[format][engagement];

  // Create Stripe Checkout Session in subscription mode
  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      billing_cycle_anchor: nextFirstOfMonth(),  // calé sur 1er du mois prochain
      proration_behavior: "none",                 // pas de prorata sur premier cycle
      metadata: { format, engagement, userId: session.user.id },
    },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/compte/abonnement?welcome=1`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/abonnement`,
  });
  redirect(stripeSession.url!);
}
```

### 5.3 Webhook `customer.subscription.created`

Quand Stripe confirme la souscription, on insère en DB :
- Row dans `subscriptions` avec `status='trialing'` jusqu'au 1er cycle
- engagementEndsAt = startedAt + engagement_months (null si sans engagement)
- Pas de subscription_box créée pour le mois en cours (premier box = mois suivant à partir du 1er)

### 5.4 Webhook `invoice.paid` (chaque cycle)

- Update `subscriptions.status = 'active'`
- Crée une `subscriptions_boxes` row pour le mois en cours (status='shipped' ou 'locked' selon flow)
- Crée une `orders` row liée pour le shipping (le composé de la box est snapshot dans `order_items`)
- Décrémente stock biscuits
- Envoie email de confirmation

---

## 6. Composition mensuelle de la box

### 6.1 Création de la box "next"

Quand un abonné a une subscription active, le système crée automatiquement la subscription_box du mois suivant **dès le début du mois courant** (cron du 1er du mois en plus de la facturation : pour chaque sub active, créer la box pour M+1 en status='composing').

Deadline composition : **25 du mois en cours** (5-6 jours avant le renouvellement du 1er suivant).

### 6.2 UI composition `/compte/abonnement/prochaine-box`

Page client qui montre :
- Header : "Compose ta box de [Juillet 2026]"
- Liste des biscuits disponibles avec quantité actuelle (qty per biscuit, sum constrained to FORMAT_SIZES[format])
- Bouton "Valider ma composition" → status='locked', composedBy='user'
- Bouton "Réinitialiser et laisser BeeCuit choisir" → status='composing', composedBy=null (fallback déclenché au lock)
- Date deadline visible

### 6.3 Algorithme de fallback

Au 25 du mois, cron passe sur les boxes `status='composing'` :
- Identifie les best-sellers (top 50% des ventes du mois passé)
- Pioche format-size biscuits aléatoirement parmi best-sellers + 1 nouveauté (produit créé < 30 jours)
- Insert les `subscription_box_items` + status='locked', composedBy='fallback'

### 6.4 Notifications client

- **Jour 1 du mois** : email "Compose ta box de [Mois prochain]" avec lien vers `/compte/abonnement/prochaine-box`
- **Jour 22 du mois** (3 jours avant deadline) : email rappel "Plus que 3 jours pour composer ta box !"
- **Jour 25 du mois** : pas de rappel public (fallback se déclenche silencieusement)
- **Jour 1 mois suivant** : email "Ta box du mois est en route" (avec composition récap)

---

## 7. Cron flow

### 7.1 Schedule

Vercel cron `/api/cron/subscriptions-tick` quotidien à **06:00 UTC**.

⚠️ Ce cron étant désactivé en dev (cf. `project_cron_reactivate_before_launch`), il faut **2 entries dans `vercel.json`** lors de la réactivation : gift-cards-deliver + subscriptions-tick.

### 7.2 Logique cron

Le cron s'exécute tous les jours, mais ne fait du travail qu'à dates spécifiques :

- **Si jour = 1 du mois** :
  - Lock toutes les `subscription_boxes` du mois courant (status='locked')
  - Pour chaque sub active : créer la `subscription_box` du mois suivant (status='composing', deadline=25)
  - Envoyer l'email "Compose ta box" à tous les abonnés actifs
  - Stripe se charge des factures (billing_cycle_anchor=1er)
  - Le webhook `invoice.paid` créera les commandes shipping

- **Si jour = 22 du mois** :
  - Envoyer rappels "Plus que 3 jours" aux abonnés dont la box `composing` n'a pas encore d'items

- **Si jour = 25 du mois** :
  - Pour chaque box du mois suivant encore en `status='composing'` : exécuter le fallback algorithmique → insert items + status='locked', composedBy='fallback'

- **Tous les jours** : marquer les engagements expirés (`engagementEndsAt < NOW()` → si `status='cancelled'` et engagement expired → status='expired'

### 7.3 Idempotence

- Chaque box a `uniqueSubMonth(subscriptionId, cycleYearMonth)` qui prévient les double-création
- Email send protégé par flag local (table `notifications_sent` ? Ou marqué dans `subscription_boxes` ?). V1 : ajouter `notification_composed_email_sent_at`, `notification_reminder_email_sent_at` sur `subscription_boxes`

---

## 8. Gestion par client (`/compte/abonnement`)

Page principale qui affiche :
- **Status badge** : Trialing / Active / Paused / Cancelled / Expired / Past Due
- **Détails** : formule, engagement, dates clés (engagement ends, next billing)
- **Box du mois suivant** : status (composing/locked/shipped), lien vers composition si composing
- **Actions** :
  - "Pauser mon abonnement" → action `pauseSubscription` → Stripe `subscription.pause_collection.behavior='void'` + DB status='paused'
  - "Reprendre" (si paused) → action `resumeSubscription` → Stripe unpause + DB status='active'
  - "Modifier mon adresse" → form qui update `shippingAddressSnapshot`
  - "Annuler mon abonnement" → action `cancelSubscription` → confirme avec contexte engagement (warning si engagement encore actif), puis Stripe `cancel_at_period_end=true` + DB status='cancelled'
  - "Gérer ma carte / Voir mes factures" → bouton qui crée un Customer Portal session via Stripe et redirige

### 8.1 Pause logic

Stripe `subscription.pause_collection.behavior='void'` :
- Le prochain cycle n'est pas facturé
- L'abonnement reste actif côté Stripe mais ne crée pas d'invoice
- Aucune box n'est créée pour les mois pausés
- Resume = `pause_collection=null` → cycle reprend normalement au prochain 1er du mois

### 8.2 Cancel logic

`stripe.subscriptions.update(id, { cancel_at_period_end: true })` :
- Le client garde l'accès à la box du mois en cours (si déjà payée)
- À l'expiration de l'engagement (ou immédiatement si sans engagement) : pas de renouvellement
- Webhook `customer.subscription.deleted` arrive à expiration → DB status='expired'

---

## 9. Customer Portal Stripe scope

Le Customer Portal Stripe est activé pour :
- ✅ Mise à jour CB (default payment method)
- ✅ Voir factures + télécharger PDF
- ✅ Voir historique paiements

Désactivé / non utilisé pour :
- ❌ Annuler (notre UI custom)
- ❌ Pauser (notre UI custom)
- ❌ Changer adresse (notre UI custom)

Config Stripe : disable `subscription_cancel`, `subscription_pause`, enable `payment_method_update` and `invoice_history`.

---

## 10. Routes & pages

### 10.1 Public
| Route | Description |
|---|---|
| `/[locale]/abonnement` | Pricing table 3×3 + CTA souscription |

### 10.2 Account
| Route | Description |
|---|---|
| `/[locale]/compte/abonnement` | Vue principale (status + actions) |
| `/[locale]/compte/abonnement/prochaine-box` | Composition box du mois suivant |
| `/[locale]/compte/abonnement/historique` | Historique des box passées + commandes liées |

### 10.3 Admin
| Route | Description |
|---|---|
| `/admin/abonnements` | Liste tous abonnements + filtres status + recherche |
| `/admin/abonnements/[id]` | Détail abonnement : composition courante, historique, actions admin (force resume/cancel) |

### 10.4 API
| Route | Description |
|---|---|
| `/api/webhooks/stripe` | Webhook existant — ajouter handlers `customer.subscription.*`, `invoice.paid` |
| `/api/cron/subscriptions-tick` | Cron quotidien (désactivé en dev) |
| `/api/account/portal-session` | Endpoint qui crée une Stripe Customer Portal session pour l'user courant |

### 10.5 Navigation
- Header : item "Abonnement" (déjà présent, désormais sans `comingSoon`)
- Footer : déjà lien `/abonnement`
- Admin sidebar : nouvelle entry "Abonnements"

---

## 11. Edge cases & error handling

| Cas | Comportement |
|---|---|
| Paiement CB échoué | Stripe retry automatique (3×). Webhook `invoice.payment_failed` → status='past_due'. Email client "ta CB a échoué". Si toujours échec après retries Stripe → status='cancelled' |
| User pause juste avant le 1er du mois | Stripe pause_collection prévaut → pas de facture ce mois. Si déjà facturé pile avant pause → la box du mois shippe |
| User cancel pendant son engagement (6/12 mois) | UI montre warning : "Tu continueras à payer jusqu'à [engagementEndsAt]". Cancel = cancel_at_period_end + Stripe arrête le renouvellement à `engagementEndsAt` |
| Adresse modifiée après lock de la box | La box courante shippe à l'ancienne adresse (snapshot). La prochaine box utilise la nouvelle adresse |
| Stock épuisé pour un biscuit choisi par client | Validation à la lock-time : si un biscuit choisi n'a plus de stock, on substitue par algorithm fallback pour ce slot ET on notifie le client par email |
| Customer Portal session créée mais customer Stripe différent | Vérification : la session est créée pour le `stripeCustomerId` lié à l'user authentifié, pas un autre |
| User crée 2 souscriptions simultanées | V1 : autorisé (2 boxes différentes par mois). UI affiche les 2 dans `/compte/abonnement`. Pourrait restreindre à 1 sub/user en V2 |
| Fallback algo : pas assez de stock total | Si la somme des best-sellers + nouveauté ne suffit pas pour remplir la box, on tape dans tous les biscuits disponibles. Si vraiment pas assez : status='skipped' + email admin alert |
| Webhook arrive 2× | Idempotency via `stripe_webhook_events` table (Phase 1 pattern, déjà en place) |
| User reprend pause après plusieurs mois | Resume = next billing au prochain 1er du mois |
| Engagement expire pendant pause | Pause prolonge la durée d'engagement effective. Politique : engagement ends date = date originale (pause ne décale pas). Donc si Marie engagement 6 mois, signs Jan 15, pauses Mar 1 → engagementEndsAt = Jul 15 (inchangé). Si elle resume Jun 1 → elle aura déjà honoré 4 cycles, reste 2 à faire (Jul + ...) avant expiration |

---

## 12. Tests

| Type | Cible | Outil |
|---|---|---|
| Unit | `getOrCreateStripeCustomer` idempotent | Vitest + Stripe mock |
| Unit | `nextFirstOfMonth` retourne le bon timestamp UTC | Vitest |
| Unit | `fallbackBoxComposition` produit une compo de taille correcte avec best-sellers + nouveauté | Vitest + DB mock |
| Integration | Webhook `customer.subscription.created` insère row + computed engagementEndsAt | Vitest + Neon test DB |
| Integration | Webhook `invoice.paid` crée subscription_box + order shipping + décrémente stocks | Vitest + Neon test DB |
| Integration | Cron 1er du mois : crée boxes M+1 pour tous les abonnés actifs (idempotent) | Vitest + Neon test DB |
| Integration | Cron 25 du mois : applique fallback aux boxes encore composing | Vitest + Neon test DB |
| Integration | Pause + resume cycle Stripe correctement | Vitest + Stripe mock |
| E2E | User souscrit Classique 12m → vérifie redirect Stripe → mock le webhook → vérifie status=trialing en DB | Playwright + Stripe test mode |

Couverture cible ≥ 80% sur `lib/subscription/*`.

---

## 13. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Stripe Customer Portal config laisse passer cancel/pause natif | Moyenne | Élevé | Tester la config en test mode + override désactivation explicite |
| Cron tombe en erreur le 1er du mois → pas de nouvelles boxes | Faible | Critique | Logging + monitoring + retry manuel via route POST admin. Vercel Hobby n'a pas de monitoring intégré → mettre un check externe (UptimeRobot sur l'endpoint, ou alert si table `subscription_boxes` cycleYearMonth manque le 2 du mois) |
| Fallback algo pas testable sans données réelles | Élevée | Moyen | Tests unit avec biscuits seedés + fixtures. Monitor le ratio user-composed vs fallback en prod |
| Engagement non-respecté par client (chargeback) | Faible | Faible | Politique CGV claire + Stripe Dispute API. Pas de remboursement automatique |
| Subscription créée mais user ne complète jamais Stripe Checkout | Faible | Faible | Stripe handle (no DB row created until webhook fires) |
| User cancel + resume répété pour exploiter offre intro | Faible | Faible | V1 : autorisé. Si abus repéré, ajouter cooldown ou anti-abuse en V2 |
| Decimal precision sur engagement prorate | Faible | Faible | Pas de prorate (proration_behavior: none), tous montants en cents entiers |
| Vercel cron hobby plan : 2 schedules max | Connue | Bloquant si > 2 | Actuellement : gift-cards-deliver + subscriptions-tick = 2/2. Aucun cron supplémentaire possible sans upgrade Vercel Pro |

---

## 14. Décisions ouvertes pour le plan

- **Position du prix dans l'UI** : afficher le prix mensuel OU mensuel + total engagement (« 28,40 €/mois × 6 = 170,40 € ») ? (Recommandation : mensuel seul, total au survol)
- **Format des Price IDs côté code** : object lookup OU function `getSubscriptionPrice(format, engagement)` ? (Recommandation : object pour simplicité)
- **`subscription_boxes` créée avant la souscription validée** : éviter (créer uniquement après `invoice.paid`)
- **Comportement si l'utilisateur a une commande non-livrée et veut s'abonner** : autorisé (les deux flows sont indépendants)
- **Email destinataire si l'user supprime son compte mais a une sub active** : la sub continue (Stripe subscriptions ne dépendent pas de l'app account). UI affiche un état "orphan" pour ces subs

---

## 15. Hors scope V1 (rappel)

- Coffrets en abonnement
- Cartes cadeaux applicables sur sub
- Skip 1 mois ponctuel
- Code promo sur sub
- Changement de formule en cours
- Renouvellement engagement automatique
- 2FA TOTP admin
- Multilangue : FR seulement V1 (pattern Phase 1/2)
- Wishlist
- Recommandations cross-sell

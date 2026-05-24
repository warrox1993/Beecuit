# Phase 2 — Sous-projet 4/4 : B2B (Devis sur mesure) — Design

**Date :** 2026-05-24
**Sous-projet :** 4/4 de Phase 2
**Statut :** En design

## Goal

Permettre aux entreprises (cadeaux d'affaires, événements, séminaires) de demander un devis sur mesure pour des biscuits/coffrets BeeCuit. L'admin examine, fixe le prix, génère un Stripe Payment Link envoyé par email. Pas de compte B2B en V1.

## Périmètre V1

**In-scope :**
- Formulaire public `/entreprises` (sans login)
- Stockage en BDD des demandes (table `b2b_quote_requests`)
- Workflow admin : voir → set prix → générer Payment Link → email client
- Workflow admin alternatif : refuser avec motif
- Webhook Stripe pour marquer payé + créer order shadow
- Emails Resend (4 templates)
- Anti-spam basique (honeypot + rate limit IP en mémoire)

**Out-of-scope (V2/V3) :**
- Compte B2B avec login + historique
- Upload de fichiers (logo pour personnalisation)
- PDF devis et facture
- Relances automatiques si non-payé
- Multi-devise
- Approval workflow multi-niveau
- Catalogue B2B dédié avec prix volume

## Architecture

```
┌──────────────────┐
│  /entreprises    │ Public form (sans login)
│  (B2BQuoteForm)  │
└────────┬─────────┘
         │ server action createB2BQuoteRequest
         ▼
┌──────────────────┐      ┌──────────────────┐
│b2b_quote_requests│      │  Resend          │ Email admin
│  status=pending  │─────▶│  B2BAdmin...     │ "Nouveau devis"
└────────┬─────────┘      └──────────────────┘
         │
         │ Admin reviews at /admin/devis/[id]
         ▼
   ┌─────┴─────┐
   │           │
   ▼           ▼
SET QUOTE   REJECT
   │           │
   │           ▼
   │      Email client "Devis refusé"
   │      status=rejected
   │
   ▼
Create Stripe Product + Price (ad-hoc)
Create Stripe Payment Link with metadata.b2b_quote_id
Save url in DB
status=quoted
   │
   ▼
Email client "Votre devis BeeCuit"
   │
   │
   ▼ Client paie via Payment Link
   │
   ▼
Stripe webhook: checkout.session.completed
metadata.b2b_quote_id → lookup quote
status=paid
Create shadow row in orders table
Email client "Paiement reçu"
```

## Data Model

### Nouveau table : `b2b_quote_requests`

```sql
CREATE TYPE b2b_quote_status AS ENUM (
  'pending',   -- soumis par client, non examiné
  'quoted',    -- admin a généré le devis (Payment Link envoyé)
  'paid',      -- client a payé
  'rejected',  -- admin a refusé
  'expired'    -- quote_expires_at dépassé sans paiement
);

CREATE TABLE b2b_quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Champs collectés par formulaire client
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  vat_number text,
  requested_products text NOT NULL, -- description libre des biscuits/coffrets souhaités
  target_quantity integer,
  target_delivery_date date,
  budget_range text, -- enum-like libre : "<500€", "500-2000€", ">2000€", "Pas de limite"
  message text,
  locale text NOT NULL DEFAULT 'fr',

  -- Admin fields (set au moment du devis)
  status b2b_quote_status NOT NULL DEFAULT 'pending',
  quoted_amount_cents integer, -- prix total TTC en centimes
  quote_description text, -- ce que comprend le devis (visible client)
  shipping_address jsonb, -- adresse de livraison (set au moment du devis, validée par admin avec client)
  admin_notes text, -- notes internes admin (non visible client)

  -- Stripe
  stripe_product_id text, -- product ad-hoc créé pour ce devis
  stripe_price_id text,   -- price ad-hoc créé pour ce devis
  stripe_payment_link_id text,
  stripe_payment_link_url text,

  -- Rejection
  rejected_reason text, -- visible client

  -- Timestamps
  source_ip text, -- abuse tracking
  created_at timestamp NOT NULL DEFAULT now(),
  quoted_at timestamp,
  quoted_by uuid REFERENCES "user"(id) ON DELETE SET NULL,
  quote_expires_at timestamp, -- = quoted_at + 30 days
  paid_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX b2b_quote_requests_status_idx ON b2b_quote_requests(status);
CREATE INDEX b2b_quote_requests_email_idx ON b2b_quote_requests(email);
CREATE INDEX b2b_quote_requests_created_at_idx ON b2b_quote_requests(created_at DESC);
```

### Lien avec `orders`

Quand un devis B2B est payé, on crée une ligne dans `orders` pour cohérence du tableau de bord admin :
- Ajout colonne `b2b_quote_id uuid REFERENCES b2b_quote_requests(id)` à `orders` (nullable, indexée)
- `total_cents` = quote.quoted_amount_cents
- `payment_status` = 'paid'
- Pas de lignes order_items (la composition est dans `quote_description` texte libre — order admin verra le lien vers la devis pour le détail)
- Pas d'ajout d'enum order_type ; un order avec `b2b_quote_id IS NOT NULL` est un order B2B.

## Composants

### Frontend

**`app/[locale]/(shop)/entreprises/page.tsx`** (remplace coming-soon)
- Server component : héros + bénéfices + formulaire
- Sections : Hero, "Pour qui ?" (3 cas d'usage), "Comment ça marche" (4 étapes), formulaire, FAQ

**`components/shop/B2BQuoteForm.tsx`** (client)
- Champs : company_name*, contact_name*, email*, phone, vat_number, requested_products* (textarea), target_quantity, target_delivery_date, budget_range (select), message (textarea)
- Honeypot field : `<input name="_hp" style="display:none" tabIndex={-1} autoComplete="off">`
- Soumission via server action, toast de succès, formulaire reset

### Admin

**`app/admin/devis/page.tsx`**
- Liste paginée, filtres par status, recherche par email/entreprise
- Colonnes : Entreprise, Contact, Email, Date demande, Statut, Montant (si quoted), Actions

**`app/admin/devis/[id]/page.tsx`**
- Détail demande client (read-only sections)
- Section admin : status actuel
- Si pending : formulaire "Établir un devis" (quote_amount, quote_description, shipping_address) + boutons "Envoyer devis" / "Refuser"
- Si quoted : afficher payment link URL, bouton "Copier lien", indicateur expire dans X jours
- Si paid : afficher date paiement, lien vers shadow order
- Si rejected : afficher motif

**`components/admin/DevisTable.tsx`** (liste)
**`components/admin/QuoteForm.tsx`** (formulaire devis)
**`components/admin/RejectQuoteDialog.tsx`** (modal refus)

### Server-side

**`lib/db/schemas/b2b.ts`** : Drizzle schemas pour b2b_quote_requests
**`lib/validators/b2b.ts`** : Zod schemas (`CreateB2BQuoteSchema`, `AdminSetQuoteSchema`, `AdminRejectQuoteSchema`)
**`lib/actions/b2b.actions.ts`** : server actions
  - `createB2BQuoteRequest(input)` — public, retourne `{ok, requestId}`
  - `adminSetQuote(input)` — auth admin
  - `adminRejectQuote(input)` — auth admin
**`lib/stripe/payment-link.ts`** : wrapper `createB2BPaymentLink(quoteId, amountCents, description)`

### Webhook

Extension de `app/api/webhooks/stripe/route.ts` :
- `checkout.session.completed` : si `metadata.b2b_quote_id` présent, marquer la quote `paid` + créer order shadow + email confirmation.
- Idempotency via `stripe_webhook_events` (Phase 1 pattern).

### Emails (Resend + React Email)

- `lib/email/templates/B2BAdminNotification.tsx` — vers email admin (env `ADMIN_EMAIL`)
- `lib/email/templates/B2BCustomerQuote.tsx` — vers contact, contient lien Payment Link
- `lib/email/templates/B2BPaymentConfirmation.tsx` — vers contact après paiement
- `lib/email/templates/B2BQuoteRejected.tsx` — vers contact si refusé

## Anti-spam

- **Honeypot field** : `<input name="_hp">` caché. Si rempli → silently drop (200 OK fake).
- **Rate limit basique** : Map en mémoire `Map<ip, [timestamps[]]>`, max 3 demandes / 15min / IP. Stockée en module-level (acceptable Phase 2 ; Redis V3).
- **Validation côté serveur** : Zod strict ; email valide ; texte max length.

## Flow détaillé

### 1. Client soumet le form
1. Validate via Zod
2. Honeypot check
3. Rate limit check par IP
4. INSERT b2b_quote_requests (status='pending', source_ip)
5. Email admin asynchrone (Resend)
6. Retour `{ ok: true, requestId }` au client → toast "Demande envoyée, on vous répond sous 48h"

### 2. Admin examine
- Liste sur `/admin/devis`, clique sur pending
- Détail s'ouvre

### 3. Admin établit le devis
1. Remplit formulaire (amount, description, shipping_address)
2. Soumet `adminSetQuote`
3. Server :
   - Stripe `products.create({name: "Devis BeeCuit #{shortId}"})` → product_id
   - Stripe `prices.create({product, unit_amount: amountCents, currency: 'eur'})` → price_id
   - Stripe `paymentLinks.create({line_items: [{price, quantity: 1}], metadata: {b2b_quote_id: id}, after_completion: {type: 'hosted_confirmation'}})` → url
   - UPDATE b2b_quote_requests SET status='quoted', stripe_*=..., quoted_at=now(), quote_expires_at=now()+30days
   - Resend email B2BCustomerQuote avec URL
4. Toast "Devis envoyé"

### 4. Client paie
- Clique lien dans email → Stripe Checkout → paie

### 5. Webhook `checkout.session.completed`
1. Idempotency check
2. Si metadata.b2b_quote_id :
   - SELECT quote WHERE id=...
   - Si status != 'quoted' : log warning, return (no-op)
   - Si now() > quote_expires_at : log, mais on accepte quand même (rare race)
   - UPDATE status='paid', paid_at=now()
   - INSERT orders (b2b_quote_id, total_cents, payment_status='paid', stripe_session_id, ...)
   - Resend email B2BPaymentConfirmation

### 6. Admin refuse
1. Admin clique "Refuser", modal demande motif
2. `adminRejectQuote(id, reason)`
3. UPDATE status='rejected', rejected_reason=...
4. Resend email B2BQuoteRejected avec motif
5. Si stripe_product/price/payment_link existent (cas rare : déjà quoted, puis refusé après) : `stripe.paymentLinks.update({active: false})` puis archive product

### Expiration (cron ou check à la lecture)
- Optionnel V1 : lazy check à chaque GET liste — si now() > quote_expires_at && status='quoted' → status='expired' + désactivation Payment Link.
- Pas de cron dédié pour rester dans la limite Vercel Hobby (2 crons max, déjà gift-cards + subscriptions).

## Error handling

- Stripe API failure pendant `adminSetQuote` : rollback DB (`status` reste pending), toast erreur admin, log avec quote_id.
- Email Resend failure : log + toast warning admin, mais quote reste en 'quoted' (admin peut ré-envoyer manuellement via bouton).
- Webhook idempotency : déjà géré par table `stripe_webhook_events`.
- Form rate-limited : retourne 429 avec message "Trop de demandes, réessayez dans 15 min".

## Testing

**Unit :**
- `lib/validators/b2b.ts` : valide email, requis, longueurs, dates futures
- `lib/utils/b2b-anti-spam.ts` : honeypot + rate limit
- Pricing : pas de calcul complexe (admin saisit montant direct)

**Pas de tests E2E V1** (cohérent avec Phase 2 précédents).

## Risks

- **Spam massif via formulaire** : V1 honeypot + IP rate limit basiques. Si débordement, V2 ajouter Turnstile.
- **Pricing manuel error** : admin saisit le montant, risque de typo. Mitigation : confirmation modal "Vous allez créer un devis de XXX € envoyé à client@..." avant submit.
- **Client paie après expiration** : géré par webhook (accepte quand même, log warning). Rare et acceptable.
- **Stripe Payment Link 1-use** : Stripe Payment Links sont multi-use par défaut. Pour éviter double-paiement : webhook check `if quote.status == 'paid' return no-op`.

## Tâches estimées : 11

1. Migration 0007 + schema Drizzle b2b
2. Validators Zod
3. Server actions (create/setQuote/reject) + Stripe Payment Link wrapper
4. Anti-spam utility (honeypot + rate limit)
5. Public page `/entreprises` + B2BQuoteForm
6. Admin list page + DevisTable
7. Admin detail page + QuoteForm + RejectDialog
8. Admin nav entry + coming-soon flag removal
9. 4 React Email templates + sender helpers
10. Webhook handler `checkout.session.completed` avec b2b_quote_id
11. Tests unit validators + Commit + push + deploy

## Decision log

- **Pas de compte B2B V1** : YAGNI, simplifie l'admin et le client. Email-based comme tous les autres devis manuels.
- **Pas d'upload fichier V1** : ajoute complexité (Blob auth, signed URLs, validation MIME). Texte libre suffit pour V1.
- **Product/Price ad-hoc** : chaque devis a prix unique → pas de catalogue B2B. Stripe Product est juste pour avoir un nom au paiement. Archive après reject.
- **shipping_address dans devis et non dans orders** : devis B2B = livraison négociée, admin valide manuellement. Pas de recalcul shipping_cost automatique.
- **Pas de cron expiration** : Vercel Hobby = 2 crons max (gift-cards + subscriptions). Lazy check à la lecture suffit.
- **Pas d'enum order_type** : ajout d'une colonne `b2b_quote_id` à `orders`, plus simple, pas de migration de l'enum existant.

# Auth v2 — Sprint A: RGPD Compliance — design

**Date:** 2026-05-31
**Statut:** validé (brainstorming)
**Précède:** `docs/superpowers/plans/2026-05-31-auth-v2-sprint-a-rgpd.md` (à écrire)
**Suit:** `docs/superpowers/specs/2026-05-30-auth-real-login-design.md` (v1 livrée)

## Contexte

La v1 du système login/register a été livrée le 30 mai (34 commits, email+password Argon2id + Google OAuth + 5 pages + 4 emails + tests). Le spec v1 listait 9 items hors-scope explicitement reportés à la v2.

L'utilisateur cible 3 buckets sur 4 pour la v2 :
1. **Sprint A — Compliance RGPD** (ce document) : account deletion + email change. Launch-blocker légal pour un e-commerce belge.
2. **Sprint B — Trust & security** : 2FA, session list, haveibeenpwned, password strength meter (à brainstormer plus tard).
3. **Sprint C — Ops & audit** : audit log + admin user view (à brainstormer plus tard).

Sprint A est traité en premier car il débloque le launch commercial.

## Décisions validées (brainstorming)

| # | Question | Décision |
|---|----------|----------|
| 1 | Modèle de suppression du compte ? | **Cool-off 30j** puis cron purge avec anonymisation des orders |
| 2 | Email change : verify avant ou après switch ? | **Verify avant switch** (envoi à la nouvelle adresse, swap au click, undo 7j depuis l'ancienne) |

## Architecture

### Schema (1 migration `0014_account_actions`)

10 colonnes nullable ajoutées à `users` :

```sql
ALTER TABLE "users" ADD COLUMN
  "deleted_at" timestamp,
  "cancel_deletion_token" text,
  "cancel_deletion_expires_at" timestamp,
  "pending_email" text,
  "pending_email_token" text,
  "pending_email_expires_at" timestamp,
  "email_change_undo_token" text,
  "email_change_undo_expires_at" timestamp,
  "email_change_undo_to" text,
  "purged_at" timestamp;

CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
CREATE INDEX "users_pending_email_token_idx" ON "users" ("pending_email_token") WHERE "pending_email_token" IS NOT NULL;
CREATE INDEX "users_cancel_deletion_token_idx" ON "users" ("cancel_deletion_token") WHERE "cancel_deletion_token" IS NOT NULL;
CREATE INDEX "users_email_change_undo_token_idx" ON "users" ("email_change_undo_token") WHERE "email_change_undo_token" IS NOT NULL;
```

Toutes les colonnes sont nullable. Les 4 partial indexes accélèrent les lookups par token (très petite cardinalité — seuls quelques rows ont un token actif).

Sémantique :
- `deleted_at` : marqueur cool-off. Pas null = login bloqué. Cleared at cancel ou purge.
- `cancel_deletion_token` + `cancel_deletion_expires_at` : token cryptographique envoyé par email à la demande, expire = `deleted_at` + 30j.
- `pending_email` + `pending_email_token` + `pending_email_expires_at` : email change en attente de verify (24h).
- `email_change_undo_token` + `email_change_undo_expires_at` + `email_change_undo_to` : créé au moment du swap, valid 7j pour revert.
- `purged_at` : tombstone post-cron. Toute requête auth doit ignorer ces rows.

Aucune nouvelle table — assez compact pour 2 features. Sprint C ajoutera une `auth_audit_log` séparée.

### Server actions (append à `lib/actions/auth.actions.ts`)

| Action | Auth | Type | Side-effect majeur |
|---|---|---|---|
| `requestAccountDeletion(formData)` | required | form | set deleted_at + cancel token, DELETE sessions, cancel Stripe sub, send email |
| `cancelAccountDeletion(rawToken, locale)` | not required | returns result | clear deletion fields, send email |
| `requestEmailChange(formData)` | required | form | set pending email + token, send verify to new |
| `confirmEmailChange(rawToken, locale)` | not required | returns result | swap email, set undo, send notif to old |
| `revertEmailChange(rawToken, locale)` | not required | returns result | swap back, DELETE sessions, send notif |

`cancelAccountDeletion`, `confirmEmailChange`, `revertEmailChange` sont appelés depuis les pages-tokens server-side (pas de form). Ils renvoient un result `{ok: true, redirectTo} | {ok: false, error}` similaire au pattern `verifyEmail` v1.

### Helpers réutilisés

- `lib/auth/password.ts` : `verifyPassword` pour re-authentifier au moment des actions sensitives
- `lib/auth/tokens.ts` : `generateRawToken` + `hashToken` (déjà testés)
- `lib/auth/rate-limit.ts` : actions étendues — voir Rate limiting plus bas
- `lib/email/client.ts` : `sendEmail` (déjà existant)

Nouveau helper :
- `lib/auth/account-purge.ts` : `purgeUser(userId)` — encapsule la transaction de purge. Appelé par le cron + testable indépendamment.

### Pages / routes

```
app/[locale]/(account)/compte/profil/page.tsx     (modify — 2 nouveaux blocs)
app/[locale]/(shop)/confirm-email-change/[token]/page.tsx   (new)
app/[locale]/(shop)/undo-email-change/[token]/page.tsx      (new)
app/[locale]/(shop)/cancel-deletion/[token]/page.tsx        (new)
app/api/cron/account-purge/route.ts                          (new — daily 02:00 UTC)
```

Pas de page modal pour la confirmation de delete : on reste dans `/compte/profil` avec le formulaire inline (champ "tape SUPPRIMER" + password = pattern GitHub/Stripe).

### Emails React (4 nouveaux templates × 4 locales chacun)

Suivent le pattern existant (`STRINGS: Record<Locale, ...>`, brand-themed cream/honey-dark) :
- `AccountDeletionRequestedEmail` — confirme la demande, lien d'annulation valide 30j
- `AccountDeletionCancelledEmail` — confirme l'annulation
- `EmailChangeVerifyEmail` — envoyé à la NOUVELLE adresse, lien confirm 24h
- `EmailChangedNotificationEmail` — envoyé à l'ANCIENNE adresse, lien revert 7j

Total : 4 composants. Tous dans `components/email/`.

### Cron

Vercel cron via `vercel.json` :
```json
{
  "crons": [
    {
      "path": "/api/cron/account-purge",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Le route handler vérifie `Authorization: Bearer ${env.CRON_SECRET}` (pattern existant `/api/cron/gift-cards-deliver`).

## Pages — détail UI

### `/compte/profil` — 2 nouveaux blocs

Ajout après les blocs existants (Mot de passe / Comptes liés / Préférences) :

**Bloc "Adresse email"**
```
Adresse email
Actuelle : jean@example.com  [✓ vérifié]
> Nouvelle adresse email             autocomplete="email"
> Mot de passe actuel               autocomplete="current-password"
[ Envoyer le lien de vérification → ]
```
Si `pending_email` set : afficher en haut du bloc "📬 Tu as une demande en cours pour `{pending_email}`. Le lien envoyé est valable 24h. [Annuler]".

**Bloc "Zone de danger"** (visuellement séparé — border terracotta, eyebrow `ZONE DE DANGER`)
```
Supprimer mon compte
La suppression désactive ton compte immédiatement. Tes données seront
effacées après 30 jours. Tu peux annuler à tout moment via le lien
qu'on t'enverra par email.

> Mot de passe actuel
> Tape SUPPRIMER pour confirmer
[ Supprimer mon compte ]   (button outline terracotta)
```

### `/confirm-email-change/[token]`
- Server : appelle `confirmEmailChange(token, locale)`.
- Si OK : redirect `/{locale}/sign-in?email=changed` (le swap d'email invalide le session-cookie côté lookup parce que l'email change ne casse pas la session via DB — mais on force re-login pour cohérence ; les sessions ne sont pas DELETE ici, juste le user doit re-signin via le redirect).
- Actually : on **conserve** les sessions au confirm-email-change (le user reste connecté avec sa nouvelle adresse). Toast `?email=changed` sur le redirect vers `/compte/profil`.
- Si expired : écran "Lien expiré" + CTA "Recommencer la demande".

### `/undo-email-change/[token]`
- Server : appelle `revertEmailChange(token, locale)`.
- Si OK : DELETE all sessions (pour sécurité — un attaquant qui aurait switch l'email a peut-être aussi changé le password), redirect `/{locale}/sign-in?email=reverted` avec instruction "Reconnecte-toi avec ton ancien email et ton ancien mot de passe (si non changé) ou Mot de passe oublié."
- Si expired : "Lien expiré (revert window de 7 jours dépassée)".

### `/cancel-deletion/[token]`
- Server : appelle `cancelAccountDeletion(token, locale)`.
- Si OK : redirect `/{locale}/sign-in?deletion=cancelled` (le user doit re-signin car ses sessions ont été DELETE au moment de la demande).
- Si expired/purgé : écran "Trop tard — le compte a été supprimé définitivement".

### Aucun bandeau dans `/compte`
Pas de bandeau "compte en cours de suppression" parce qu'au moment de la demande, on déconnecte. Le user ne re-verra `/compte` que via cancel link → re-signin.

## Data flows

### Request account deletion
```
form submit (password + confirmText) → requestAccountDeletion
  → auth() required, fetch user (verify not already purged)
  → zod : confirmText === "SUPPRIMER" (literal, case-sensitive), password.length >= 1
  → verify password via verifyPassword(input, user.passwordHash)
    → if user has no passwordHash (OAuth-only) : reject "Connecte-toi à Google et réessaie" — alternatively, allow with just confirmText? See edge cases below.
  → rate-limit check (action='delete', 2/user/1h)
  → generate raw cancel token + hash
  → in TRANSACTION:
      UPDATE users SET
        deleted_at = NOW(),
        cancel_deletion_token = hashed,
        cancel_deletion_expires_at = NOW() + INTERVAL '30 days'
      WHERE id = user.id
      DELETE FROM sessions WHERE user_id = user.id  -- force logout partout
  → if user has active Stripe subscription :
      try { stripe.subscriptions.update(subId, { cancel_at_period_end: true }) }
      catch { log, continue }
  → sendEmail AccountDeletionRequestedEmail (to=user.email, cancelUrl=appBase/{locale}/cancel-deletion/{raw}, expires=30d)
  → redirect /{locale}/?deletion=requested
```

### Cancel deletion
```
GET /[locale]/cancel-deletion/[token]:
  → hash(token) → SELECT users WHERE cancel_deletion_token = ? AND cancel_deletion_expires_at > NOW() AND purged_at IS NULL
  → if not found → render <ExpiredScreen "Trop tard ou lien invalide">
  → UPDATE users SET deleted_at = NULL, cancel_deletion_token = NULL, cancel_deletion_expires_at = NULL
  → sendEmail AccountDeletionCancelledEmail
  → redirect /{locale}/sign-in?deletion=cancelled
```

### Sign-in blocked while deletion pending
```
signInWithPassword extension : after fetching user
  if user.purged_at != null:
    return generic invalid-credentials (no leak)
  if user.deleted_at != null:
    redirect ?error=account-deleted
    (i18n: "Ce compte est programmé pour suppression. Annule via le lien dans ton email.")
```

Similar guard in Google OAuth callback : the adapter's signIn callback should reject if `users.deleted_at` set (intercept via NextAuth `events.signIn` or `callbacks.signIn`).

### Request email change
```
form submit (newEmail + currentPassword) → requestEmailChange
  → auth() required, fetch user
  → zod : newEmail valid + lowercase + max 254
  → normalize newEmail
  → if newEmail === user.email → return ?error=same-email
  → verify password (if user.passwordHash null → require oauth path : "set un mot de passe d'abord via Mot de passe oublié")
  → rate-limit (action='email-change', 3/user/15min)
  → check newEmail not taken by another (non-purged) user :
      SELECT id FROM users WHERE email = newEmail AND purged_at IS NULL
      if found → ?error=email-taken
  → generate raw token + hash
  → UPDATE users SET
      pending_email = newEmail,
      pending_email_token = hashed,
      pending_email_expires_at = NOW() + INTERVAL '24 hours'
    WHERE id = user.id
  → sendEmail EmailChangeVerifyEmail (to=newEmail, confirmUrl=/{locale}/confirm-email-change/{raw})
  → redirect /{locale}/compte/profil?email=verify-sent
```

### Confirm email change
```
GET /[locale]/confirm-email-change/[token]:
  → hash → SELECT users WHERE pending_email_token = ? AND pending_email_expires_at > NOW() AND purged_at IS NULL
  → if not found → "Lien expiré"
  → race check : if user.pending_email exists in another user.email (somebody else registered the new addr in the interim) :
      clear pending fields, redirect ?error=email-taken-race
  → in TRANSACTION:
      oldEmail = user.email
      newUndoRaw = generateRawToken()
      UPDATE users SET
        email = pending_email,
        email_verified = NOW(),       -- new email implicitly verified by clicking
        email_change_undo_to = oldEmail,
        email_change_undo_token = hash(newUndoRaw),
        email_change_undo_expires_at = NOW() + INTERVAL '7 days',
        pending_email = NULL,
        pending_email_token = NULL,
        pending_email_expires_at = NULL
      WHERE id = user.id
  → sendEmail EmailChangedNotificationEmail (to=oldEmail, undoUrl=/{locale}/undo-email-change/{newUndoRaw}, newEmail=user.new)
  → redirect /{locale}/compte/profil?email=changed
```

(Note: sessions preserved — user reste connecté avec sa nouvelle adresse.)

### Revert email change
```
GET /[locale]/undo-email-change/[token]:
  → hash → SELECT users WHERE email_change_undo_token = ? AND email_change_undo_expires_at > NOW() AND purged_at IS NULL
  → if not found → "Lien expiré (window 7 jours dépassée)"
  → check email_change_undo_to not currently taken by another user
      (very unlikely — was their own previously — but possible if they did a 2nd change in the 7d window)
      if taken : ?error=cannot-revert
  → in TRANSACTION:
      UPDATE users SET
        email = email_change_undo_to,
        email_change_undo_to = NULL,
        email_change_undo_token = NULL,
        email_change_undo_expires_at = NULL
      WHERE id = user.id
      DELETE FROM sessions WHERE user_id = user.id   -- force re-login
  → sendEmail to both addresses (notif info)
  → redirect /{locale}/sign-in?email=reverted
```

### Cron purge `/api/cron/account-purge`
```
authorize Bearer ${env.CRON_SECRET} (return 401 if missing)
  → SELECT id, email FROM users WHERE deleted_at < NOW() - INTERVAL '30 days' AND purged_at IS NULL
  → for each user, call purgeUser(user.id) in its own transaction
  → return JSON { purged: count, processedAt: NOW() }
```

`purgeUser(userId)` helper :
```
in TRANSACTION:
  -- Fully delete rows that are pure personal data
  DELETE FROM addresses WHERE user_id = X
  DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = X)
  DELETE FROM carts WHERE user_id = X
  DELETE FROM accounts WHERE user_id = X            -- OAuth links
  DELETE FROM sessions WHERE user_id = X
  DELETE FROM password_reset_tokens WHERE user_id = X
  DELETE FROM newsletter_subscribers WHERE email IN (SELECT email FROM users WHERE id = X)
  DELETE FROM verification_tokens WHERE identifier IN (SELECT email FROM users WHERE id = X)
  DELETE FROM auth_rate_limit_hits WHERE identifier LIKE '%:' || (SELECT email FROM users WHERE id = X)

  -- Anonymize rows we must keep for legal accounting (7y BE)
  UPDATE orders SET
    shipping_name = '[supprimé]',
    billing_name = '[supprimé]',
    email = 'deleted-' || X || '@anon.invalid',
    phone = NULL,
    shipping_address_snapshot = jsonb_strip_nulls(...) /* keep only city/country, scrub name/street/postcode/phone */,
    billing_address_snapshot = jsonb_strip_nulls(...)
  WHERE user_id = X

  UPDATE subscriptions SET
    address_snapshot = ... scrub ...,
    contact_name = '[supprimé]'
  WHERE user_id = X

  UPDATE b2b_quote_requests SET
    contact_name = '[supprimé]',
    email = 'deleted-' || X || '@anon.invalid',
    phone = NULL,
    message = NULL,
    shipping_address = NULL
  WHERE quoted_by = X  -- ⚠️ schema check : b2b_quote_requests.user_id ? to verify

  -- Gift cards purchased by this user : keep code valid for recipient, scrub purchaser
  UPDATE gift_cards SET
    purchaser_email = 'deleted-' || X || '@anon.invalid',
    purchaser_name = NULL
  WHERE purchaser_user_id = X

  -- Final : scrub the user row, mark purged
  UPDATE users SET
    email = 'deleted-' || X || '@anon.invalid',
    name = NULL,
    password_hash = NULL,
    image = NULL,
    newsletter_opt_in = false,
    deleted_at = NULL,
    cancel_deletion_token = NULL, cancel_deletion_expires_at = NULL,
    pending_email = NULL, pending_email_token = NULL, pending_email_expires_at = NULL,
    email_change_undo_to = NULL, email_change_undo_token = NULL, email_change_undo_expires_at = NULL,
    purged_at = NOW()
  WHERE id = X
```

Le `purged_at` set permet aux queries d'auth d'ignorer ces tombstones (filtres ajoutés à `signInWithPassword`, `registerWithPassword` — pas de collision sur l'email "deleted-…@anon.invalid" lors d'un register futur, mais on évite quand même).

Note : la plupart des FK columns mentionnées (ex: `b2b_quote_requests.quoted_by`, `gift_cards.purchaser_user_id`, `subscriptions.address_snapshot`) doivent être vérifiées contre le schéma réel pendant l'implémentation. Le plan corrigera si différent.

## Error handling

**Anti-enumeration**
- Request email change : "email déjà utilisé" → acceptable (le user a cliqué délibérément sur "changer", confirmation de conflit attendue)
- Confirm/undo/cancel tokens : génériques, ne distinguent pas "expired" vs "not found" vs "already used" pour les liens (msg = "Lien expiré ou invalide")

**OAuth-only users (passwordHash null)**
- Pour delete account : on demande quand même confirmText "SUPPRIMER" (pas de password à vérifier) — alternative est de bloquer et demander de set un password d'abord. Décision : autoriser car bloquer pourrait être plus dangereux (user veut juste partir, pas créer un password). Le confirmText est suffisant comme garde anti-clic-accidentel.
- Pour email change : on bloque et demande de set un password d'abord ("Pour changer ton email, set d'abord un mot de passe via Mot de passe oublié"). Logique : changer l'email avec juste un Google OAuth signed-in serait possible mais l'auth tradeoff est bizarre.
- Actually — reconsider : pour email change avec OAuth-only, on peut re-authentifier via un Google OAuth flow (déjà supporté). Out-of-scope v2-A — V2-A reste sur password-required. V2 future peut ajouter le step OAuth.

**Concurrent state**
- Deux requestEmailChange parallèles : le 2e écrase le 1er (acceptable, le 1er token expire silencieusement).
- requestAccountDeletion pendant qu'un confirmEmailChange est pending : on clear pending_email aussi dans la transaction de deletion.

**Stripe sub cancel**
- Best-effort try/catch. Si Stripe call échoue, on log + continue. Le user attend 30j puis sera purgé — la sub Stripe continuera côté Stripe jusqu'au period end. Acceptable car la cliente verra dans Stripe dashboard.

## Rate limiting

Extension de `lib/auth/rate-limit.ts` : 2 nouvelles actions.

| Action | Per user | Per IP |
|---|---|---|
| email-change | 3 / 15 min | 5 / 15 min |
| delete | 2 / 1h | 3 / 1h |

(Per-user dans cette V2 = identifier prefixé `email-change:user-id-{id}` ou `email-change:{email}`. Le helper accepte déjà `email` comme dimension ; pour user-id, on peut soit migrer le helper, soit passer `email = session.user.email` ce qui est équivalent fonctionnellement.)

## Sécurité

- Tokens : 32 bytes base64url stockés sha256 (pattern existant)
- Cookies inchangé
- Cron secret : `CRON_SECRET` existant (Bearer header)
- L'anonymisation des `orders.shipping_address_snapshot` etc. est destructive — on perd la possibilité de reconstituer l'adresse. Acceptable car les receipts ont été envoyés avant suppression et la cliente peut télécharger un export comptable hors-DB.
- Le sentinel `'deleted-' || id || '@anon.invalid'` utilise le TLD `.invalid` (RFC 2606, jamais routable) — aucun risque d'envoyer un email à cette adresse par erreur.

## Tests

### Unit (vitest)
- `lib/auth/account-purge.test.ts` : `purgeUser(userId)` purge cleanly (avec un DB fixture / mocks), idempotent (deuxième appel sur un row déjà purgé = no-op).
- (Helpers `password`, `tokens`, `callback-url`, `rate-limit` déjà testés en v1.)

### Playwright e2e
- `tests/e2e/auth-email-change.spec.ts` :
  - Logged-in user changes email → page shows `?email=verify-sent`
  - Visit confirm link (mock token in DB via test fixture) → redirect with `?email=changed`
  - Visit undo link → redirect with `?email=reverted`
- `tests/e2e/auth-account-deletion.spec.ts` :
  - Logged-in user requests deletion → logged out + redirected with `?deletion=requested`
  - Sign-in attempt with same credentials → blocked with `?error=account-deleted`
  - Visit cancel link → redirect `?deletion=cancelled` + sign-in works again

### Integration (cron)
- Script `scripts/test-purge-locally.mjs` (DEV only) : inserts a fake user with `deleted_at = NOW() - 31 days`, runs `purgeUser`, asserts the row is now `purged_at IS NOT NULL` with scrubbed fields.

## Configuration

- `vercel.json` : ajout d'un cron entry pour `/api/cron/account-purge` (daily 02:00 UTC).
- Pas de nouvel env var.

## i18n

~25 nouvelles clés sous `auth.*` (4 locales) :
- Email change : labels du form, hints, errors (`email-taken`, `same-email`), toasts (`email=verify-sent`, `email=changed`, `email=reverted`)
- Account deletion : labels du form, eyebrow "ZONE DE DANGER", confirmation text "SUPPRIMER", errors (`account-deleted` au sign-in), toasts (`deletion=requested`, `deletion=cancelled`)

## Hors scope v2-A

- 2FA / TOTP → Sprint B
- Session list ("3 appareils connectés") → Sprint B
- Audit log → Sprint C
- Admin page pour gérer les comptes individuels → Sprint C
- Export RGPD ("télécharge tes données") — request d'export sur 30j. Pas demandé explicitement mais légalement attendu. **Décision : à reporter à un Sprint D futur** si la cliente reçoit une demande.
- haveibeenpwned check / strength meter → Sprint B
- Apple Sign-In / Passkeys → potentiellement jamais

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Cron purge supprime accidentellement un user pendant le cool-off | Filtre strict `deleted_at < NOW() - 30j AND purged_at IS NULL` |
| Anonymisation casse des reports comptables | Garder `orders.total_cents`, `created_at`, `stripe_payment_intent` intacts ; scrub uniquement PII |
| User reçoit confirm-email-change pour la nouvelle adresse + en parallèle un attaquant essaie de register avec cette même adresse | Race check au confirm : si `pending_email` est devenu un email existant chez quelqu'un d'autre, abort + clear pending |
| Stripe sub annulation échoue silencieusement | Try/catch + log ; admin peut récupérer via Stripe dashboard |
| L'utilisateur perd accès à son ancien email avant les 7j de revert window | C'est sa responsabilité — par design, le revert protège contre un compromis du compte, pas contre une perte de boîte. Acceptable. |
| Migration 0014 cassée en prod | Migration purement additive (`ADD COLUMN`), idempotente via applier existant |

## Validation finale (checklist post-deploy)

- [ ] Migration `0014` appliquée local + prod
- [ ] Cron `/api/cron/account-purge` visible dans vercel dashboard
- [ ] CRON_SECRET set en prod
- [ ] Smoke : register test user → request email change → confirm via link Resend → vérifier swap + undo
- [ ] Smoke : register test user → request deletion → logout → confirmer login bloqué → cancel via link → re-signin OK
- [ ] Tests Playwright e2e passent
- [ ] 4 email templates rendent correctement dans aperçu Resend

## Effort estimé

| Bloc | Jours |
|---|---|
| Schema + migration + helpers (`account-purge.ts`) | 0.5 |
| 5 server actions + adaptations (sign-in guard, etc.) | 1 |
| 4 email templates × 4 locales | 0.5 |
| 3 nouvelles pages tokens + 2 nouveaux blocs `/compte/profil` | 1 |
| Cron route + scripts test | 0.5 |
| i18n keys × 4 locales | 0.25 |
| Tests unit + e2e | 0.5 |
| **Total** | **~4 jours** |

Sous forme d'un seul plan d'implémentation à la writing-plans (~20-25 tâches).

# Auth v2 — Sprint B: Trust & Security — design

**Date:** 2026-05-31
**Statut:** validé (brainstorming)
**Précède:** `docs/superpowers/plans/2026-05-31-auth-v2-sprint-b-trust-security.md` (à écrire)
**Suit:** `docs/superpowers/specs/2026-05-31-auth-v2-sprint-a-rgpd-design.md` (Sprint A livré le 31 mai)

## Contexte

La v1 du login (30 mai) puis le Sprint A RGPD (31 mai, account deletion + email change) sont livrés. La v2 ciblait 3 buckets ; Sprint A était le launch-blocker légal. Sprint B couvre le bucket **trust & security** — il n'est pas bloquant pour le launch mais renforce la confiance (e-commerce premium) et protège le compte admin (seul compte à forte valeur : produits, commandes, devis B2B).

L'architecture auth existante :
- `users` : `passwordHash` (Argon2id), `role` (customer/b2b/admin), `preferredLocale`, + colonnes Sprint A.
- `sessions` : `sessionToken` (PK) / `userId` / `expires` — **aucune métadonnée device** aujourd'hui.
- Helpers : `lib/auth/password.ts` (Argon2id), `tokens.ts` (`generateRawToken` + `hashToken`), `rate-limit.ts` (DB-backed, par action), `session.ts` (`createDbSession` / `destroyCurrentSession` custom). Sessions DB custom + DrizzleAdapter NextAuth (beta) pour Google OAuth.

## Décisions validées (brainstorming)

| # | Question | Décision |
|---|----------|----------|
| 1 | Périmètre Sprint B ? | **Tout le spec** : 2FA TOTP opt-in (tous), liste de sessions + révocation, HIBP, strength meter |
| 2 | 2FA pour comptes Google-only (sans password) ? | **Non** — TOTP proposé aux comptes password uniquement ; les comptes Google-only s'appuient sur la 2FA Google |
| 3 | Récupération si perte de l'app TOTP ? | **Codes de récupération (10) + fallback email** (lien à usage unique pour désactiver le 2FA) |
| 4 | Password strength meter ? | **Heuristique légère custom** (pas de lib lourde) |
| 5 | Check haveibeenpwned ? | **Avertir, ne pas bloquer** (fail-open si API down) |
| 6 | 2FA admin imposé ou encouragé ? | **Bannière de rappel (nag)** dans `/admin`, pas de blocage |
| 7 | Données stockées pour la liste de sessions ? | **Label appareil + IP complète + ville géolocalisée** (via headers Vercel) |

## Choix techniques transverses

- **TOTP** : lib `otplib` (génération + vérification RFC-6238, fenêtre de tolérance ±1 step) + `qrcode` pour produire le data-URL du QR code. **Les deux sont utilisés server-side uniquement → zéro impact sur le bundle client.**
- **Chiffrement du secret TOTP au repos** : AES-256-GCM via `node:crypto`. Clé dérivée de `AUTH_SECRET` existant par `scrypt` (pas de nouvel env var). Format stocké : `iv:authTag:ciphertext` (base64url). Si la DB fuit, les secrets restent inexploitables sans `AUTH_SECRET`.
- **Géolocalisation des sessions** : headers Vercel natifs `x-vercel-ip-city`, `x-vercel-ip-country` (+ `x-forwarded-for` pour l'IP). **Aucun service tiers, gratuit, déjà disponible en prod.** En dev (headers absents), on stocke `null` / `"local"`.
- **Strength meter & HIBP** : code isomorphe léger, pas de dépendance lourde (pas de zxcvbn).

## Architecture

### Schema (1 migration `0015_trust_security`)

**`users` — 4 colonnes 2FA (toutes nullable) :**
```sql
ALTER TABLE "users" ADD COLUMN
  "two_factor_secret" text,                       -- secret TOTP chiffré AES-GCM
  "two_factor_enabled_at" timestamp,              -- NULL = 2FA non activé
  "two_factor_disable_token" text,                -- fallback email (sha256)
  "two_factor_disable_expires_at" timestamp;

CREATE INDEX "users_2fa_disable_token_idx" ON "users" ("two_factor_disable_token")
  WHERE "two_factor_disable_token" IS NOT NULL;
```

Sémantique :
- `two_factor_secret` : présent dès `generateTwoFactorSetup` (état *pending*), mais le 2FA n'est **actif** que si `two_factor_enabled_at IS NOT NULL`. Un setup abandonné laisse un secret pending sans enabled_at (écrasé au prochain setup).
- `two_factor_disable_token` + `two_factor_disable_expires_at` : créés à la demande de fallback email, valides 24h.

**Nouvelle table `two_factor_recovery_codes` :**
```sql
CREATE TABLE "two_factor_recovery_codes" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code_hash" text NOT NULL,        -- sha256 du code (format affiché : xxxx-xxxx)
  "used_at" timestamp               -- NULL = encore valide
);
CREATE INDEX "recovery_codes_user_id_idx" ON "two_factor_recovery_codes" ("user_id");
```
10 codes générés à l'activation. La consommation set `used_at` (pas de DELETE — trace anti-rejeu). La régénération supprime les rows existants et en réinsère 10.

**`sessions` — 6 colonnes métadonnées (additif, nullable sauf created_at) :**
```sql
ALTER TABLE "sessions" ADD COLUMN
  "created_at" timestamp NOT NULL DEFAULT now(),
  "last_seen_at" timestamp,
  "user_agent" text,        -- raw UA, parsé en label à l'affichage
  "ip" text,
  "city" text,
  "country" text;
```

**Purge Sprint A :** `purgeUser()` (helper `lib/auth/account-purge.ts`) doit aussi `DELETE FROM two_factor_recovery_codes WHERE user_id = X` et scrubber les colonnes 2FA du user (déjà couvert par le scrub global du row users, mais ajouter le `two_factor_secret`/disable token au reset explicite). À ajuster pendant l'implémentation.

### Server actions (append `lib/actions/auth.actions.ts`)

| Action | Auth | Type | Side-effect majeur |
|---|---|---|---|
| `generateTwoFactorSetup()` | required | returns `{otpauthUrl, qrDataUrl}` | crée secret *pending* chiffré (pas d'enabled_at) |
| `enableTwoFactor(formData)` | required | form | vérifie TOTP vs pending secret, set enabled_at, génère 10 recovery codes (renvoyés), email notif |
| `disableTwoFactor(formData)` | required | form | vérifie password, clear secret + enabled_at + recovery codes |
| `regenerateRecoveryCodes(formData)` | required | form | vérifie password, remplace les 10 codes, renvoie les nouveaux |
| `verifyTwoFactorChallenge(formData)` | pending-2fa cookie | form | vérifie TOTP **ou** recovery code, `createDbSession`, clear cookie |
| `requestDisable2faEmail()` | pending-2fa cookie | returns result | génère disable token + email à l'adresse du compte |
| `confirmDisable2fa(rawToken, locale)` | not required | returns result | désactive le 2FA, email notif |
| `revokeSession(formData)` | required | form | DELETE une session (vérifie ownership) |
| `revokeAllOtherSessions()` | required | form | DELETE toutes les sessions du user sauf la courante |

`signInWithPassword` est **étendu** : après `verifyPassword`, si `two_factor_enabled_at IS NOT NULL`, ne PAS créer de session. Poser un cookie signé `pending-2fa` (voir Data flows) et rediriger vers `/{locale}/sign-in/2fa`.

`confirmDisable2fa` est appelé depuis la page-token server-side (pattern `verifyEmail`/Sprint A), renvoie `{ok, redirectTo} | {ok:false, error}`.

### Helpers

Réutilisés : `password.ts` (`verifyPassword`), `tokens.ts` (`generateRawToken`, `hashToken`), `rate-limit.ts`, `email/client.ts` (`sendEmail`), `session.ts` (`createDbSession`).

Nouveaux :
- `lib/auth/totp.ts` : `generateSecret()`, `buildOtpauthUrl(secret, email)`, `verifyTotp(secret, code)` (wrap otplib), `encryptSecret(plain)` / `decryptSecret(stored)` (AES-GCM via AUTH_SECRET).
- `lib/auth/recovery-codes.ts` : `generateRecoveryCodes()` (renvoie 10 codes plaintext + leurs hashes), `consumeRecoveryCode(userId, code)` (lookup hash non-used, set used_at, renvoie bool).
- `lib/auth/password-strength.ts` : `scorePassword(password, {email})` → `{score: 0-4, label, suggestions}`. **Isomorphe** (pas de `server-only`), pur, testé.
- `lib/auth/hibp.ts` : `checkPasswordBreached(password)` → `{breached: boolean, count: number}` via k-anonymity. Fail-open (`{breached:false}`) si fetch échoue.
- `lib/auth/pending-2fa.ts` : `setPending2faCookie(userId)`, `readPending2faCookie()`, `clearPending2faCookie()` — cookie signé HMAC-SHA256 avec `AUTH_SECRET`, payload `{userId, exp}`, TTL 5 min.
- `lib/auth/session-metadata.ts` : `captureMetadata(headers)` → `{userAgent, ip, city, country}` depuis les headers de requête ; `parseUserAgentLabel(ua)` → `"Chrome · Windows"` (parsing léger maison, pas de lib).

### Pages / routes

```
app/[locale]/(auth)/sign-in/2fa/page.tsx               (new — challenge TOTP/recovery)
app/[locale]/(shop)/disable-2fa/[token]/page.tsx       (new — fallback email)
app/[locale]/(account)/compte/profil/page.tsx          (modify — +2 blocs)
```
(Le chemin exact des groupes de routes — `(auth)` / `(shop)` — sera aligné sur l'existant pendant l'implémentation : v1 a placé sign-in sous un groupe, on suit le même.)

### Composants

- `TwoFactorBlock` (client, dans `/compte/profil`) : 4 états — (a) désactivé → bouton "Activer", (b) wizard d'activation (QR + champ code + bouton vérifier), (c) écran recovery codes (one-shot, téléchargeables), (d) activé → bouton "Désactiver" (demande password) + "Régénérer les codes".
- `SessionsBlock` (client) : liste des sessions, marqueur "Cet appareil", bouton révoquer par ligne + "Déconnecter tous les autres appareils".
- `PasswordStrengthMeter` (client) : barre + label + conseils, branché dans sign-up / reset-password / change-password. Au blur, appelle un server action `checkPasswordBreached` et affiche un avertissement HIBP non-bloquant.
- `Admin2faNagBanner` (server, dans le layout `/admin`) : visible si `role=admin && two_factor_enabled_at IS NULL`, CTA vers `/compte/profil#securite`.

### Emails React (2 nouveaux × 4 locales)

Pattern existant (`STRINGS: Record<Locale, ...>`, cream/honey-dark) :
- `TwoFactorEnabledEmail` — notif sécurité quand le 2FA est activé (avec rappel "si ce n'est pas toi, change ton mot de passe").
- `Disable2faRequestEmail` — envoyé à la demande de fallback, lien `/{locale}/disable-2fa/{raw}` valide 24h.

Pas d'email à la révocation de session (YAGNI) ni à la consommation d'un recovery code (YAGNI).

## Data flows

### Activation 2FA
```
1. generateTwoFactorSetup() [auth required]
   → si pas de passwordHash (OAuth-only) → reject "Définis d'abord un mot de passe"
   → secret = totp.generateSecret()
   → UPDATE users SET two_factor_secret = encryptSecret(secret) WHERE id = me   (enabled_at reste NULL)
   → return { otpauthUrl: buildOtpauthUrl(secret, email), qrDataUrl: await qrcode(otpauthUrl) }

2. enableTwoFactor({ code }) [auth required]
   → si two_factor_enabled_at != null → already enabled
   → secret = decryptSecret(user.two_factor_secret)
   → if !verifyTotp(secret, code) → error "Code invalide"
   → { plain, hashes } = generateRecoveryCodes()    // 10 codes
   → TRANSACTION:
       UPDATE users SET two_factor_enabled_at = NOW()
       DELETE recovery codes existants WHERE user_id = me
       INSERT 10 rows (user_id, code_hash)
   → sendEmail TwoFactorEnabledEmail
   → return { recoveryCodes: plain }   // affichés une seule fois
```

### Challenge 2FA au login
```
signInWithPassword (étendu) :
  → verifyPassword OK
  → if user.two_factor_enabled_at != null:
       setPending2faCookie(user.id)        // cookie signé, TTL 5min, PAS de session DB
       redirect /{locale}/sign-in/2fa
     else:
       createDbSession(user.id)            // flow v1 inchangé
       redirect ...

GET /{locale}/sign-in/2fa :
  → readPending2faCookie() → si absent/expiré → redirect /sign-in?error=2fa-expired
  → affiche le form (champ code 6 chiffres + lien "utiliser un code de récupération" + lien "perdu l'accès ?")

verifyTwoFactorChallenge({ code }) :
  → pending = readPending2faCookie() → sinon error
  → rate-limit (action='two-factor', 5/15min, identifier = userId)
  → user = fetch(pending.userId)
  → si code matche verifyTotp(decryptSecret(secret), code)  OU  consumeRecoveryCode(userId, code):
       createDbSession(userId)            // capture metadata (voir Sessions)
       clearPending2faCookie()
       redirect /{locale}/compte (ou callbackUrl)
     sinon → error "Code invalide"
```

### Fallback email (perte de l'app + des codes)
```
Depuis /sign-in/2fa, lien "perdu l'accès ?" → requestDisable2faEmail() :
  → pending = readPending2faCookie() requis
  → rate-limit (action='disable-2fa', 2/1h)
  → raw = generateRawToken()
  → UPDATE users SET two_factor_disable_token = hashToken(raw),
                     two_factor_disable_expires_at = NOW() + 24h  WHERE id = pending.userId
  → sendEmail Disable2faRequestEmail (to = user.email, url = /{locale}/disable-2fa/{raw})
  → message "Si un compte existe, un email a été envoyé"

GET /{locale}/disable-2fa/[token] → confirmDisable2fa(token, locale) :
  → SELECT user WHERE two_factor_disable_token = hash AND expires > NOW() AND purged_at IS NULL
  → si absent → "Lien expiré ou invalide"
  → TRANSACTION:
      UPDATE users SET two_factor_secret = NULL, two_factor_enabled_at = NULL,
                       two_factor_disable_token = NULL, two_factor_disable_expires_at = NULL
      DELETE recovery codes WHERE user_id
  → sendEmail (notif "2FA désactivé")
  → redirect /{locale}/sign-in?2fa=disabled
```

### Désactivation volontaire (depuis /compte/profil)
```
disableTwoFactor({ password }) [auth required] :
  → verifyPassword → sinon error
  → TRANSACTION: clear two_factor_secret + enabled_at + disable token, DELETE recovery codes
  → return ok (toast "2FA désactivé")
```

### Sessions — capture & affichage
```
Création (password) : createDbSession(userId) étendu pour accepter metadata
  → INSERT sessions (..., created_at=NOW(), last_seen_at=NOW(), user_agent, ip, city, country)
    où metadata = captureMetadata(await headers())

Création (Google OAuth) : override de `createSession` du DrizzleAdapter dans la config NextAuth
  → après l'insert standard, UPDATE la row avec les metadata depuis les headers de la requête callback

Rafraîchissement : sur navigation authentifiée, last_seen_at mis à jour au plus une fois / 15 min
  (throttle : skip si last_seen_at > NOW() - 15min). Fait dans un point central (layout authentifié
  ou un petit helper appelé par auth()), sans bloquer le rendu.

Affichage (SessionsBlock) :
  → SELECT sessions WHERE user_id = me ORDER BY last_seen_at DESC
  → la session courante identifiée en comparant le sessionToken du cookie
  → label = parseUserAgentLabel(user_agent) + city + last_seen relatif

revokeSession({ sessionToken }) :
  → vérifie que la row appartient à me (WHERE session_token = ? AND user_id = me)
  → la session COURANTE n'a pas de bouton révoquer (affichée "Cet appareil" ; pour s'y déconnecter
    on utilise la Déconnexion normale). Le server action refuse si sessionToken == courant.
  → DELETE
revokeAllOtherSessions() :
  → DELETE sessions WHERE user_id = me AND session_token != courant
```

### HIBP & strength meter
```
PasswordStrengthMeter (client) :
  → à chaque frappe : scorePassword(value, {email}) → barre + label + conseils (synchrone, local)
  → au blur (debounce 500ms) : server action checkPasswordBreached(value)
       → sha1(value) → prefix 5 / suffix 35
       → GET https://api.pwnedpasswords.com/range/{prefix}  (Add-Padding: true)
       → si suffix présent → { breached:true, count }  sinon { breached:false }
       → catch → { breached:false }  (fail-open)
  → si breached → avertissement rouge inline NON bloquant ("Ce mot de passe est apparu dans N fuites…")
  → le submit n'est jamais bloqué par HIBP (décision : avertir seulement)
```

## Error handling & edge cases

- **OAuth-only (passwordHash null)** : `generateTwoFactorSetup` rejette avec "Définis d'abord un mot de passe via Mot de passe oublié". `disableTwoFactor`/`regenerateRecoveryCodes` demandent le password (toujours présent si 2FA actif, car 2FA ⇒ compte password).
- **Setup abandonné** : un `two_factor_secret` pending sans `enabled_at` est inerte (le login ne déclenche pas de challenge). Écrasé au prochain `generateTwoFactorSetup`.
- **Recovery code rejoué** : `consumeRecoveryCode` ne matche que `used_at IS NULL` → un code utilisé est inerte.
- **Cookie pending-2fa expiré** : `/sign-in/2fa` redirige vers `/sign-in?error=2fa-expired` ("Session expirée, reconnecte-toi").
- **Brute-force TOTP** : rate-limit `two-factor` 5/15min par userId ; au-delà → blocage temporaire générique.
- **HIBP API down** : fail-open silencieux (pas de blocage du submit, le meter ignore juste l'info breach).
- **Headers Vercel absents (dev/local)** : metadata → `null` / `country="local"` ; l'UI affiche "Appareil inconnu" proprement.
- **Tolérance d'horloge TOTP** : fenêtre ±1 step (±30s) via otplib `window: 1`.

## Rate limiting

Extension `lib/auth/rate-limit.ts` : 2 nouvelles actions.

| Action | Par user | Par IP |
|---|---|---|
| two-factor | 5 / 15 min | 10 / 15 min |
| disable-2fa | 2 / 1h | 3 / 1h |

(Identifier par userId pour `two-factor` — `pending.userId` est connu ; pattern existant accepte une dimension `email`/identifier.)

## Sécurité

- Secret TOTP **chiffré au repos** (AES-256-GCM, clé scrypt(AUTH_SECRET)). Jamais renvoyé au client après l'activation.
- Recovery codes **hashés** (sha256), affichés une seule fois en clair, jamais re-affichables.
- Cookie pending-2fa : signé HMAC, TTL court (5 min), httpOnly + secure en prod. Ne contient pas de droits — juste un userId à challenger.
- Tokens disable-2fa : 32 bytes base64url, stockés sha256, TTL 24h (pattern existant).
- Le fallback email est un vecteur de contournement assumé (décision #3) — mitigé par : lien à usage unique, TTL court, rate-limit, notif post-désactivation aux deux états.
- IP complète stockée = donnée personnelle (RGPD) : justification **sécurité / intérêt légitime** (permettre à l'utilisateur de repérer une session suspecte). Purgée avec le compte (cascade FK sessions). À mentionner dans la politique de confidentialité.

## Tests

### Unit (vitest)
- `lib/auth/password-strength.test.ts` : scores attendus (faible/moyen/fort), mots interdits, partie email.
- `lib/auth/hibp.test.ts` : fetch mocké — suffix présent → breached ; réseau KO → fail-open.
- `lib/auth/totp.test.ts` : encrypt/decrypt round-trip ; verifyTotp avec un code généré ; fenêtre.
- `lib/auth/recovery-codes.test.ts` : génération de 10 codes uniques ; consume marque used_at ; rejeu = false.
- `lib/auth/pending-2fa.test.ts` : sign/verify cookie ; expiration ; tampering rejeté.

### Playwright e2e
- `tests/e2e/auth-2fa.spec.ts` : user active le 2FA (mock secret en DB via fixture) → login demande le code → code OK → connecté ; recovery code consomme ; mauvais code rejeté.
- `tests/e2e/auth-sessions.spec.ts` : user connecté voit ≥1 session ; "déconnecter les autres" laisse la session courante.

## Configuration

- **Aucun nouvel env var** (chiffrement dérivé de `AUTH_SECRET`).
- 2 nouvelles dépendances : `otplib`, `qrcode` (+ `@types/qrcode` en dev). Server-only.
- Pas de cron.

## i18n

~35 nouvelles clés `auth.*` ×4 locales :
- 2FA : bloc Sécurité (statut, activer, scanner, vérifier, recovery codes, désactiver, régénérer), page challenge, erreurs (`2fa-expired`, code invalide), toasts (`2fa=disabled`).
- Sessions : labels liste, "cet appareil", "déconnecter les autres", "vu il y a…".
- Strength meter : labels score (très faible→fort), conseils, avertissement HIBP.
- Admin nag : texte de la bannière + CTA.

## Hors scope Sprint B

- WebAuthn / Passkeys → potentiellement jamais.
- SMS 2FA (coût + SIM-swap) → non.
- 2FA pour comptes Google-only → s'appuie sur Google (décision #2).
- Notifications email à chaque nouveau login depuis un appareil inconnu → Sprint C (audit log) éventuel.
- Audit log + page admin de gestion des comptes → **Sprint C**.

## Risques & mitigations

| Risque | Mitigation |
|---|---|
| Lock-out 2FA (perte app + codes) | Fallback email à usage unique (décision #3) |
| Secret TOTP exposé si DB fuit | Chiffrement AES-GCM au repos via AUTH_SECRET |
| Brute-force du code TOTP | Rate-limit 5/15min + fenêtre étroite ±1 step |
| Metadata OAuth non capturées (adapter) | Override `createSession` de l'adapter + UPDATE post-insert depuis headers |
| HIBP API indisponible | Fail-open, jamais bloquant |
| `last_seen_at` à chaque requête = charge DB | Throttle 15 min (skip update si récent) |
| Migration 0015 cassée en prod | Purement additive (ADD COLUMN + CREATE TABLE), idempotente via applier existant |

## Validation finale (checklist post-deploy)

- [ ] Migration `0015` appliquée local + prod
- [ ] `otplib` + `qrcode` build OK sur Vercel (server runtime)
- [ ] Smoke : activer 2FA → logout → login demande le code → OK ; tester un recovery code ; tester le fallback email
- [ ] Smoke : liste de sessions affiche ville (prod, headers Vercel) ; "déconnecter les autres" fonctionne
- [ ] Smoke : strength meter + avertissement HIBP sur sign-up/reset
- [ ] Bannière nag visible sur compte admin sans 2FA
- [ ] Tests unit + e2e passent
- [ ] Politique de confidentialité mentionne le stockage IP des sessions

## Effort estimé

| Bloc | Jours |
|---|---|
| Schema + migration + helpers (totp, recovery, hibp, strength, pending, metadata) | 1 |
| Server actions (9) + branche signInWithPassword + override adapter | 1.5 |
| 2 email templates ×4 locales | 0.25 |
| Pages (`/sign-in/2fa`, `/disable-2fa/[token]`) + 2 blocs profil + meter + nag | 1.5 |
| Rate-limit + i18n ×4 locales | 0.5 |
| Tests unit + e2e | 0.75 |
| **Total** | **~5.5 jours** |

Sous forme d'un seul plan d'implémentation à la writing-plans (~22-26 tâches).

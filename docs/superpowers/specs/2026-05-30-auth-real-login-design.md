# Real Login & Register — design

**Date :** 2026-05-30
**Statut :** validé (brainstorming session)
**Précède :** `docs/superpowers/plans/2026-05-30-auth-real-login.md` (à écrire)

## Contexte

Au Fil des Saveurs utilise actuellement NextAuth v5 avec un seul provider Resend (magic-link). Pas de mot de passe, pas d'OAuth, une seule page `/sign-in` qui sert à la fois de sign-in et de sign-up implicite (le DrizzleAdapter crée le user au premier magic-link).

La cliente prépare un launch commercial et veut un **vrai login + register** avec mot de passe, plus OAuth Google. Le sprint Login Polish livré le 30 mai (5 commits) a polish la surface existante (template React Email, sidebar i18n, header user dropdown, rate-limit DB, signOut localisé) mais ne change pas le modèle auth. Ce design remplace le magic-link.

État pertinent existant :
- NextAuth v5 + DrizzleAdapter + DB sessions (`session: { strategy: "database" }`)
- Schéma `users` : id, name, email (UNIQUE), email_verified, image, role (`customer|b2b|admin`), preferred_locale (`fr|nl|de|en`), newsletter_opt_in, created_at, last_login_at — **pas de password column**
- Tables `accounts`, `sessions`, `verification_tokens` (NextAuth standard) — `accounts` vide en pratique (aucun OAuth provider)
- Table `auth_rate_limit_hits` (livrée le 30 mai, migration 0012)
- Checkout **guest-friendly** : panier accepté via `cart_session_token` cookie ; créer un compte n'est pas obligatoire pour acheter
- B2B existe via `/entreprises` (form → `b2b_quote_requests`, admin promote à `role=b2b` manuellement)
- 4 locales (fr/nl/de/en), URL prefix obligatoire
- Header user dropdown + AccountSidebar i18n livrés

## Décisions validées (brainstorming)

| # | Question | Décision |
|---|----------|----------|
| 1 | Magic-link : remplacer ou coexister ? | **Remplacer complètement** |
| 2 | OAuth providers ? | **Google uniquement** |
| 3 | Email verification : bloquante ? | **Souple** — compte actif immédiat, badge si non vérifié |
| 4 | Champs au register ? | **Minimaliste** — email + password + CGV + newsletter opt |
| 5 | B2B : on touche ? | **Inchangé** — reste sur `/entreprises` + admin promote |
| 6 | Stratégie sessions ? | **DB sessions** — server action custom `signInWithPassword` qui INSERT dans `sessions` table |

## Architecture

### Schéma DB (1 migration, `0013_auth_password`)

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "token" text PRIMARY KEY,            -- sha256(rawToken)
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" ("user_id");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" ("expires_at");
```

`password_hash` reste **nullable** : un user OAuth-only n'a pas de password.

La table `verification_tokens` (NextAuth standard) est **réutilisée** pour les liens d'email-verification post-register : identifier = email, token = sha256(rawToken), expires = NOW + 24h.

La table `sessions` reste utilisée (notre custom signInWithPassword INSERT y crée des rows).

### Providers NextAuth (`lib/auth.ts`)

```ts
providers: [
  Google({
    clientId: env.AUTH_GOOGLE_ID,
    clientSecret: env.AUTH_GOOGLE_SECRET,
    allowDangerousEmailAccountLinking: true, // Google verify l'email, safe
  }),
],
session: { strategy: "database" }, // inchangé
```

Le provider Resend est **supprimé**. Le flow email+password ne passe **pas** par un Credentials provider (incompatible avec DB sessions) — il passe par notre server action.

### Server actions (`lib/actions/auth.actions.ts`)

| Action | Signature | Rate-limit |
|--------|-----------|------------|
| `registerWithPassword` | `{ email, password, confirmPassword, acceptTerms, newsletterOptIn, locale }` | 3/email + 5/IP / 15 min |
| `signInWithPassword` | `{ email, password, callbackUrl? }` | 3/email + 10/IP / 15 min (existant) |
| `requestPasswordReset` | `{ email }` | 3/email + 5/IP / 15 min |
| `resetPassword` | `{ token, newPassword, confirmPassword }` | 5/IP / 15 min |
| `resendEmailVerification` | (depuis session) | 3/user / 15 min |
| `verifyEmail` | `{ token }` | pas de rate-limit (idempotent) |
| `changePassword` | `{ currentPassword, newPassword, confirmPassword }` (auth required) | 5/user / 15 min |
| `signOutAction` | `(locale)` | aucun (existant) |

Validation zod stricte au début de chaque action.

### Helpers

**`lib/auth/password.ts`**
```ts
hashPassword(plain: string): Promise<string>
verifyPassword(plain: string, hash: string): Promise<boolean>
```
Argon2id (paramètres OWASP 2024 : memory=19 MiB, iterations=2, parallelism=1). Package `@node-rs/argon2` (binaire natif rapide, Vercel-compatible).

**`lib/auth/session.ts`**
```ts
createDbSession(userId: string): Promise<void>
// génère sessionToken (crypto.randomBytes 32 → base64url),
// INSERT into sessions (sessionToken, userId, expires: NOW + 30 days),
// cookies().set("authjs.session-token", sessionToken, { httpOnly, secure: prod, sameSite: "lax", path: "/", expires })
destroyCurrentSession(): Promise<void>
// lit le cookie, DELETE from sessions, clear cookie
```

Cookie name `authjs.session-token` (prod : `__Secure-authjs.session-token`) — aligné sur NextAuth pour qu'`auth()` continue de lire la même cookie.

**`lib/auth/tokens.ts`**
```ts
generateRawToken(): string          // crypto.randomBytes(32).toString("base64url")
hashToken(raw: string): string      // sha256 hex
```

### Pages & routes

```
app/[locale]/(shop)/
  sign-in/page.tsx                 (refonte)
  sign-up/page.tsx                 (nouveau)
  forgot-password/page.tsx         (nouveau)
  reset-password/[token]/page.tsx  (nouveau)
  verify-email/[token]/page.tsx    (nouveau)
app/[locale]/(account)/compte/
  profil/page.tsx                  (nouveau)
```

Tous les écrans suivent le style brand existant (cream `#fbf6ee`, Logo wordmark en haut, card blanche centrée max-w 480px, FormField primitive, erreurs en `role="alert"` terracotta).

## Pages — détail UI

### `/sign-in` (refonte)
```
[Logo wordmark]
Se connecter
> Email                              autocomplete="username"
> Mot de passe   [Mot de passe oublié ?]  autocomplete="current-password"
[ Se connecter → ]                   (bouton honey)
─── ou ───
[ G  Continuer avec Google ]         (bouton outline + logo G)
Pas encore de compte ? [S'inscrire]
```
Query params honorés : `?error=invalid|rate-limit|oauth-error`, `?callbackUrl=...` (whitelist internal paths), `?reset=ok` (toast vert "Mot de passe mis à jour"), `?verified=ok`.

### `/sign-up` (nouveau)
```
[Logo wordmark]
Créer un compte
> Email                              autocomplete="email"
> Mot de passe (min 12 caractères)   autocomplete="new-password"
> Confirmer le mot de passe          autocomplete="new-password"
☐ J'accepte les CGV et la politique de confidentialité *
☐ Recevoir la newsletter Au Fil des Saveurs (optionnel)
[ Créer mon compte → ]
─── ou ───
[ G  Continuer avec Google ]
Déjà un compte ? [Se connecter]
```
À l'envoi succès : compte créé + connecté + redirect `/{locale}/compte?welcome=1`. Toast info "Vérifie ton email pour confirmer ton adresse — on vient de te l'envoyer".

### `/forgot-password` (nouveau)
```
[Logo wordmark]
Mot de passe oublié ?
Saisis ton adresse, on t'envoie un lien pour le réinitialiser.
> Email
[ Envoyer le lien → ]
```
Toujours redirige vers `/forgot-password?sent=1` avec message générique `Si un compte existe avec cet email, tu recevras un lien dans quelques instants.` — pas de user enumeration.

### `/reset-password/[token]` (nouveau)
- Server component : vérifie token. Si invalide ou expiré, affiche écran `Lien expiré ou déjà utilisé` + bouton retour vers `/forgot-password`.
- Si valide :
  ```
  [Logo wordmark]
  Nouveau mot de passe
  > Mot de passe (min 12)
  > Confirmer
  [ Mettre à jour → ]
  ```
- Après succès : DELETE toutes les `sessions` de cet user (force re-login partout), redirect `/sign-in?reset=ok`.

### `/verify-email/[token]` (nouveau)
- Server component : verify token, UPDATE `users.email_verified = NOW()` si valide, DELETE verification_tokens row.
- Si valide : redirect `/{locale}/compte?verified=ok`.
- Si invalide/expiré : écran `Lien expiré ou déjà utilisé` + bouton "Renvoyer un email" (form qui appelle `resendEmailVerification` si connecté, sinon redirect sign-in).

### `/compte/profil` (nouveau)
- Bloc **Mot de passe** : `currentPassword` + `newPassword` + `confirm`. Server action `changePassword`. Si le user est OAuth-only (pas de password_hash), affiche à la place "Tu te connectes via Google. Pour ajouter un mot de passe, [demande un lien de réinitialisation]." → CTA vers `/forgot-password`.
- Bloc **Comptes liés** : "Google : ✓ Lié" ou "Google : [Lier]" (bouton → `signIn("google", { callbackUrl: "/compte/profil" })`).
- Bloc **Préférences** : dropdown `preferredLocale`, toggle `newsletterOptIn`. Server action `updateProfile`.
- Bloc **Email** : affiche email actuel + bouton "Changer" disabled avec mention "(bientôt)" — out of scope v1.

### Bandeau dans `/compte` si `email_verified = null`
Une ligne discrète tout en haut du dashboard, fond `honey-cream`, texte `warm-brown` :
```
📬 Vérifie ton adresse email — [Renvoyer un lien]
```
Le bouton est un form qui call `resendEmailVerification`. Disparait dès `email_verified` set.

### Header user dropdown (livré 30 mai)
On ajoute un item `Profil` → `/compte/profil`, entre `Subscription` et `signOut`. Clé i18n `account.nav.profile`.

## Data flows

### Register email/password
```
form submit → registerWithPassword({email, password, confirm, acceptTerms, optIn, locale})
  → zod validate (email format, password length ≥ 12, confirm match, acceptTerms === true)
  → rate-limit check per email + per IP
  → SELECT user WHERE email = lowercase(email)
      ├─ existe + password_hash NOT NULL → error "Cet email est déjà utilisé"
      ├─ existe + password_hash IS NULL  → error "Connecte-toi avec Google ou réinitialise ton mot de passe" + CTA forgot-password
      └─ n'existe pas → continue
  → hashPassword(password) [argon2id]
  → INSERT users (email, password_hash, preferred_locale=locale, newsletter_opt_in, role='customer')
  → generateRawToken → INSERT verification_tokens (identifier=email, token=hash(raw), expires=NOW+24h)
  → sendEmail(VerifyEmailTemplate({locale, url=/{locale}/verify-email/{raw}}))
  → createDbSession(newUserId)
  → return { ok: true, redirectTo: `/${locale}/compte?welcome=1` }
```
La page client redirect via `useRouter().push()` ou la server action redirect direct (à finaliser dans le plan).

### Sign-in email/password
```
form submit → signInWithPassword({email, password, callbackUrl?})
  → zod validate
  → rate-limit check per email + per IP
  → SELECT user WHERE email = lowercase(email)
      ├─ null → return generic error "Email ou mot de passe incorrect" (jamais leak)
      ├─ password_hash IS NULL → "Ce compte utilise Google. Connecte-toi avec Google ou réinitialise ton mot de passe."
      └─ continue
  → verifyPassword(password, hash)
      ├─ false → generic error
      └─ true  → continue
  → createDbSession(user.id)
  → UPDATE users SET last_login_at = NOW() WHERE id = user.id
  → redirect to whitelist(callbackUrl) || /{locale}/compte
```

`callbackUrl` whitelist : doit commencer par `/` et ne pas être `//` ni un protocole. Tout le reste tombe sur `/compte`.

### Google OAuth
```
click "Continuer avec Google" → signIn("google", { callbackUrl })
  → NextAuth redirect Google consent
  → callback handled by NextAuth + DrizzleAdapter
      ├─ user existe avec même email → adapter link account row (allowDangerousEmailAccountLinking)
      └─ n'existe pas → adapter CREATE user (email_verified=NOW car Google verify, role='customer', preferred_locale='fr' par défaut)
  → adapter INSERT session row
  → NextAuth set cookie
  → redirect callbackUrl || /{locale}/compte
```

Note : les users créés via Google ont `password_hash = NULL` et `name`/`image` remplis depuis Google.

### Forgot password
```
form submit → requestPasswordReset({email})
  → rate-limit (per email + per IP)
  → SELECT user WHERE email = lowercase(email)
      ├─ null → continue silently (pas de leak)
      └─ found → generateRawToken, INSERT password_reset_tokens (token=hash(raw), userId, expires=NOW+1h)
                 sendEmail(PasswordResetTemplate({locale, url=/{locale}/reset-password/{raw}}))
  → always return generic success message
```

### Reset password
```
GET /[locale]/reset-password/[token]:
  → SELECT password_reset_tokens WHERE token = hash(rawToken) AND expires_at > NOW()
      ├─ null → render <ExpiredScreen/>
      └─ found → render <ResetForm token={raw}/>

POST → resetPassword({token, newPassword, confirm})
  → zod validate
  → SELECT password_reset_tokens WHERE token = hash(token) AND expires_at > NOW() (re-check)
      ├─ null → error
      └─ found
  → hashPassword(newPassword)
  → TRANSACTION:
      UPDATE users SET password_hash = ? WHERE id = token.user_id
      DELETE password_reset_tokens WHERE user_id = token.user_id  -- nuke ALL pending for this user
      DELETE sessions WHERE user_id = token.user_id               -- force re-login partout
  → sendEmail(PasswordChangedTemplate) -- security advisory
  → redirect /{locale}/sign-in?reset=ok
```

### Email verification
```
GET /[locale]/verify-email/[token]:
  → SELECT verification_tokens WHERE token = hash(rawToken) AND expires > NOW()
      ├─ null → render <ExpiredScreen/>
      └─ found
  → TRANSACTION:
      UPDATE users SET email_verified = NOW() WHERE email = row.identifier
      DELETE verification_tokens WHERE identifier = row.identifier
  → redirect /{locale}/compte?verified=ok
```

## Error handling

**Generic errors (anti user-enumeration)**
- Sign-in raté : toujours `"Email ou mot de passe incorrect"` (jamais "cet email n'existe pas")
- Forgot password : toujours `"Si un compte existe avec cet email, tu recevras un lien dans quelques instants."`
- Register : exception assumée — `"Cet email est déjà utilisé."` ; un attaquant peut déjà tester l'existence d'un compte en tentant un register, accepté

**Form validation**
- Zod côté server (canonique). Erreurs renvoyées via `{ field: "password", message: "..." }`, rendues sous l'input.
- Côté client, validation HTML5 minimale (`required`, `type="email"`, `minLength=12`) pour UX immédiate.
- Password strength visuel optionnel (barre verte/jaune/rouge) — out of scope v1.

**Open redirect protection** sur `callbackUrl`
```ts
function safeCallback(raw: string | null, locale: string): string {
  if (!raw) return `/${locale}/compte`;
  if (!raw.startsWith("/") || raw.startsWith("//")) return `/${locale}/compte`;
  if (/^\/[a-z]{2}\//i.test(raw)) return raw;        // /fr/... etc.
  return `/${locale}${raw}`;
}
```

**OAuth errors** sont redirigés vers `/{locale}/sign-in?error=oauth-error` (`OAuthAccountNotLinked`, `Verification`, etc.).

## Edge cases

| Cas | Comportement |
|-----|--------------|
| User OAuth-only tente sign-in password | Message dédié + CTA forgot-password (set un password sur le compte existant) |
| User password tente Google sur même email | Auto-link via `allowDangerousEmailAccountLinking` (Google verify l'email, safe) |
| Session expire ou cookie invalide | `auth()` retourne null, les page-protected redirect `/sign-in?callbackUrl=...` |
| Token reset utilisé 2× | 2e tentative trouve token déjà DELETE → écran "expired" |
| Multiple tabs après reset password | DELETE de toutes les sessions force re-login partout (volontaire, sécurité) |
| Email change après register | Out of scope v1 (mais designé pour : ajouter route `change-email/[token]` plus tard) |
| User supprime son compte | Out of scope v1 (à ajouter v2 — RGPD "right to be forgotten") |

## Migration users existants

Avant deploy :
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM users WHERE email_verified IS NOT NULL;
```

Probablement **0–2 users** (pre-launch). Script `scripts/notify-users-set-password.mjs` :
```js
for (const user of usersWithoutPasswordHash) {
  await requestPasswordReset({ email: user.email });  // réutilise le flow standard
}
```

Les users qui ne cliquent jamais leur lien : leur compte reste accessible via Google si email correspond (auto-link), sinon ils peuvent toujours utiliser "Mot de passe oublié" plus tard. Aucune perte.

## Email templates (4 nouveaux, en 4 langues)

| Template | Quand | Contenu |
|----------|-------|---------|
| `VerifyEmailTemplate` | au register | "Confirme ton adresse — clic ici (lien expire 24h)" |
| `PasswordResetTemplate` | au forgot | "Tu as demandé un nouveau mot de passe — clic ici (lien expire 1h)" |
| `WelcomeEmailTemplate` | au register (peut être fusionné avec verify) | "Bienvenue chez Au Fil des Saveurs" + lien `/biscuits` |
| `PasswordChangedTemplate` | après reset | "Ton mot de passe vient d'être modifié. Si ce n'est pas toi, contacte-nous." |

Pattern existant : composants React simples dans `components/email/*.tsx`, props `{ locale, ...payload }`. Le composant retourne du JSX différent selon `locale`. Envoyés via `lib/email/client.sendEmail()` (existant).

## Rate limiting

Tableau `auth_rate_limit_hits` réutilisé. Helper `lib/auth/rate-limit.ts` (existant) prend une `action: 'sign-in' | 'register' | 'forgot' | 'reset'` paramètre pour préfixer l'identifier (`signin:user@example.com`, `register:user@example.com`, etc.) afin que les windows soient distincts. À adapter (l'actuel ne préfixe pas — il ratelimite globalement).

Limites :
| Action | Per email | Per IP |
|--------|-----------|--------|
| sign-in | 3 / 15 min | 10 / 15 min (existant) |
| register | 3 / 15 min | 5 / 15 min |
| forgot | 3 / 15 min | 5 / 15 min |
| reset (token submit) | — | 5 / 15 min |
| change-password (authenticated) | 5 / user / 15 min | — |

Pas de rate-limit sur Google OAuth (Google le fait).

## Sécurité

- **Argon2id**, paramètres OWASP 2024 (m=19 MiB, t=2, p=1). Package `@node-rs/argon2` (binaire natif, fonctionne sur Vercel Node 24).
- **Tokens** : `crypto.randomBytes(32).toString("base64url")` côté URL, `sha256` hex stocké en DB. Comparaison `timingSafeEqual`.
- **Cookies** : `httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: "lax"`, `path: "/"`. Prefix `__Secure-` en prod. Nom `authjs.session-token` pour aligner avec NextAuth.
- **HTTPS-only en prod** : Vercel le fait.
- **CSRF** : server actions Next.js ont une protection built-in (origin check + same-site cookies).
- **Logs** : jamais de password en clair, jamais de raw token (logs uniquement le hash ou les `userId`).

## Tests

### Unitaires (vitest)
- `lib/auth/password.test.ts` : hash + verify round-trip, hash diff à chaque call, verify rejette wrong password
- `lib/auth/tokens.test.ts` : generateRawToken length + entropy, hashToken déterministe, round-trip raw → hash
- `lib/auth/session.test.ts` : createDbSession génère sessionToken unique, insert avec expires bien future
- `lib/auth/rate-limit.test.ts` : variants par action (sign-in vs register)
- `lib/actions/auth.actions.test.ts` : zod validation, branches (user existe / pas existe / OAuth-only)

### Playwright e2e (3 specs)
- `tests/e2e/auth-register.spec.ts` : email vide, password trop court, password mismatch, CGV pas cochés, register OK → /compte avec bandeau verify visible
- `tests/e2e/auth-signin.spec.ts` : email inconnu (generic), wrong password (generic), rate-limit déclenché (3 attempts), sign-in OK + redirect callbackUrl preserved
- `tests/e2e/auth-reset.spec.ts` : forgot → URL extraite (mock Resend ou intercept), reset avec token expiré (UPDATE expires_at en arrière), reset OK → sign-in OK avec nouveau password

Le test e2e du Google OAuth est out of scope (nécessite un Google test account et un setup complexe). Suffit de tester manuellement.

## Configuration env vars (à set dans Vercel)

```
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Inchangées : `AUTH_SECRET`, `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`, `DATABASE_URL`.

Setup Google Cloud Console : créer un OAuth 2.0 Client ID type Web, redirect URI `https://beecuit.vercel.app/api/auth/callback/google` (et `http://localhost:3000/api/auth/callback/google` en dev).

## Effort estimé

| Bloc | Jours |
|------|-------|
| Schema + migration + helpers (password, tokens, session) | 1 |
| Server actions register + sign-in + signOut alignment | 1 |
| Pages sign-in (refonte) + sign-up + forgot + reset | 1 |
| Google OAuth integration + page link Google dans profil | 0.5 |
| Email verification flow (route + bandeau + resend) | 0.5 |
| Email templates × 4 × 4 locales | 1 |
| `/compte/profil` page + changePassword + updateProfile | 0.5 |
| Tests unitaires + e2e | 1 |
| i18n keys cleanup (drop magic-link, add new keys × 4 lang) | 0.5 |
| Rate-limit refactor (per-action prefix) | 0.5 |
| Migration script users existants + smoke | 0.5 |
| **Total** | **~8 jours** |

Sprint multi-PR ou un seul PR — à décider au moment du plan.

## Hors scope v1

- Email change (route, verification du nouvel email)
- Account deletion + RGPD purge complète
- 2FA / TOTP
- Password strength meter visuel
- Liste de common passwords (haveibeenpwned check)
- Magic-link en option secondaire
- Apple Sign-In
- Tests e2e Google OAuth (manual seulement)
- Audit log des sign-in / sign-out / password change
- Session list dans `/compte/profil` ("3 appareils connectés — déconnecter tout")

Tout ça reste **ajoutable post-launch** sans refactor majeur car la structure DB et les helpers sont prévus pour.

## Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Bug sur le password hash → comptes inaccessibles | Tests unitaires round-trip + script `scripts/auth-smoke.mjs` qui crée un user, sign-in, sign-out, sign-in (sur Neon dev) avant merge |
| OAuth Google mal configuré | Smoke manuel en dev + preview avant prod ; documenter le setup Google Cloud Console dans `docs/auth-setup.md` |
| Migration `0013` cassée en prod | Migration idempotente (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`), applier `scripts/apply-pending-migrations.mjs` existant gère les "already exists" |
| Race condition double-register même email | Constraint UNIQUE sur `users.email` existe déjà → 2e INSERT échoue cleanly, l'action renvoie "Cet email est déjà utilisé" |
| User reset password puis garde la session active sur autre tab | Voulu : DELETE all sessions à la reset action force re-login partout |
| User OAuth essaie sign-in password sans piger | Message dédié + CTA forgot-password qui set un password (parcours fluide) |
| Sortie de magic-link casse les rares users existants | Script `notify-users-set-password.mjs` envoie un reset-link à tous les users sans password_hash avant deploy |

## Validation finale

Après deploy :
- [ ] Migration `0013` appliquée sur Neon dev + prod
- [ ] Env vars `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` set en prod
- [ ] OAuth redirect URI ajouté dans Google Cloud Console pour prod ET preview Vercel
- [ ] Smoke manuel : register email/password + verify email + sign-out + sign-in + forgot + reset + Google
- [ ] Tests Playwright e2e passent en CI
- [ ] 4 email templates rendent bien en aperçu Resend (dev pre-flight)
- [ ] Bandeau "Vérifie ton email" visible si non-vérifié, invisible après
- [ ] Header dropdown : item "Profil" présent
- [ ] AccountSidebar : "Profil" présent ou pas (à arbitrer — probablement pas, accessible via dropdown suffit)

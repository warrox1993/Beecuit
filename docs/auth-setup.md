# Auth setup — Google OAuth

## Why
We rely on email+password as the primary login. Google is offered as a one-tap option that auto-creates / auto-links a user.

## Google Cloud Console (one-time)

1. Open https://console.cloud.google.com/apis/credentials
2. Create a new project (or reuse an existing one). Name suggestion: `au-fil-des-saveurs-auth`.
3. *OAuth consent screen* → user type *External* → fill app name, support email, developer contact. Scopes: `email`, `profile`, `openid`. Save.
4. *Credentials* → *Create credentials* → *OAuth client ID* → *Web application*.
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://beecuit.vercel.app/api/auth/callback/google`
   - `https://<branch>.vercel.app/api/auth/callback/google` (every preview deployment that needs OAuth — wildcard subdomains aren't allowed; add explicitly as needed)
   - `https://aufildessaveurs.be/api/auth/callback/google` (when domain wired)
6. Copy the generated `Client ID` and `Client Secret`.

## Vercel env vars

```
AUTH_GOOGLE_ID=<client-id>
AUTH_GOOGLE_SECRET=<client-secret>
```

Set both for *Production*, *Preview*, and *Development* targets.

## Local dev

Add to `.env.local`:
```
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

If unset, the Google button is hidden (provider array is empty).

## Smoke

1. `pnpm dev`
2. Go to `/fr/sign-in`, click *Continuer avec Google*.
3. Google consent screen → accept → land on `/fr/compte`.
4. Verify a row was created in `users` (email_verified set), one in `accounts` (provider=google), one in `sessions`.

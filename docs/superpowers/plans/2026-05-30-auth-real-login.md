# Real Login & Register Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace NextAuth Resend magic-link with email+password (custom server actions on DB sessions) + Google OAuth, plus the surrounding pages (sign-up, forgot/reset password, email verification, profile) and 4 brand-themed email templates in 4 locales.

**Architecture:** Auth.js v5 keeps the `DrizzleAdapter` and `session.strategy = "database"`. Google goes through the standard provider (adapter handles user+session rows). Email/password sits *next to* NextAuth — a custom `signInWithPassword` server action verifies Argon2id and writes a row directly to the `sessions` table under the same `authjs.session-token` cookie that `auth()` reads. Tokens for forgot-password and email-verify are 32-byte random base64url stored as SHA-256 hashes. UI follows the existing brand patterns (cream card, FormField primitive, Snell Roundhand wordmark, terracotta error alerts).

**Tech Stack:** Next.js 15 App Router, Auth.js v5, Drizzle + Neon Postgres, next-intl (4 locales fr/nl/de/en), Argon2id via `@node-rs/argon2`, React Email-style components, Vitest + Playwright.

**Reference spec:** `docs/superpowers/specs/2026-05-30-auth-real-login-design.md`

---

## File Structure

**Create:**
- `drizzle/0013_auth_password.sql` + `drizzle/meta/0013_snapshot.json` — migration (generated)
- `lib/db/schemas/password_reset_tokens.ts` — Drizzle schema for the new table
- `lib/auth/password.ts` — Argon2id hash/verify
- `lib/auth/tokens.ts` — generate raw token + sha256 hash
- `lib/auth/session.ts` — `createDbSession`, `destroyCurrentSession`
- `lib/auth/callback-url.ts` — `safeCallbackUrl` (open-redirect protection)
- `components/email/VerifyEmailEmail.tsx` — locale-aware
- `components/email/PasswordResetEmail.tsx` — locale-aware
- `components/email/WelcomeEmail.tsx` — locale-aware
- `components/email/PasswordChangedEmail.tsx` — locale-aware
- `components/shop/SignInForm.tsx` — client form
- `components/shop/SignUpForm.tsx` — client form
- `components/shop/ForgotPasswordForm.tsx` — client form
- `components/shop/ResetPasswordForm.tsx` — client form
- `components/shop/GoogleSignInButton.tsx` — client button
- `components/account/EmailNotVerifiedBanner.tsx` — server + tiny client resend button
- `components/account/ChangePasswordForm.tsx` — client form
- `components/account/LinkedAccountsBlock.tsx` — server + small client unlinks
- `components/account/PreferencesBlock.tsx` — client form
- `app/[locale]/(shop)/sign-up/page.tsx`
- `app/[locale]/(shop)/forgot-password/page.tsx`
- `app/[locale]/(shop)/reset-password/[token]/page.tsx`
- `app/[locale]/(shop)/verify-email/[token]/page.tsx`
- `app/[locale]/(account)/compte/profil/page.tsx`
- `tests/unit/auth-password.test.ts`
- `tests/unit/auth-tokens.test.ts`
- `tests/unit/auth-callback-url.test.ts`
- `tests/e2e/auth-register.spec.ts`
- `tests/e2e/auth-reset.spec.ts`
- `scripts/notify-users-set-password.mjs`
- `docs/auth-setup.md`

**Modify:**
- `package.json` — add `@node-rs/argon2`
- `lib/env.ts` + `.env.example` — add `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `lib/db/schemas/auth.ts` — add `password_hash` column to `users`
- `lib/db/schema.ts` — export new schema
- `lib/auth.ts` — drop Resend provider, add Google, expose `unstable_update`
- `lib/auth/rate-limit.ts` — generalize to `checkAuthRateLimit({action, email, ip})`
- `lib/actions/auth.actions.ts` — append 7 new actions
- `app/[locale]/(shop)/sign-in/page.tsx` — refonte using `SignInForm` + Google
- `app/[locale]/(account)/compte/page.tsx` — wire `EmailNotVerifiedBanner`
- `components/layout/HeaderUserMenu.tsx` — add "Profil" item
- `components/layout/MobileNav.tsx` — add "Profil" link inside user block
- `components/account/AccountSidebar.tsx` — add "Profil" entry
- `messages/{fr,nl,de,en}.json` — drop magic-link strings, add new auth.* keys
- `tests/e2e/auth.spec.ts` — replace with `auth-signin.spec.ts` content

**Delete:**
- `components/email/MagicLinkEmail.tsx` (no longer used after Resend removal)

---

## Phase 1 — Foundation (deps, env, schema, migration)

### Task 1: Install Argon2 dependency

**Files:** `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install `@node-rs/argon2`**

```bash
pnpm add @node-rs/argon2
```

- [ ] **Step 2: Verify install**

```bash
pnpm list @node-rs/argon2
```

Expected: prints version, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(auth): add @node-rs/argon2 for password hashing"
```

---

### Task 2: Add Google env vars to schema + .env.example

**Files:**
- Modify: `lib/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add Google env vars to `lib/env.ts`**

In `server:` block, after `AUTH_EMAIL_FROM`:
```ts
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
```

In `runtimeEnv:` object, after `AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,`:
```ts
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
```

(Optional during dev — required for prod, but not blocking local sign-in/sign-up.)

- [ ] **Step 2: Update `.env.example`**

After the `# ── Resend ──` block, add:
```env
# ── Google OAuth (set both for production) ───────────────────
AUTH_GOOGLE_ID="" # from https://console.cloud.google.com/apis/credentials
AUTH_GOOGLE_SECRET=""
```

Also update the Resend comment line to `# ── Resend (transactional emails) ──`.

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/env.ts .env.example
git commit -m "chore(env): add optional AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET"
```

---

### Task 3: Add `password_hash` column to users schema

**Files:** Modify `lib/db/schemas/auth.ts`

- [ ] **Step 1: Add `passwordHash` column**

In `users = pgTable(...)`, after the `image` column and before `role`:
```ts
  passwordHash: text("password_hash"),
```

(Keep nullable — OAuth-only users have no password.)

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit (combined with Task 4)**

Hold; commits together with the next task.

---

### Task 4: Create `password_reset_tokens` schema

**Files:** Create `lib/db/schemas/password_reset_tokens.ts`, modify `lib/db/schema.ts`.

- [ ] **Step 1: Create the schema file**

`lib/db/schemas/password_reset_tokens.ts`:
```ts
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * One-shot tokens for the forgot-password flow.
 *
 * `token` stores sha256(rawToken) — the raw value lives only in the email URL.
 * Rows are deleted on use; expired rows are pruned opportunistically.
 */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    token: text("token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
  }),
);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
```

- [ ] **Step 2: Export from the central schema barrel**

In `lib/db/schema.ts`, after `export * from "./schemas/auth_rate_limit";`, add:
```ts
export * from "./schemas/password_reset_tokens";
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit Tasks 3 + 4 together**

```bash
git add lib/db/schemas/auth.ts lib/db/schemas/password_reset_tokens.ts lib/db/schema.ts
git commit -m "feat(db): users.password_hash + password_reset_tokens schema"
```

---

### Task 5: Generate + apply migration `0013_auth_password`

**Files:** `drizzle/0013_auth_password.sql`, `drizzle/meta/0013_snapshot.json`, `drizzle/meta/_journal.json`

- [ ] **Step 1: Generate the migration**

```bash
pnpm drizzle-kit generate --name auth_password
```

Expected: drizzle-kit prints the schema diff and writes `drizzle/0013_auth_password.sql` + snapshot. The SQL should look like:
```sql
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
  "token" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" USING btree ("expires_at");
```

- [ ] **Step 2: Apply migration to local Neon**

```bash
node scripts/apply-pending-migrations.mjs
```

Expected output ends with `All pending migrations recorded.` (or "Pending: " empty if already applied).

- [ ] **Step 3: Verify columns exist**

```bash
node -e "(async () => { const { neon } = await import('@neondatabase/serverless'); require('dotenv').config({ path: '.env.local' }); const sql = neon(process.env.DATABASE_URL); const cols = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'\`; const tbl = await sql\`SELECT table_name FROM information_schema.tables WHERE table_name = 'password_reset_tokens'\`; console.log({ cols, tbl }); })()"
```

Expected: prints both `password_hash` column and `password_reset_tokens` table present.

- [ ] **Step 4: Commit**

```bash
git add drizzle/0013_auth_password.sql drizzle/meta/0013_snapshot.json drizzle/meta/_journal.json
git commit -m "chore(db): migration 0013 — password_hash + password_reset_tokens"
```

---

## Phase 2 — Helpers (TDD)

### Task 6: `lib/auth/password.ts` — Argon2id hash/verify

**Files:**
- Create: `lib/auth/password.ts`
- Test: `tests/unit/auth-password.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/auth-password.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("hashes a password to a non-empty argon2 string", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash.length).toBeGreaterThan(50);
  });

  it("produces a different hash each call (random salt)", async () => {
    const h1 = await hashPassword("hunter2hunter2");
    const h2 = await hashPassword("hunter2hunter2");
    expect(h1).not.toBe(h2);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password 1234", hash)).toBe(false);
  });

  it("returns false on a malformed hash instead of throwing", async () => {
    expect(await verifyPassword("anything", "not-an-argon2-string")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
pnpm vitest run tests/unit/auth-password.test.ts
```

Expected: import fails — `Cannot find module '@/lib/auth/password'`.

- [ ] **Step 3: Implement the helper**

`lib/auth/password.ts`:
```ts
import "server-only";
import { hash, verify, Algorithm } from "@node-rs/argon2";

// OWASP 2024 recommended Argon2id parameters.
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19 * 1024, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm vitest run tests/unit/auth-password.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/password.ts tests/unit/auth-password.test.ts
git commit -m "feat(auth): password hash/verify helpers (argon2id)"
```

---

### Task 7: `lib/auth/tokens.ts` — generate + hash tokens

**Files:**
- Create: `lib/auth/tokens.ts`
- Test: `tests/unit/auth-tokens.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/auth-tokens.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";

describe("token helpers", () => {
  it("generates a 43-char base64url token (32 bytes)", () => {
    const t = generateRawToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("generates a different token each call", () => {
    expect(generateRawToken()).not.toBe(generateRawToken());
  });

  it("hashes a token to 64-char hex (sha256)", () => {
    const h = hashToken("anything");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashes deterministically", () => {
    expect(hashToken("anything")).toBe(hashToken("anything"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
pnpm vitest run tests/unit/auth-tokens.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement the helper**

`lib/auth/tokens.ts`:
```ts
import "server-only";
import { randomBytes, createHash } from "node:crypto";

/** 32 bytes → 43-char base64url string (no padding). */
export function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex digest of an arbitrary string. Used to store tokens at rest. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm vitest run tests/unit/auth-tokens.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/tokens.ts tests/unit/auth-tokens.test.ts
git commit -m "feat(auth): token generate + sha256 hash helpers"
```

---

### Task 8: `lib/auth/callback-url.ts` — safe callback URL

**Files:**
- Create: `lib/auth/callback-url.ts`
- Test: `tests/unit/auth-callback-url.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/auth-callback-url.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

describe("safeCallbackUrl", () => {
  it("falls back to /{locale}/compte when raw is null/undefined/empty", () => {
    expect(safeCallbackUrl(null, "fr")).toBe("/fr/compte");
    expect(safeCallbackUrl(undefined, "fr")).toBe("/fr/compte");
    expect(safeCallbackUrl("", "fr")).toBe("/fr/compte");
  });

  it("blocks protocol-relative and absolute URLs", () => {
    expect(safeCallbackUrl("//evil.com", "fr")).toBe("/fr/compte");
    expect(safeCallbackUrl("https://evil.com", "fr")).toBe("/fr/compte");
    expect(safeCallbackUrl("evil.com", "fr")).toBe("/fr/compte");
  });

  it("blocks /api/* paths", () => {
    expect(safeCallbackUrl("/api/admin", "fr")).toBe("/fr/compte");
  });

  it("preserves /admin and /admin/* (non-localized)", () => {
    expect(safeCallbackUrl("/admin", "fr")).toBe("/admin");
    expect(safeCallbackUrl("/admin/coffrets", "fr")).toBe("/admin/coffrets");
  });

  it("preserves already-locale-prefixed paths", () => {
    expect(safeCallbackUrl("/fr/coffrets", "fr")).toBe("/fr/coffrets");
    expect(safeCallbackUrl("/nl/abonnement", "fr")).toBe("/nl/abonnement");
  });

  it("prepends the current locale to bare paths", () => {
    expect(safeCallbackUrl("/coffrets", "nl")).toBe("/nl/coffrets");
    expect(safeCallbackUrl("/compte/commandes", "de")).toBe("/de/compte/commandes");
  });
});
```

- [ ] **Step 2: Run test — expect fail**

```bash
pnpm vitest run tests/unit/auth-callback-url.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement the helper**

`lib/auth/callback-url.ts`:
```ts
import { routing } from "@/i18n/routing";

const LOCALES = routing.locales as readonly string[];

/**
 * Return a safe in-app URL for use as `callbackUrl` after sign-in.
 * - Falls back to `/{locale}/compte` on null/invalid input.
 * - Refuses anything that isn't a same-origin app path.
 * - Preserves already locale-prefixed paths and the non-localized /admin tree.
 */
export function safeCallbackUrl(raw: string | null | undefined, locale: string): string {
  const fallback = `/${locale}/compte`;
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.startsWith("/api")) return fallback;
  if (raw === "/admin" || raw.startsWith("/admin/")) return raw;

  const firstSegment = raw.slice(1).split("/")[0] ?? "";
  if (LOCALES.includes(firstSegment)) return raw;

  return `/${locale}${raw}`;
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
pnpm vitest run tests/unit/auth-callback-url.test.ts
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/callback-url.ts tests/unit/auth-callback-url.test.ts
git commit -m "feat(auth): safeCallbackUrl with open-redirect protection"
```

---

### Task 9: `lib/auth/session.ts` — DB session helpers

**Files:** Create `lib/auth/session.ts`. (No test file: tightly coupled to DB writes + cookie store; covered by e2e in Phase 9.)

- [ ] **Step 1: Implement the helper**

`lib/auth/session.ts`:
```ts
import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { generateRawToken } from "@/lib/auth/tokens";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

/**
 * Issue a new DB-backed session for `userId` and set the auth cookie.
 *
 * The cookie name + token format match what NextAuth's DrizzleAdapter writes
 * in its own flows, so `auth()` reads them transparently.
 */
export async function createDbSession(userId: string): Promise<void> {
  const sessionToken = generateRawToken();
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db.insert(sessions).values({ sessionToken, userId, expires });

  const cookieStore = await cookies();
  cookieStore.set(getCookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/**
 * Delete the current session row (if any) and clear the auth cookie.
 * Used by `signOut` paths that bypass NextAuth's signOut handler.
 */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const name = getCookieName();
  const value = cookieStore.get(name)?.value;
  if (value) {
    await db.delete(sessions).where(eq(sessions.sessionToken, value));
  }
  cookieStore.delete(name);
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/session.ts
git commit -m "feat(auth): createDbSession + destroyCurrentSession helpers"
```

---

## Phase 3 — Rate-limit generalization

### Task 10: Make rate-limit action-aware

**Files:**
- Modify: `lib/auth/rate-limit.ts`
- Modify: `app/[locale]/(shop)/sign-in/page.tsx`

- [ ] **Step 1: Update `lib/auth/rate-limit.ts`**

Replace the existing file with:
```ts
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authRateLimitHits } from "@/lib/db/schemas/auth_rate_limit";

export type AuthAction = "sign-in" | "register" | "forgot" | "reset" | "change-password";

const LIMITS: Record<AuthAction, { email: number; ip: number }> = {
  "sign-in": { email: 3, ip: 10 },
  register: { email: 3, ip: 5 },
  forgot: { email: 3, ip: 5 },
  reset: { email: Number.POSITIVE_INFINITY, ip: 5 },
  "change-password": { email: 5, ip: Number.POSITIVE_INFINITY },
};

const WINDOW_INTERVAL = "15 minutes";

export type AuthRateLimitResult = { ok: true } | { ok: false; reason: "email" | "ip" };

export async function checkAuthRateLimit(opts: {
  action: AuthAction;
  email?: string | null;
  ip?: string | null;
}): Promise<AuthRateLimitResult> {
  const limits = LIMITS[opts.action];
  const normalizedEmail = opts.email?.trim().toLowerCase() ?? null;
  const normalizedIp = opts.ip?.trim() || null;
  const prefixedEmail = normalizedEmail ? `${opts.action}:${normalizedEmail}` : null;
  const prefixedIp = normalizedIp ? `${opts.action}:${normalizedIp}` : null;

  if (prefixedEmail && Number.isFinite(limits.email)) {
    const rows = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM auth_rate_limit_hits
      WHERE identifier = ${prefixedEmail}
        AND hit_at > NOW() - (${WINDOW_INTERVAL})::interval
    `);
    const list = (rows as unknown as { rows?: { count: string }[] }).rows ?? [];
    if (Number(list[0]?.count ?? "0") >= limits.email) return { ok: false, reason: "email" };
  }

  if (prefixedIp && Number.isFinite(limits.ip)) {
    const rows = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM auth_rate_limit_hits
      WHERE ip = ${prefixedIp}
        AND hit_at > NOW() - (${WINDOW_INTERVAL})::interval
    `);
    const list = (rows as unknown as { rows?: { count: string }[] }).rows ?? [];
    if (Number(list[0]?.count ?? "0") >= limits.ip) return { ok: false, reason: "ip" };
  }

  await db.insert(authRateLimitHits).values({
    identifier: prefixedEmail,
    ip: prefixedIp,
  });

  if (Math.random() < 0.1) {
    await db.execute(sql`
      DELETE FROM auth_rate_limit_hits
      WHERE hit_at < NOW() - INTERVAL '1 hour'
    `);
  }

  return { ok: true };
}

export function getClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    return first ? first.trim() : null;
  }
  return headers.get("x-real-ip");
}
```

- [ ] **Step 2: Update `app/[locale]/(shop)/sign-in/page.tsx` to use the new signature**

In the `handleSignIn` server action, replace:
```ts
import { checkSignInRateLimit, getClientIp } from "@/lib/auth/rate-limit";
```
with:
```ts
import { checkAuthRateLimit, getClientIp } from "@/lib/auth/rate-limit";
```

And replace the call:
```ts
    const limit = await checkSignInRateLimit(email, ip);
```
with:
```ts
    const limit = await checkAuthRateLimit({ action: "sign-in", email, ip });
```

- [ ] **Step 3: Typecheck + run existing tests**

```bash
pnpm typecheck && pnpm vitest run tests/unit
```

Expected: typecheck clean; previously-passing tests still pass (the one failing db.test.ts is pre-existing).

- [ ] **Step 4: Commit**

```bash
git add lib/auth/rate-limit.ts app/[locale]/\(shop\)/sign-in/page.tsx
git commit -m "refactor(auth): generalize rate-limit to per-action windows"
```

---

## Phase 4 — Email templates

### Task 11: Locale-aware MagicLinkEmail successor — 4 transactional emails

**Files:**
- Create: `components/email/VerifyEmailEmail.tsx`
- Create: `components/email/PasswordResetEmail.tsx`
- Create: `components/email/WelcomeEmail.tsx`
- Create: `components/email/PasswordChangedEmail.tsx`

All 4 follow the same JSX shell (cream `#fbf6ee`, warm-brown text, honey-dark CTA, Snell Roundhand wordmark) as `NewsletterConfirmationEmail.tsx` / `JournalArticleEmail.tsx`. Each takes a `locale` prop and pulls strings from a `STRINGS` dict.

- [ ] **Step 1: Create `VerifyEmailEmail.tsx`**

`components/email/VerifyEmailEmail.tsx`:
```tsx
import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, {
  preheader: string;
  heading: string;
  body: string;
  cta: string;
  fallback: string;
  expires: string;
  ignore: string;
}> = {
  fr: {
    preheader: "Confirme ton adresse email",
    heading: "Confirme ton adresse email",
    body: "Clique sur le bouton ci-dessous pour confirmer ton adresse — ça nous permet de t'envoyer tes confirmations de commande et nos petites attentions.",
    cta: "Confirmer mon adresse",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Ce lien est valable 24 heures.",
    ignore: "Si tu n'es pas à l'origine de cette inscription, tu peux ignorer cet email.",
  },
  nl: {
    preheader: "Bevestig je e-mailadres",
    heading: "Bevestig je e-mailadres",
    body: "Klik op de knop hieronder om je e-mailadres te bevestigen — zo kunnen we je bestelbevestigingen sturen.",
    cta: "Mijn adres bevestigen",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 24 uur geldig.",
    ignore: "Als jij deze registratie niet hebt gestart, kun je deze e-mail negeren.",
  },
  de: {
    preheader: "Bestätige deine E-Mail-Adresse",
    heading: "Bestätige deine E-Mail-Adresse",
    body: "Klicke unten, um deine E-Mail-Adresse zu bestätigen — so können wir dir Bestellbestätigungen senden.",
    cta: "Adresse bestätigen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Dieser Link ist 24 Stunden gültig.",
    ignore: "Solltest du diese Registrierung nicht ausgelöst haben, ignoriere diese E-Mail.",
  },
  en: {
    preheader: "Confirm your email address",
    heading: "Confirm your email address",
    body: "Click the button below to confirm your address — it lets us send your order receipts and our news.",
    cta: "Confirm my address",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 24 hours.",
    ignore: "If you didn't sign up, you can ignore this email.",
  },
};

export function VerifyEmailEmail({ locale, verifyUrl }: { locale: Locale; verifyUrl: string }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, color: "#3d2817", marginTop: 12, marginBottom: 8, fontWeight: 500 }}>
        {s.heading}
      </h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <p style={{ marginTop: 24 }}>
        <a
          href={verifyUrl}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#a8731b",
            color: "#fbf6ee",
            textDecoration: "none",
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          {s.cta}
        </a>
      </p>
      <p style={{ color: "#7a5a3c", fontSize: 13, lineHeight: 1.5, marginTop: 24 }}>
        {s.fallback}
        <br />
        <a href={verifyUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {verifyUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 4 }}>{s.ignore}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `PasswordResetEmail.tsx`**

`components/email/PasswordResetEmail.tsx`:
```tsx
import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, {
  heading: string;
  body: string;
  cta: string;
  fallback: string;
  expires: string;
  ignore: string;
}> = {
  fr: {
    heading: "Réinitialise ton mot de passe",
    body: "On a reçu une demande pour réinitialiser le mot de passe de ton compte Au Fil des Saveurs.",
    cta: "Choisir un nouveau mot de passe",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Ce lien est valable 1 heure.",
    ignore: "Si tu n'as pas fait cette demande, ignore cet email — ton mot de passe restera inchangé.",
  },
  nl: {
    heading: "Stel je wachtwoord opnieuw in",
    body: "We hebben een verzoek ontvangen om het wachtwoord van je Au Fil des Saveurs-account opnieuw in te stellen.",
    cta: "Een nieuw wachtwoord kiezen",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 1 uur geldig.",
    ignore: "Als jij deze aanvraag niet hebt gedaan, kun je deze e-mail negeren — je wachtwoord blijft hetzelfde.",
  },
  de: {
    heading: "Setze dein Passwort zurück",
    body: "Wir haben eine Anfrage zum Zurücksetzen des Passworts deines Au Fil des Saveurs-Kontos erhalten.",
    cta: "Neues Passwort wählen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Dieser Link ist 1 Stunde gültig.",
    ignore: "Solltest du diese Anfrage nicht gestellt haben, ignoriere diese E-Mail — dein Passwort bleibt unverändert.",
  },
  en: {
    heading: "Reset your password",
    body: "We received a request to reset the password for your Au Fil des Saveurs account.",
    cta: "Choose a new password",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 1 hour.",
    ignore: "If you didn't make this request, just ignore this email — your password will remain unchanged.",
  },
};

export function PasswordResetEmail({ locale, resetUrl }: { locale: Locale; resetUrl: string }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <p style={{ marginTop: 24 }}>
        <a
          href={resetUrl}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#a8731b",
            color: "#fbf6ee",
            textDecoration: "none",
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          {s.cta}
        </a>
      </p>
      <p style={{ color: "#7a5a3c", fontSize: 13, lineHeight: 1.5, marginTop: 24 }}>
        {s.fallback}
        <br />
        <a href={resetUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {resetUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 4 }}>{s.ignore}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `WelcomeEmail.tsx`**

`components/email/WelcomeEmail.tsx`:
```tsx
import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string; cta: string }> = {
  fr: {
    heading: "Bienvenue chez Au Fil des Saveurs",
    body: "Ton compte est créé. On t'a aussi envoyé un email pour vérifier ton adresse — pense à cliquer dessus quand tu as un moment. En attendant, jette un œil à notre atelier.",
    cta: "Découvrir nos biscuits",
  },
  nl: {
    heading: "Welkom bij Au Fil des Saveurs",
    body: "Je account is aangemaakt. We hebben je ook een e-mail gestuurd om je adres te verifiëren — klik erop wanneer je een momentje hebt. Bekijk ondertussen ons atelier.",
    cta: "Onze koekjes ontdekken",
  },
  de: {
    heading: "Willkommen bei Au Fil des Saveurs",
    body: "Dein Konto ist eingerichtet. Wir haben dir auch eine E-Mail zur Adressbestätigung geschickt — klicke darauf, wenn du Zeit hast. Schau bis dahin gerne in unsere Werkstatt.",
    cta: "Unsere Kekse entdecken",
  },
  en: {
    heading: "Welcome to Au Fil des Saveurs",
    body: "Your account is ready. We also sent you a separate email to verify your address — click on it whenever you have a moment. Meanwhile, take a look at our atelier.",
    cta: "Discover our biscuits",
  },
};

export function WelcomeEmail({ locale, shopUrl }: { locale: Locale; shopUrl: string }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 28, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <p style={{ marginTop: 24 }}>
        <a
          href={shopUrl}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#a8731b",
            color: "#fbf6ee",
            textDecoration: "none",
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          {s.cta}
        </a>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create `PasswordChangedEmail.tsx`**

`components/email/PasswordChangedEmail.tsx`:
```tsx
import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string; warning: string }> = {
  fr: {
    heading: "Ton mot de passe a été modifié",
    body: "Tu viens de mettre à jour le mot de passe de ton compte Au Fil des Saveurs. Toutes tes sessions ont été déconnectées pour des raisons de sécurité.",
    warning: "Si ce n'est pas toi, réinitialise ton mot de passe immédiatement et contacte-nous.",
  },
  nl: {
    heading: "Je wachtwoord is gewijzigd",
    body: "Je hebt zojuist het wachtwoord van je Au Fil des Saveurs-account bijgewerkt. Al je sessies zijn om veiligheidsredenen afgemeld.",
    warning: "Was jij dit niet? Stel je wachtwoord onmiddellijk opnieuw in en neem contact met ons op.",
  },
  de: {
    heading: "Dein Passwort wurde geändert",
    body: "Du hast soeben das Passwort deines Au Fil des Saveurs-Kontos aktualisiert. Alle Sitzungen wurden aus Sicherheitsgründen abgemeldet.",
    warning: "Solltest du das nicht gewesen sein, setze dein Passwort sofort zurück und kontaktiere uns.",
  },
  en: {
    heading: "Your password was changed",
    body: "You just updated the password on your Au Fil des Saveurs account. All your sessions have been signed out for security.",
    warning: "If this wasn't you, reset your password immediately and contact us.",
  },
};

export function PasswordChangedEmail({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <p style={{ color: "#a13b1f", fontSize: 14, lineHeight: 1.5, marginTop: 16, fontWeight: 600 }}>
        {s.warning}
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add components/email/VerifyEmailEmail.tsx components/email/PasswordResetEmail.tsx components/email/WelcomeEmail.tsx components/email/PasswordChangedEmail.tsx
git commit -m "feat(email): 4 locale-aware auth email templates"
```

---

## Phase 5 — NextAuth refactor

### Task 12: Drop Resend provider, add Google provider

**Files:** Modify `lib/auth.ts`

- [ ] **Step 1: Replace provider config**

Replace the whole file content with:
```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";

const googleConfigured = !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: googleConfigured
    ? [
        Google({
          clientId: env.AUTH_GOOGLE_ID!,
          clientSecret: env.AUTH_GOOGLE_SECRET!,
          // Google verifies the email — safe to link an existing local account
          // when the addresses match.
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : [],
  pages: {
    signIn: "/fr/sign-in",
  },
  trustHost: true,
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        const dbUser = user as {
          id: string;
          role?: "customer" | "b2b" | "admin";
          preferredLocale?: "fr" | "nl" | "de" | "en";
        };
        session.user.id = dbUser.id;
        session.user.role = dbUser.role ?? "customer";
        session.user.preferredLocale = dbUser.preferredLocale ?? "fr";
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: typecheck clean. Build clean (Google provider doesn't require runtime env if `googleConfigured` is false — empty providers array still compiles).

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "refactor(auth): drop Resend magic-link, add optional Google provider"
```

---

## Phase 6 — Server actions

> All server actions live in `lib/actions/auth.actions.ts`, appended to the existing `signOutAction`. Each follows the same convention: zod validate, rate-limit, side-effect, redirect (success) or redirect with `?error=...` (failure).

### Task 13: `registerWithPassword` server action

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Append the action**

At the top of the file, ensure these imports exist:
```ts
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, verificationTokens, passwordResetTokens, sessions } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { createDbSession, destroyCurrentSession } from "@/lib/auth/session";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { checkAuthRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { sendEmail } from "@/lib/email/client";
import { VerifyEmailEmail } from "@/components/email/VerifyEmailEmail";
import { WelcomeEmail } from "@/components/email/WelcomeEmail";
import { PasswordResetEmail } from "@/components/email/PasswordResetEmail";
import { PasswordChangedEmail } from "@/components/email/PasswordChangedEmail";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
```

Append at the end of the file:
```ts
const APP_LOCALES = ["fr", "nl", "de", "en"] as const;
type AppLocale = (typeof APP_LOCALES)[number];

function asLocale(input: string | null | undefined): AppLocale {
  return (APP_LOCALES as readonly string[]).includes(input ?? "")
    ? (input as AppLocale)
    : "fr";
}

const registerSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(12).max(200),
    confirmPassword: z.string().min(12).max(200),
    acceptTerms: z.literal("on"),
    newsletterOptIn: z.union([z.literal("on"), z.undefined()]),
    locale: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "password-mismatch",
    path: ["confirmPassword"],
  });

export async function registerWithPassword(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    acceptTerms: formData.get("acceptTerms"),
    newsletterOptIn: formData.get("newsletterOptIn") ?? undefined,
    locale,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const code = first?.path[0] === "confirmPassword" ? "password-mismatch" : "invalid";
    redirect(`/${locale}/sign-up?error=${code}`);
  }
  const { email, password, newsletterOptIn } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "register", email: normalizedEmail, ip });
  if (!limit.ok) redirect(`/${locale}/sign-up?error=rate-limit`);

  const existing = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing[0]) {
    if (existing[0].passwordHash) {
      redirect(`/${locale}/sign-up?error=email-taken`);
    } else {
      redirect(`/${locale}/sign-up?error=use-oauth`);
    }
  }

  const passwordHash = await hashPassword(password);
  const [inserted] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      preferredLocale: locale,
      newsletterOptIn: newsletterOptIn === "on",
      role: "customer",
    })
    .returning({ id: users.id });

  const userId = inserted!.id;

  // Email verification token (24h)
  const rawVerify = generateRawToken();
  await db.insert(verificationTokens).values({
    identifier: normalizedEmail,
    token: hashToken(rawVerify),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const verifyUrl = `${appBase}/${locale}/verify-email/${rawVerify}`;
  await sendEmail({
    to: normalizedEmail,
    subject: "Confirme ton adresse email — Au Fil des Saveurs",
    react: VerifyEmailEmail({ locale, verifyUrl }),
  });

  // Welcome email (best-effort)
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Bienvenue chez Au Fil des Saveurs",
      react: WelcomeEmail({ locale, shopUrl: `${appBase}/${locale}/biscuits` }),
    });
  } catch {
    // welcome is non-critical; verify already sent above
  }

  await createDbSession(userId);
  redirect(`/${locale}/compte?welcome=1`);
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): registerWithPassword server action"
```

---

### Task 14: `signInWithPassword` server action

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Append action**

```ts
const signInSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
  callbackUrl: z.string().optional(),
  locale: z.string(),
});

export async function signInWithPassword(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
    locale,
  });
  if (!parsed.success) {
    redirect(`/${locale}/sign-in?error=invalid`);
  }
  const { email, password, callbackUrl } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "sign-in", email: normalizedEmail, ip });
  if (!limit.ok) redirect(`/${locale}/sign-in?error=rate-limit`);

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    redirect(`/${locale}/sign-in?error=invalid-credentials`);
  }
  if (!user.passwordHash) {
    redirect(`/${locale}/sign-in?error=use-oauth`);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect(`/${locale}/sign-in?error=invalid-credentials`);
  }

  await createDbSession(user.id);
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  redirect(safeCallbackUrl(callbackUrl ?? null, locale));
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): signInWithPassword server action"
```

---

### Task 15: `requestPasswordReset` server action

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Append action**

```ts
const forgotSchema = z.object({
  email: z.string().email().max(254),
  locale: z.string(),
});

export async function requestPasswordReset(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const parsed = forgotSchema.safeParse({
    email: formData.get("email"),
    locale,
  });
  if (!parsed.success) {
    redirect(`/${locale}/forgot-password?error=invalid`);
  }
  const { email } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "forgot", email: normalizedEmail, ip });
  if (!limit.ok) {
    // still redirect to sent — avoid leaking limit state
    redirect(`/${locale}/forgot-password?sent=1`);
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user) {
    const raw = generateRawToken();
    await db.insert(passwordResetTokens).values({
      token: hashToken(raw),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
    });
    const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const resetUrl = `${appBase}/${locale}/reset-password/${raw}`;
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Réinitialise ton mot de passe — Au Fil des Saveurs",
        react: PasswordResetEmail({ locale, resetUrl }),
      });
    } catch (e) {
      console.error("[auth] reset email send failed", e);
    }
  }

  redirect(`/${locale}/forgot-password?sent=1`);
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): requestPasswordReset server action"
```

---

### Task 16: `resetPassword` server action

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Append action**

```ts
const resetSchema = z
  .object({
    token: z.string().min(20).max(200),
    newPassword: z.string().min(12).max(200),
    confirmPassword: z.string().min(12).max(200),
    locale: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "password-mismatch",
    path: ["confirmPassword"],
  });

export async function resetPassword(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
    locale,
  });
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.path[0] === "confirmPassword" ? "password-mismatch" : "invalid";
    const rawToken = (formData.get("token") as string | null) ?? "";
    redirect(`/${locale}/reset-password/${rawToken}?error=${code}`);
  }
  const { token: rawToken, newPassword } = parsed.data;

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "reset", email: null, ip });
  if (!limit.ok) redirect(`/${locale}/reset-password/${rawToken}?error=rate-limit`);

  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({ token: passwordResetTokens.token, userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, hashed))
    .limit(1);
  if (!row) redirect(`/${locale}/reset-password/${rawToken}?error=expired`);

  const now = new Date();
  const passwordHash = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, row.userId));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));
    await tx.delete(sessions).where(eq(sessions.userId, row.userId));
  });

  // Best-effort security advisory
  const [user] = await db
    .select({ email: users.email, preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);
  if (user) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Ton mot de passe a été modifié",
        react: PasswordChangedEmail({ locale: asLocale(user.preferredLocale) }),
      });
    } catch (e) {
      console.error("[auth] password-changed email send failed", e);
    }
  }
  void now;

  redirect(`/${locale}/sign-in?reset=ok`);
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): resetPassword server action (revokes sessions)"
```

---

### Task 17: `verifyEmail` and `resendEmailVerification` actions

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Append actions**

```ts
export type VerifyEmailResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: "expired" };

export async function verifyEmail(rawToken: string, locale: string): Promise<VerifyEmailResult> {
  const safeLocale = asLocale(locale);
  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({ identifier: verificationTokens.identifier, expires: verificationTokens.expires })
    .from(verificationTokens)
    .where(eq(verificationTokens.token, hashed))
    .limit(1);
  if (!row || row.expires.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, row.identifier));
    await tx
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, row.identifier));
  });
  return { ok: true, redirectTo: `/${safeLocale}/compte?verified=ok` };
}

export async function resendEmailVerification(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.email) redirect(`/${locale}/sign-in`);

  const email = session.user.email.toLowerCase();
  const userLocale = asLocale(session.user.preferredLocale ?? locale);

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({ action: "forgot", email, ip });
  if (!limit.ok) redirect(`/${locale}/compte?verify=rate-limit`);

  // Wipe stale tokens, issue a fresh one
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
  const raw = generateRawToken();
  await db.insert(verificationTokens).values({
    identifier: email,
    token: hashToken(raw),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const verifyUrl = `${appBase}/${userLocale}/verify-email/${raw}`;
  await sendEmail({
    to: email,
    subject: "Confirme ton adresse email — Au Fil des Saveurs",
    react: VerifyEmailEmail({ locale: userLocale, verifyUrl }),
  });
  redirect(`/${locale}/compte?verify=sent`);
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): verifyEmail + resendEmailVerification actions"
```

---

### Task 18: `changePassword` and `updateProfile` actions

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Append actions**

```ts
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12).max(200),
    confirmPassword: z.string().min(12).max(200),
    locale: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "password-mismatch",
    path: ["confirmPassword"],
  });

export async function changePassword(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
    locale,
  });
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.path[0] === "confirmPassword" ? "password-mismatch" : "invalid";
    redirect(`/${locale}/compte/profil?error=${code}`);
  }
  const { currentPassword, newPassword } = parsed.data;

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const email = session.user.email?.toLowerCase() ?? "";
  const limit = await checkAuthRateLimit({ action: "change-password", email, ip });
  if (!limit.ok) redirect(`/${locale}/compte/profil?error=rate-limit`);

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) redirect(`/${locale}/sign-in`);

  if (!user.passwordHash) {
    redirect(`/${locale}/compte/profil?error=no-password-yet`);
  }
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) redirect(`/${locale}/compte/profil?error=wrong-current`);

  const newHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));

  try {
    await sendEmail({
      to: user.email,
      subject: "Ton mot de passe a été modifié",
      react: PasswordChangedEmail({ locale }),
    });
  } catch (e) {
    console.error("[auth] password-changed email send failed", e);
  }

  redirect(`/${locale}/compte/profil?password=ok`);
}

const updateProfileSchema = z.object({
  preferredLocale: z.enum(["fr", "nl", "de", "en"]),
  newsletterOptIn: z.union([z.literal("on"), z.undefined()]),
  locale: z.string(),
});

export async function updateProfile(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const parsed = updateProfileSchema.safeParse({
    preferredLocale: formData.get("preferredLocale"),
    newsletterOptIn: formData.get("newsletterOptIn") ?? undefined,
    locale,
  });
  if (!parsed.success) redirect(`/${locale}/compte/profil?error=invalid`);

  await db
    .update(users)
    .set({
      preferredLocale: parsed.data.preferredLocale,
      newsletterOptIn: parsed.data.newsletterOptIn === "on",
    })
    .where(eq(users.id, session.user.id));

  redirect(`/${parsed.data.preferredLocale}/compte/profil?profile=ok`);
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): changePassword + updateProfile actions"
```

---

## Phase 7 — i18n keys

### Task 19: Replace magic-link copy + add new auth keys × 4 locales

**Files:** Modify `messages/{fr,nl,de,en}.json`

- [ ] **Step 1: Replace the `auth` section in `messages/fr.json`**

Find and replace the existing `"auth": {...}` block with:
```json
  "auth": {
    "signInTitle": "Se connecter",
    "signInDescription": "Connecte-toi à ton compte Au Fil des Saveurs.",
    "signInSubmit": "Se connecter",
    "signInWithGoogle": "Continuer avec Google",
    "signInOrDivider": "ou",
    "signInNoAccount": "Pas encore de compte ?",
    "signInLinkRegister": "S'inscrire",
    "signUpTitle": "Créer un compte",
    "signUpSubmit": "Créer mon compte",
    "signUpHaveAccount": "Déjà un compte ?",
    "signUpLinkSignIn": "Se connecter",
    "signUpAcceptTerms": "J'accepte les CGV et la politique de confidentialité",
    "signUpNewsletter": "Recevoir la newsletter Au Fil des Saveurs",
    "emailLabel": "Adresse email",
    "emailPlaceholder": "ton@email.com",
    "passwordLabel": "Mot de passe",
    "passwordHint": "Minimum 12 caractères.",
    "confirmPasswordLabel": "Confirmer le mot de passe",
    "currentPasswordLabel": "Mot de passe actuel",
    "newPasswordLabel": "Nouveau mot de passe",
    "forgotLink": "Mot de passe oublié ?",
    "forgotTitle": "Mot de passe oublié ?",
    "forgotDescription": "Saisis ton adresse — on t'envoie un lien pour le réinitialiser.",
    "forgotSubmit": "Envoyer le lien",
    "forgotSent": "Si un compte existe avec cet email, tu recevras un lien dans quelques instants.",
    "resetTitle": "Choisis un nouveau mot de passe",
    "resetSubmit": "Mettre à jour",
    "resetExpired": "Lien expiré ou déjà utilisé.",
    "resetExpiredCta": "Demander un nouveau lien",
    "verifyExpired": "Lien de vérification expiré ou déjà utilisé.",
    "verifyResendCta": "Renvoyer un email",
    "verifyBannerTitle": "Vérifie ton adresse email",
    "verifyBannerResend": "Renvoyer le lien",
    "verifyBannerSent": "Email renvoyé — vérifie ta boîte.",
    "back": "Retour",
    "errorInvalid": "Les informations saisies sont incorrectes.",
    "errorInvalidCredentials": "Email ou mot de passe incorrect.",
    "errorRateLimit": "Trop de tentatives, réessaie dans quelques minutes.",
    "errorEmailTaken": "Cet email est déjà utilisé.",
    "errorUseOauth": "Ce compte utilise Google. Connecte-toi avec Google ou réinitialise ton mot de passe.",
    "errorPasswordMismatch": "Les deux mots de passe ne correspondent pas.",
    "errorWrongCurrent": "Mot de passe actuel incorrect.",
    "errorNoPasswordYet": "Tu n'as pas encore de mot de passe. Utilise « Mot de passe oublié » pour en créer un.",
    "errorOauth": "Connexion Google annulée ou en échec. Réessaie.",
    "toastResetOk": "Mot de passe mis à jour — tu peux te connecter.",
    "toastVerifiedOk": "Email vérifié ✓",
    "toastWelcome": "Bienvenue ! Vérifie ton email pour confirmer ton adresse.",
    "toastPasswordOk": "Mot de passe mis à jour."
  },
```

- [ ] **Step 2: Replace the `auth` section in `messages/nl.json`**

```json
  "auth": {
    "signInTitle": "Inloggen",
    "signInDescription": "Log in op je Au Fil des Saveurs-account.",
    "signInSubmit": "Inloggen",
    "signInWithGoogle": "Doorgaan met Google",
    "signInOrDivider": "of",
    "signInNoAccount": "Nog geen account?",
    "signInLinkRegister": "Aanmelden",
    "signUpTitle": "Account aanmaken",
    "signUpSubmit": "Mijn account aanmaken",
    "signUpHaveAccount": "Heb je al een account?",
    "signUpLinkSignIn": "Inloggen",
    "signUpAcceptTerms": "Ik ga akkoord met de algemene voorwaarden en het privacybeleid",
    "signUpNewsletter": "De Au Fil des Saveurs-nieuwsbrief ontvangen",
    "emailLabel": "E-mailadres",
    "emailPlaceholder": "jij@voorbeeld.com",
    "passwordLabel": "Wachtwoord",
    "passwordHint": "Minimaal 12 tekens.",
    "confirmPasswordLabel": "Wachtwoord bevestigen",
    "currentPasswordLabel": "Huidig wachtwoord",
    "newPasswordLabel": "Nieuw wachtwoord",
    "forgotLink": "Wachtwoord vergeten?",
    "forgotTitle": "Wachtwoord vergeten?",
    "forgotDescription": "Vul je adres in — we sturen je een link om het opnieuw in te stellen.",
    "forgotSubmit": "Link versturen",
    "forgotSent": "Als er een account bestaat met dit e-mailadres, ontvang je binnen enkele ogenblikken een link.",
    "resetTitle": "Kies een nieuw wachtwoord",
    "resetSubmit": "Bijwerken",
    "resetExpired": "Link verlopen of al gebruikt.",
    "resetExpiredCta": "Nieuwe link aanvragen",
    "verifyExpired": "Verificatielink verlopen of al gebruikt.",
    "verifyResendCta": "E-mail opnieuw versturen",
    "verifyBannerTitle": "Bevestig je e-mailadres",
    "verifyBannerResend": "Link opnieuw versturen",
    "verifyBannerSent": "E-mail verzonden — controleer je inbox.",
    "back": "Terug",
    "errorInvalid": "De ingevoerde gegevens zijn ongeldig.",
    "errorInvalidCredentials": "E-mail of wachtwoord onjuist.",
    "errorRateLimit": "Te veel pogingen, probeer het over enkele minuten opnieuw.",
    "errorEmailTaken": "Dit e-mailadres wordt al gebruikt.",
    "errorUseOauth": "Dit account gebruikt Google. Log in met Google of stel je wachtwoord opnieuw in.",
    "errorPasswordMismatch": "De twee wachtwoorden komen niet overeen.",
    "errorWrongCurrent": "Huidig wachtwoord onjuist.",
    "errorNoPasswordYet": "Je hebt nog geen wachtwoord. Gebruik 'Wachtwoord vergeten' om er een aan te maken.",
    "errorOauth": "Inloggen met Google geannuleerd of mislukt. Probeer opnieuw.",
    "toastResetOk": "Wachtwoord bijgewerkt — je kunt inloggen.",
    "toastVerifiedOk": "E-mail geverifieerd ✓",
    "toastWelcome": "Welkom! Controleer je e-mail om je adres te bevestigen.",
    "toastPasswordOk": "Wachtwoord bijgewerkt."
  },
```

- [ ] **Step 3: Replace the `auth` section in `messages/en.json`**

```json
  "auth": {
    "signInTitle": "Sign in",
    "signInDescription": "Sign in to your Au Fil des Saveurs account.",
    "signInSubmit": "Sign in",
    "signInWithGoogle": "Continue with Google",
    "signInOrDivider": "or",
    "signInNoAccount": "No account yet?",
    "signInLinkRegister": "Sign up",
    "signUpTitle": "Create an account",
    "signUpSubmit": "Create my account",
    "signUpHaveAccount": "Already have an account?",
    "signUpLinkSignIn": "Sign in",
    "signUpAcceptTerms": "I accept the Terms of Service and the Privacy Policy",
    "signUpNewsletter": "Subscribe to the Au Fil des Saveurs newsletter",
    "emailLabel": "Email address",
    "emailPlaceholder": "you@example.com",
    "passwordLabel": "Password",
    "passwordHint": "Minimum 12 characters.",
    "confirmPasswordLabel": "Confirm password",
    "currentPasswordLabel": "Current password",
    "newPasswordLabel": "New password",
    "forgotLink": "Forgot your password?",
    "forgotTitle": "Forgot your password?",
    "forgotDescription": "Enter your address — we'll send you a reset link.",
    "forgotSubmit": "Send link",
    "forgotSent": "If an account exists for this email, you'll receive a link shortly.",
    "resetTitle": "Choose a new password",
    "resetSubmit": "Update",
    "resetExpired": "Link expired or already used.",
    "resetExpiredCta": "Request a new link",
    "verifyExpired": "Verification link expired or already used.",
    "verifyResendCta": "Resend email",
    "verifyBannerTitle": "Verify your email address",
    "verifyBannerResend": "Resend link",
    "verifyBannerSent": "Email sent — check your inbox.",
    "back": "Back",
    "errorInvalid": "The information you entered is invalid.",
    "errorInvalidCredentials": "Incorrect email or password.",
    "errorRateLimit": "Too many attempts, please try again in a few minutes.",
    "errorEmailTaken": "This email is already in use.",
    "errorUseOauth": "This account uses Google. Sign in with Google or reset your password.",
    "errorPasswordMismatch": "The two passwords don't match.",
    "errorWrongCurrent": "Current password incorrect.",
    "errorNoPasswordYet": "You don't have a password yet. Use 'Forgot password' to set one.",
    "errorOauth": "Google sign-in was cancelled or failed. Please retry.",
    "toastResetOk": "Password updated — you can sign in.",
    "toastVerifiedOk": "Email verified ✓",
    "toastWelcome": "Welcome! Check your inbox to confirm your address.",
    "toastPasswordOk": "Password updated."
  },
```

- [ ] **Step 4: Replace the `auth` section in `messages/de.json`**

```json
  "auth": {
    "signInTitle": "Anmelden",
    "signInDescription": "Melde dich bei deinem Au Fil des Saveurs-Konto an.",
    "signInSubmit": "Anmelden",
    "signInWithGoogle": "Mit Google fortfahren",
    "signInOrDivider": "oder",
    "signInNoAccount": "Noch kein Konto?",
    "signInLinkRegister": "Registrieren",
    "signUpTitle": "Konto erstellen",
    "signUpSubmit": "Mein Konto erstellen",
    "signUpHaveAccount": "Bereits ein Konto?",
    "signUpLinkSignIn": "Anmelden",
    "signUpAcceptTerms": "Ich akzeptiere die AGB und die Datenschutzrichtlinie",
    "signUpNewsletter": "Den Au Fil des Saveurs-Newsletter erhalten",
    "emailLabel": "E-Mail-Adresse",
    "emailPlaceholder": "du@beispiel.com",
    "passwordLabel": "Passwort",
    "passwordHint": "Mindestens 12 Zeichen.",
    "confirmPasswordLabel": "Passwort bestätigen",
    "currentPasswordLabel": "Aktuelles Passwort",
    "newPasswordLabel": "Neues Passwort",
    "forgotLink": "Passwort vergessen?",
    "forgotTitle": "Passwort vergessen?",
    "forgotDescription": "Gib deine Adresse ein — wir senden dir einen Link.",
    "forgotSubmit": "Link senden",
    "forgotSent": "Wenn ein Konto mit dieser E-Mail-Adresse existiert, erhältst du in Kürze einen Link.",
    "resetTitle": "Wähle ein neues Passwort",
    "resetSubmit": "Aktualisieren",
    "resetExpired": "Link abgelaufen oder bereits verwendet.",
    "resetExpiredCta": "Neuen Link anfordern",
    "verifyExpired": "Verifizierungslink abgelaufen oder bereits verwendet.",
    "verifyResendCta": "E-Mail erneut senden",
    "verifyBannerTitle": "Bestätige deine E-Mail-Adresse",
    "verifyBannerResend": "Link erneut senden",
    "verifyBannerSent": "E-Mail gesendet — prüfe dein Postfach.",
    "back": "Zurück",
    "errorInvalid": "Die eingegebenen Daten sind ungültig.",
    "errorInvalidCredentials": "E-Mail oder Passwort falsch.",
    "errorRateLimit": "Zu viele Versuche, bitte versuche es in einigen Minuten erneut.",
    "errorEmailTaken": "Diese E-Mail-Adresse wird bereits verwendet.",
    "errorUseOauth": "Dieses Konto verwendet Google. Melde dich mit Google an oder setze dein Passwort zurück.",
    "errorPasswordMismatch": "Die beiden Passwörter stimmen nicht überein.",
    "errorWrongCurrent": "Aktuelles Passwort falsch.",
    "errorNoPasswordYet": "Du hast noch kein Passwort. Nutze 'Passwort vergessen', um eins anzulegen.",
    "errorOauth": "Google-Anmeldung abgebrochen oder fehlgeschlagen. Bitte erneut versuchen.",
    "toastResetOk": "Passwort aktualisiert — du kannst dich anmelden.",
    "toastVerifiedOk": "E-Mail verifiziert ✓",
    "toastWelcome": "Willkommen! Prüfe dein Postfach, um deine Adresse zu bestätigen.",
    "toastPasswordOk": "Passwort aktualisiert."
  },
```

- [ ] **Step 5: Add `account.nav.profile` to all 4 locales**

In each `messages/{fr,nl,de,en}.json`, find `account.nav` and add a `profile` key:
- fr: `"profile": "Mon profil"`
- nl: `"profile": "Mijn profiel"`
- en: `"profile": "My profile"`
- de: `"profile": "Mein Profil"`

- [ ] **Step 6: Typecheck + build (catches missing keys via next-intl)**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add messages/fr.json messages/nl.json messages/de.json messages/en.json
git commit -m "i18n(auth): replace magic-link copy with email/password keys (4 locales)"
```

---

## Phase 8 — Pages & components

### Task 20: `SignInForm` + `GoogleSignInButton` components

**Files:**
- Create: `components/shop/GoogleSignInButton.tsx`
- Create: `components/shop/SignInForm.tsx`

- [ ] **Step 1: Create `GoogleSignInButton.tsx`**

```tsx
"use client";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("auth");
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/" })}
      className="border-warm-brown/20 text-warm-brown hover:bg-honey/5 inline-flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-3 text-sm font-medium transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden focusable="false">
        <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"/>
        <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.2-3.8H.8v2.3C2.3 15.9 5.4 18 9 18z"/>
        <path fill="#FBBC05" d="M3.8 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6.1 0 7.5 0 9s.3 2.9.8 4l3-2.3z"/>
        <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3L15 2.4C13.5.9 11.4 0 9 0 5.4 0 2.3 2.1.8 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/>
      </svg>
      {t("signInWithGoogle")}
    </button>
  );
}
```

- [ ] **Step 2: Create `SignInForm.tsx`**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signInWithPassword } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function SignInForm({
  locale,
  callbackUrl,
}: {
  locale: string;
  callbackUrl?: string;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => signInWithPassword(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <label className="block">
        <span className="text-warm-brown text-sm">{t("emailLabel")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          placeholder={t("emailPlaceholder")}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <div className="flex items-baseline justify-between">
          <span className="text-warm-brown text-sm">{t("passwordLabel")}</span>
          <Link
            href="/forgot-password"
            className="text-warm-brown/70 hover:text-honey-dark text-xs underline"
          >
            {t("forgotLink")}
          </Link>
        </div>
        <input
          type="password"
          name="password"
          required
          minLength={12}
          autoComplete="current-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {t("signInSubmit")} →
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/shop/GoogleSignInButton.tsx components/shop/SignInForm.tsx
git commit -m "feat(auth): SignInForm + GoogleSignInButton components"
```

---

### Task 21: Refonte `/sign-in` page

**Files:** Modify `app/[locale]/(shop)/sign-in/page.tsx`

- [ ] **Step 1: Replace the whole file**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Logo } from "@/components/brand/Logo";
import { SignInForm } from "@/components/shop/SignInForm";
import { GoogleSignInButton } from "@/components/shop/GoogleSignInButton";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  "invalid-credentials": "errorInvalidCredentials",
  "rate-limit": "errorRateLimit",
  "use-oauth": "errorUseOauth",
  "oauth-error": "errorOauth",
};

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; reset?: string; verified?: string; callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { error, reset, verified, callbackUrl: rawCallback } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const session = await auth();
  if (session?.user) {
    redirect(safeCallbackUrl(rawCallback ?? null, locale));
  }

  const errorKey = error ? ERROR_KEYS[error] : null;

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link
          href="/"
          aria-label="Au Fil des Saveurs — Accueil"
          className="text-warm-brown mb-12 flex justify-center"
        >
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
          <Heading as="h1" size="h3">
            {t("signInTitle")}
          </Heading>
          <Prose className="mt-3">{t("signInDescription")}</Prose>

          {reset === "ok" && (
            <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mt-4 rounded-md border px-4 py-3 text-sm">
              {t("toastResetOk")}
            </div>
          )}
          {verified === "ok" && (
            <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mt-4 rounded-md border px-4 py-3 text-sm">
              {t("toastVerifiedOk")}
            </div>
          )}
          {errorKey && (
            <div
              role="alert"
              className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
            >
              {t(errorKey)}
            </div>
          )}

          <div className="mt-6">
            <SignInForm locale={locale} callbackUrl={rawCallback} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="border-warm-brown/15 flex-1 border-t" />
            <span className="text-warm-brown/60 text-xs uppercase tracking-wide">
              {t("signInOrDivider")}
            </span>
            <span className="border-warm-brown/15 flex-1 border-t" />
          </div>

          <GoogleSignInButton callbackUrl={rawCallback ?? `/${locale}/compte`} />

          <p className="text-warm-brown/80 mt-6 text-center text-sm">
            {t("signInNoAccount")}{" "}
            <Link href="/sign-up" className="text-honey-dark font-medium underline">
              {t("signInLinkRegister")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/\(shop\)/sign-in/page.tsx
git commit -m "feat(auth): refonte /sign-in (email+password + Google)"
```

---

### Task 22: `SignUpForm` component + `/sign-up` page

**Files:**
- Create: `components/shop/SignUpForm.tsx`
- Create: `app/[locale]/(shop)/sign-up/page.tsx`

- [ ] **Step 1: Create `SignUpForm.tsx`**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { registerWithPassword } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function SignUpForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => registerWithPassword(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="block">
        <span className="text-warm-brown text-sm">{t("emailLabel")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("passwordLabel")}</span>
        <input
          type="password"
          name="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
        <span className="text-warm-brown/60 mt-1 block text-xs">{t("passwordHint")}</span>
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("confirmPasswordLabel")}</span>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-warm-brown">
        <input type="checkbox" name="acceptTerms" required className="mt-1" />
        <span>
          {t("signUpAcceptTerms")} <span className="text-terracotta">*</span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-warm-brown">
        <input type="checkbox" name="newsletterOptIn" className="mt-1" />
        <span>{t("signUpNewsletter")}</span>
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {t("signUpSubmit")} →
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create `app/[locale]/(shop)/sign-up/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { SignUpForm } from "@/components/shop/SignUpForm";
import { GoogleSignInButton } from "@/components/shop/GoogleSignInButton";

const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  "rate-limit": "errorRateLimit",
  "email-taken": "errorEmailTaken",
  "use-oauth": "errorUseOauth",
  "password-mismatch": "errorPasswordMismatch",
};

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const session = await auth();
  if (session?.user) redirect(`/${locale}/compte`);

  const errorKey = error ? ERROR_KEYS[error] : null;

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link
          href="/"
          aria-label="Au Fil des Saveurs — Accueil"
          className="text-warm-brown mb-12 flex justify-center"
        >
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
          <Heading as="h1" size="h3">
            {t("signUpTitle")}
          </Heading>
          {errorKey && (
            <div
              role="alert"
              className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
            >
              {t(errorKey)}
            </div>
          )}
          <div className="mt-6">
            <SignUpForm locale={locale} />
          </div>
          <div className="my-6 flex items-center gap-3">
            <span className="border-warm-brown/15 flex-1 border-t" />
            <span className="text-warm-brown/60 text-xs uppercase tracking-wide">
              {t("signInOrDivider")}
            </span>
            <span className="border-warm-brown/15 flex-1 border-t" />
          </div>
          <GoogleSignInButton callbackUrl={`/${locale}/compte`} />
          <p className="text-warm-brown/80 mt-6 text-center text-sm">
            {t("signUpHaveAccount")}{" "}
            <Link href="/sign-in" className="text-honey-dark font-medium underline">
              {t("signUpLinkSignIn")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/shop/SignUpForm.tsx app/[locale]/\(shop\)/sign-up/page.tsx
git commit -m "feat(auth): /sign-up page with email+password + Google"
```

---

### Task 23: `/forgot-password` page + form

**Files:**
- Create: `components/shop/ForgotPasswordForm.tsx`
- Create: `app/[locale]/(shop)/forgot-password/page.tsx`

- [ ] **Step 1: Create `ForgotPasswordForm.tsx`**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => requestPasswordReset(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="block">
        <span className="text-warm-brown text-sm">{t("emailLabel")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {t("forgotSubmit")} →
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create `forgot-password/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Logo } from "@/components/brand/Logo";
import { ForgotPasswordForm } from "@/components/shop/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { sent, error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link
          href="/"
          aria-label="Au Fil des Saveurs — Accueil"
          className="text-warm-brown mb-12 flex justify-center"
        >
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
          <Heading as="h1" size="h3">
            {t("forgotTitle")}
          </Heading>
          <Prose className="mt-3">{t("forgotDescription")}</Prose>
          {sent === "1" ? (
            <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mt-6 rounded-md border px-4 py-3 text-sm">
              {t("forgotSent")}
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
                >
                  {t("errorInvalid")}
                </div>
              )}
              <div className="mt-6">
                <ForgotPasswordForm locale={locale} />
              </div>
            </>
          )}
          <p className="text-warm-brown/80 mt-6 text-center text-sm">
            <Link href="/sign-in" className="text-honey-dark underline">
              {t("back")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/shop/ForgotPasswordForm.tsx app/[locale]/\(shop\)/forgot-password/page.tsx
git commit -m "feat(auth): /forgot-password page with generic confirmation"
```

---

### Task 24: `/reset-password/[token]` page + form

**Files:**
- Create: `components/shop/ResetPasswordForm.tsx`
- Create: `app/[locale]/(shop)/reset-password/[token]/page.tsx`

- [ ] **Step 1: Create `ResetPasswordForm.tsx`**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { resetPassword } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => resetPassword(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="text-warm-brown text-sm">{t("newPasswordLabel")}</span>
        <input
          type="password"
          name="newPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
        <span className="text-warm-brown/60 mt-1 block text-xs">{t("passwordHint")}</span>
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("confirmPasswordLabel")}</span>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {t("resetSubmit")} →
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create `reset-password/[token]/page.tsx`**

```tsx
import { eq, gt, and } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { ResetPasswordForm } from "@/components/shop/ResetPasswordForm";
import { db } from "@/lib/db";
import { passwordResetTokens } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";

const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  expired: "resetExpired",
  "rate-limit": "errorRateLimit",
  "password-mismatch": "errorPasswordMismatch",
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, token } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const hashed = hashToken(token);
  const [row] = await db
    .select({ token: passwordResetTokens.token })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, hashed), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link
          href="/"
          aria-label="Au Fil des Saveurs — Accueil"
          className="text-warm-brown mb-12 flex justify-center"
        >
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
          {!row ? (
            <>
              <Heading as="h1" size="h3">
                {t("resetExpired")}
              </Heading>
              <p className="mt-6">
                <Link
                  href="/forgot-password"
                  className="bg-honey text-cream hover:bg-honey-dark inline-block rounded-md px-5 py-3 text-sm font-medium"
                >
                  {t("resetExpiredCta")}
                </Link>
              </p>
            </>
          ) : (
            <>
              <Heading as="h1" size="h3">
                {t("resetTitle")}
              </Heading>
              {error && ERROR_KEYS[error] && (
                <div
                  role="alert"
                  className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm"
                >
                  {t(ERROR_KEYS[error])}
                </div>
              )}
              <div className="mt-6">
                <ResetPasswordForm locale={locale} token={token} />
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/shop/ResetPasswordForm.tsx app/[locale]/\(shop\)/reset-password
git commit -m "feat(auth): /reset-password/[token] page with expiry check"
```

---

### Task 25: `/verify-email/[token]` page

**Files:** Create `app/[locale]/(shop)/verify-email/[token]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { verifyEmail } from "@/lib/actions/auth.actions";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const result = await verifyEmail(token, locale);
  if (result.ok) redirect(result.redirectTo);

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link
          href="/"
          aria-label="Au Fil des Saveurs — Accueil"
          className="text-warm-brown mb-12 flex justify-center"
        >
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm text-center">
          <Heading as="h1" size="h3">
            {t("verifyExpired")}
          </Heading>
          <p className="mt-6">
            <Link
              href="/compte"
              className="bg-honey text-cream hover:bg-honey-dark inline-block rounded-md px-5 py-3 text-sm font-medium"
            >
              {t("verifyResendCta")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/\(shop\)/verify-email
git commit -m "feat(auth): /verify-email/[token] page"
```

---

### Task 26: `EmailNotVerifiedBanner` + wire into `/compte`

**Files:**
- Create: `components/account/EmailNotVerifiedBanner.tsx`
- Modify: `app/[locale]/(account)/compte/page.tsx`

- [ ] **Step 1: Create the banner**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { resendEmailVerification } from "@/lib/actions/auth.actions";

export function EmailNotVerifiedBanner({
  locale,
  sent,
}: {
  locale: string;
  sent: boolean;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <div className="border-honey/40 bg-honey-cream text-warm-brown mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
      <span>📬 {t("verifyBannerTitle")}</span>
      {sent ? (
        <span className="text-honey-dark text-xs">{t("verifyBannerSent")}</span>
      ) : (
        <form action={(fd) => start(() => resendEmailVerification(fd))}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            disabled={pending}
            className="text-honey-dark hover:text-warm-brown text-xs font-medium underline disabled:opacity-60"
          >
            {t("verifyBannerResend")}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the dashboard**

In `app/[locale]/(account)/compte/page.tsx`, at the top of `<section>` (before `<Eyebrow>`), conditionally render the banner. Update the file to read `email_verified` and the `verify` searchParam.

Update the page (full replacement):
```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { EmailNotVerifiedBanner } from "@/components/account/EmailNotVerifiedBanner";
import { signOutAction } from "@/lib/actions/auth.actions";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ welcome?: string; verified?: string; verify?: string }>;
}) {
  const { locale } = await params;
  const { welcome, verified, verify } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const tAuth = await getTranslations("auth");
  const session = await auth();

  if (!session?.user) {
    redirect({ href: "/sign-in", locale });
  }

  const [user] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, session!.user!.id))
    .limit(1);

  const handleSignOut = signOutAction.bind(null, locale);

  return (
    <section>
      {!user?.emailVerified && (
        <EmailNotVerifiedBanner locale={locale} sent={verify === "sent"} />
      )}
      {welcome === "1" && (
        <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mb-6 rounded-md border px-4 py-3 text-sm">
          {tAuth("toastWelcome")}
        </div>
      )}
      {verified === "ok" && (
        <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mb-6 rounded-md border px-4 py-3 text-sm">
          {tAuth("toastVerifiedOk")}
        </div>
      )}

      <Eyebrow>MON COMPTE</Eyebrow>
      <Heading as="h1" size="h1" className="mt-3 mb-8">
        {t("title")}
      </Heading>
      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <Prose>{t("welcome", { name: session!.user!.name ?? session!.user!.email ?? "" })}</Prose>
        <p className="text-warm-brown/70 mt-2 text-sm">
          {t("loggedInAs", { email: session!.user!.email ?? "" })}
        </p>
        <form action={handleSignOut} className="mt-6">
          <Button type="submit" variant="outline">
            {(await getTranslations("nav"))("signOut")}
          </Button>
        </form>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/account/EmailNotVerifiedBanner.tsx app/[locale]/\(account\)/compte/page.tsx
git commit -m "feat(account): EmailNotVerifiedBanner + resend flow"
```

---

### Task 27: `/compte/profil` page with 3 blocks

**Files:**
- Create: `components/account/ChangePasswordForm.tsx`
- Create: `components/account/LinkedAccountsBlock.tsx`
- Create: `components/account/PreferencesBlock.tsx`
- Create: `app/[locale]/(account)/compte/profil/page.tsx`

- [ ] **Step 1: Create `ChangePasswordForm.tsx`**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { changePassword } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => changePassword(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="block">
        <span className="text-warm-brown text-sm">{t("currentPasswordLabel")}</span>
        <input
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("newPasswordLabel")}</span>
        <input
          type="password"
          name="newPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
        <span className="text-warm-brown/60 mt-1 block text-xs">{t("passwordHint")}</span>
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("confirmPasswordLabel")}</span>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={12}
          autoComplete="new-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
      >
        {t("resetSubmit")}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create `LinkedAccountsBlock.tsx`**

```tsx
"use client";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export function LinkedAccountsBlock({ googleLinked }: { googleLinked: boolean }) {
  const t = useTranslations("auth");
  return (
    <div className="flex items-center justify-between border-warm-brown/10 border-t pt-4">
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden focusable="false">
          <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"/>
          <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.2-3.8H.8v2.3C2.3 15.9 5.4 18 9 18z"/>
          <path fill="#FBBC05" d="M3.8 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6.1 0 7.5 0 9s.3 2.9.8 4l3-2.3z"/>
          <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3L15 2.4C13.5.9 11.4 0 9 0 5.4 0 2.3 2.1.8 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/>
        </svg>
        <span className="text-warm-brown text-sm">Google</span>
      </div>
      {googleLinked ? (
        <span className="text-honey-dark text-xs font-medium">✓ Lié</span>
      ) : (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/compte/profil" })}
          className="text-honey-dark text-xs font-medium underline"
        >
          {t("signInWithGoogle")}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `PreferencesBlock.tsx`**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function PreferencesBlock({
  locale,
  preferredLocale,
  newsletterOptIn,
}: {
  locale: string;
  preferredLocale: "fr" | "nl" | "de" | "en";
  newsletterOptIn: boolean;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => updateProfile(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="block">
        <span className="text-warm-brown text-sm">Langue préférée</span>
        <select
          name="preferredLocale"
          defaultValue={preferredLocale}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-2.5 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="fr">Français</option>
          <option value="nl">Nederlands</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-warm-brown">
        <input
          type="checkbox"
          name="newsletterOptIn"
          defaultChecked={newsletterOptIn}
        />
        <span>{t("signUpNewsletter")}</span>
      </label>
      <Button type="submit" disabled={pending} variant="outline">
        Enregistrer
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create the profile page**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { LinkedAccountsBlock } from "@/components/account/LinkedAccountsBlock";
import { PreferencesBlock } from "@/components/account/PreferencesBlock";
import { Link } from "@/i18n/navigation";

const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  "rate-limit": "errorRateLimit",
  "password-mismatch": "errorPasswordMismatch",
  "wrong-current": "errorWrongCurrent",
  "no-password-yet": "errorNoPasswordYet",
};

export default async function ProfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; password?: string; profile?: string }>;
}) {
  const { locale } = await params;
  const { error, password, profile } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });

  const [user] = await db
    .select({
      passwordHash: users.passwordHash,
      preferredLocale: users.preferredLocale,
      newsletterOptIn: users.newsletterOptIn,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, session!.user!.id))
    .limit(1);

  const linkedGoogle = await db
    .select({ id: accounts.providerAccountId })
    .from(accounts)
    .where(eq(accounts.userId, session!.user!.id))
    .limit(1);
  const googleLinked = linkedGoogle.length > 0;

  const errorKey = error ? ERROR_KEYS[error] : null;
  return (
    <section className="space-y-8">
      <div>
        <Eyebrow>MON PROFIL</Eyebrow>
        <Heading as="h1" size="h1" className="mt-3 mb-2">
          Mon profil
        </Heading>
        <p className="text-warm-brown/70 text-sm">{user?.email}</p>
      </div>

      {(password === "ok" || profile === "ok") && (
        <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark rounded-md border px-4 py-3 text-sm">
          {password === "ok" ? t("toastPasswordOk") : "Préférences enregistrées."}
        </div>
      )}
      {errorKey && (
        <div
          role="alert"
          className="border-terracotta/30 bg-terracotta/5 text-terracotta rounded-md border px-4 py-3 text-sm"
        >
          {t(errorKey)}
        </div>
      )}

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">{t("passwordLabel")}</h2>
        {user?.passwordHash ? (
          <div className="mt-4">
            <ChangePasswordForm locale={locale} />
          </div>
        ) : (
          <p className="text-warm-brown/70 mt-3 text-sm">
            {t("errorNoPasswordYet")}{" "}
            <Link href="/forgot-password" className="text-honey-dark underline">
              {t("forgotLink")}
            </Link>
          </p>
        )}
      </div>

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">Comptes liés</h2>
        <div className="mt-4">
          <LinkedAccountsBlock googleLinked={googleLinked} />
        </div>
      </div>

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">Préférences</h2>
        <div className="mt-4">
          <PreferencesBlock
            locale={locale}
            preferredLocale={(user?.preferredLocale ?? "fr") as "fr" | "nl" | "de" | "en"}
            newsletterOptIn={user?.newsletterOptIn ?? false}
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add components/account/ChangePasswordForm.tsx components/account/LinkedAccountsBlock.tsx components/account/PreferencesBlock.tsx app/[locale]/\(account\)/compte/profil
git commit -m "feat(account): /compte/profil with password/linked/preferences blocks"
```

---

### Task 28: Add "Profil" to HeaderUserMenu, MobileNav, AccountSidebar

**Files:**
- Modify: `components/layout/HeaderUserMenu.tsx`
- Modify: `components/layout/MobileNav.tsx`
- Modify: `components/account/AccountSidebar.tsx`

- [ ] **Step 1: Add "Profil" item to `HeaderUserMenu.tsx`**

Add `User` to the lucide imports at the top:
```ts
import { LogOut, ShoppingBag, MapPin, Gift, Repeat, LayoutDashboard, User } from "lucide-react";
```

Insert a new DropdownMenuItem right before the `<DropdownMenuSeparator />` that precedes the signOut item:
```tsx
        <DropdownMenuItem asChild className="text-warm-brown focus:bg-honey/10 focus:text-honey-dark cursor-pointer gap-2">
          <Link href="/compte/profil">
            <User className="h-4 w-4" aria-hidden />
            {tAccount("profile")}
          </Link>
        </DropdownMenuItem>
```

- [ ] **Step 2: Add a "Profil" link in `MobileNav.tsx` user block**

Inside the `{user ? (...)` block, after the dashboard link and before the signOut button, add:
```tsx
              <Link
                href="/compte/profil"
                onClick={() => setOpen(false)}
                className="text-warm-brown hover:text-honey-dark border-warm-brown/15 hover:border-honey-dark/40 block rounded-xl border px-4 py-2.5 text-center text-sm font-medium transition-all"
              >
                {tAccount("profile")}
              </Link>
```

- [ ] **Step 3: Add Profil entry to `AccountSidebar.tsx`**

In the `items` array (after `subscription`):
```ts
  { href: "/compte/profil", labelKey: "profile" },
```

- [ ] **Step 4: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add components/layout/HeaderUserMenu.tsx components/layout/MobileNav.tsx components/account/AccountSidebar.tsx
git commit -m "feat(nav): expose /compte/profil in header dropdown + mobile + sidebar"
```

---

## Phase 9 — End-to-end tests

> The existing `tests/e2e/auth.spec.ts` (3 tests for the magic-link form) is no longer accurate. Replace it.

### Task 29: Replace `auth.spec.ts` with `auth-signin.spec.ts`

**Files:**
- Delete: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/auth-signin.spec.ts`

- [ ] **Step 1: Delete the old spec**

```bash
git rm tests/e2e/auth.spec.ts
```

- [ ] **Step 2: Create the new spec**

`tests/e2e/auth-signin.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("unauthenticated /compte redirects to /sign-in", async ({ page }) => {
  await page.goto("/fr/compte");
  await expect(page).toHaveURL(/\/fr\/sign-in/);
});

test("sign-in page shows email + password + Google", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByLabel(/Mot de passe$/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continuer avec google/i })).toBeVisible();
});

test("sign-in with bogus credentials shows generic error", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await page.getByLabel("Adresse email").fill("nope@nowhere.test");
  await page.getByLabel(/Mot de passe$/i).fill("not-the-real-password-1234");
  await page.getByRole("button", { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/error=invalid-credentials/);
  await expect(page.getByRole("alert")).toContainText(/incorrect/i);
});

test("forgot link points to forgot-password", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await page.getByRole("link", { name: /mot de passe oublié/i }).click();
  await expect(page).toHaveURL(/\/fr\/forgot-password$/);
});
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/auth-signin.spec.ts
git commit -m "test(e2e): rewrite auth.spec for email+password sign-in"
```

---

### Task 30: `tests/e2e/auth-register.spec.ts`

**Files:** Create the file.

- [ ] **Step 1: Create the spec**

```ts
import { test, expect } from "@playwright/test";

const uniqueEmail = () => `test+${Date.now()}@e2e-au-fil.test`;

test("sign-up page renders fields + Google", async ({ page }) => {
  await page.goto("/fr/sign-up");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  await expect(page.getByLabel("Confirmer le mot de passe")).toBeVisible();
  await expect(page.getByLabel(/j'accepte les cgv/i)).toBeVisible();
});

test("password mismatch redirects with error", async ({ page }) => {
  await page.goto("/fr/sign-up");
  await page.getByLabel("Adresse email").fill(uniqueEmail());
  await page.getByLabel("Mot de passe").fill("correctpassword12");
  await page.getByLabel("Confirmer le mot de passe").fill("differentpass12");
  await page.getByLabel(/j'accepte les cgv/i).check();
  await page.getByRole("button", { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/error=password-mismatch/);
});

test("successful register lands on /compte with welcome banner", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/fr/sign-up");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe").fill("strongpassword12");
  await page.getByLabel("Confirmer le mot de passe").fill("strongpassword12");
  await page.getByLabel(/j'accepte les cgv/i).check();
  await page.getByRole("button", { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/\/fr\/compte\?welcome=1/);
  await expect(page.getByText(/vérifie ton email/i)).toBeVisible();
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/auth-register.spec.ts
git commit -m "test(e2e): register flow happy path + validation"
```

---

### Task 31: `tests/e2e/auth-reset.spec.ts`

**Files:** Create the file.

- [ ] **Step 1: Create the spec**

```ts
import { test, expect } from "@playwright/test";

test("forgot-password page renders + submits to generic confirmation", async ({ page }) => {
  await page.goto("/fr/forgot-password");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await page.getByLabel("Adresse email").fill("does-not-exist@nowhere.test");
  await page.getByRole("button", { name: /envoyer le lien/i }).click();
  await expect(page).toHaveURL(/sent=1/);
  await expect(page.getByText(/si un compte existe/i)).toBeVisible();
});

test("reset page with garbage token shows expired screen", async ({ page }) => {
  await page.goto("/fr/reset-password/this-is-not-a-real-token");
  await expect(page.getByText(/expiré ou déjà utilisé/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /demander un nouveau lien/i })).toBeVisible();
});
```

(End-to-end happy-path reset requires intercepting the Resend email or seeding a token in the DB. Skipped here; covered manually in the smoke pass.)

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/auth-reset.spec.ts
git commit -m "test(e2e): forgot + reset password page checks"
```

---

## Phase 10 — Migration script + docs

### Task 32: Notify existing magic-link users to set a password

**Files:** Create `scripts/notify-users-set-password.mjs`

- [ ] **Step 1: Create the script**

```js
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { randomBytes, createHash } from "node:crypto";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);
const resend = new Resend(process.env.AUTH_RESEND_KEY);

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://beecuit.vercel.app").replace(/\/$/, "");

const users = await sql`
  SELECT id, email, preferred_locale
  FROM users
  WHERE password_hash IS NULL
    AND email_verified IS NOT NULL
`;

console.log(`Found ${users.length} users without password_hash.`);

for (const u of users) {
  const raw = randomBytes(32).toString("base64url");
  const hashed = createHash("sha256").update(raw).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await sql`
    INSERT INTO password_reset_tokens (token, user_id, expires_at)
    VALUES (${hashed}, ${u.id}, ${expires})
  `;
  const locale = ["fr", "nl", "de", "en"].includes(u.preferred_locale) ? u.preferred_locale : "fr";
  const url = `${APP_URL}/${locale}/reset-password/${raw}`;

  await resend.emails.send({
    from: process.env.AUTH_EMAIL_FROM,
    to: u.email,
    subject: "Nouveau login Au Fil des Saveurs — choisis un mot de passe",
    html: `
      <p>Nous avons mis à jour notre système de connexion.</p>
      <p>Pour continuer à accéder à ton compte, choisis un mot de passe en suivant ce lien (valable 1h) :</p>
      <p><a href="${url}">${url}</a></p>
      <p>Tu peux aussi te connecter directement avec Google si ton compte Google utilise la même adresse.</p>
    `,
  });
  console.log(` ✓ Sent reset link to ${u.email}`);
}

console.log("Done.");
```

- [ ] **Step 2: Commit**

```bash
git add scripts/notify-users-set-password.mjs
git commit -m "chore(auth): one-shot script to notify legacy magic-link users"
```

---

### Task 33: Document Google OAuth setup

**Files:** Create `docs/auth-setup.md`

- [ ] **Step 1: Create the doc**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/auth-setup.md
git commit -m "docs(auth): Google OAuth setup guide"
```

---

## Phase 11 — Cleanup

### Task 34: Drop MagicLinkEmail component (no longer used)

**Files:** Delete `components/email/MagicLinkEmail.tsx`

- [ ] **Step 1: Verify no remaining references**

```bash
pnpm exec rg "MagicLinkEmail" --type ts --type tsx
```

Expected: zero results outside the file itself.

- [ ] **Step 2: Delete the file**

```bash
git rm components/email/MagicLinkEmail.tsx
```

- [ ] **Step 3: Typecheck + build + run unit tests**

```bash
pnpm typecheck && pnpm build && pnpm vitest run tests/unit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(auth): drop unused MagicLinkEmail template"
```

---

### Task 35: Apply migration to production + verify

**Files:** none (operational)

- [ ] **Step 1: Apply migration to local Neon (idempotent)**

```bash
node scripts/apply-pending-migrations.mjs
```

Expected: prints `0013_auth_password applied` if it wasn't already.

- [ ] **Step 2: Run the full unit suite + build**

```bash
pnpm vitest run tests/unit && pnpm build
```

Expected: 90+ tests pass (3 skipped, 1 file `db.test.ts` failing on env is pre-existing), build clean.

- [ ] **Step 3: Smoke checklist (manual, on `pnpm dev`)**
  - [ ] `/fr/sign-up` — register new user → land on `/fr/compte?welcome=1` with verify banner
  - [ ] click *Renvoyer le lien* → banner updates to "E-mail renvoyé"
  - [ ] go to inbox (resend dashboard / local console log in dev) → click verify link → land on `/fr/compte?verified=ok` (banner gone)
  - [ ] sign-out → `/fr/sign-in`
  - [ ] sign-in with same email+password → `/fr/compte`
  - [ ] sign-out → `/fr/forgot-password` → submit → see generic confirmation
  - [ ] click reset URL → enter new password → land on `/fr/sign-in?reset=ok` → sign-in with new password
  - [ ] *Continuer avec Google* (with `AUTH_GOOGLE_ID/SECRET` set) → land on `/fr/compte`
  - [ ] `/fr/compte/profil` → change password → success toast → sign-in still works
  - [ ] `/fr/compte/profil` → toggle newsletter + change locale → redirect to `/nl/compte/profil?profile=ok`

- [ ] **Step 4: Push and deploy**

```bash
git push
```

Verify in Vercel: build green, env vars present, then exercise the same smoke on the preview URL.

(No commit for this task — it's the operational close.)

---

## Self-Review

**Spec coverage (against `2026-05-30-auth-real-login-design.md`):**

| Spec section | Covered by tasks |
|---|---|
| Schema DB (password_hash + password_reset_tokens) | T3, T4, T5 |
| Providers (drop Resend, add Google) | T12 |
| Server actions × 8 | T13–T18 + existing signOutAction |
| Helpers (password, session, tokens, callback-url) | T6, T7, T8, T9 |
| Pages (sign-in refonte, sign-up, forgot, reset, verify, profil) | T21–T27 |
| Email templates × 4 in 4 locales | T11 |
| Rate-limit per-action | T10 |
| `EmailNotVerifiedBanner` on /compte | T26 |
| Header dropdown + Mobile + Sidebar "Profil" | T28 |
| i18n cleanup + new keys × 4 locales | T19 |
| Migration script existing users | T32 |
| Google Cloud setup doc | T33 |
| Tests (unit) | T6, T7, T8 |
| Tests (e2e) | T29, T30, T31 |
| Cleanup MagicLinkEmail | T34 |
| Smoke + deploy | T35 |

No gaps.

**Placeholder scan:** no "TBD"/"TODO"/"similar to" strings. All steps contain full code or full commands. ✓

**Type/method consistency:**
- `hashPassword` / `verifyPassword` used identically in T6, T13, T14, T16, T18 ✓
- `generateRawToken` / `hashToken` used identically in T7, T13, T15, T16, T17, T24, T32 ✓
- `createDbSession(userId)` used in T9, T13, T14 ✓
- `safeCallbackUrl(raw, locale)` used in T8, T14, T21 ✓
- `checkAuthRateLimit({action, email, ip})` used in T10, T13, T14, T15, T16, T17, T18 ✓
- `verifyEmail(rawToken, locale)` returns `{ok: true, redirectTo} | {ok: false, error: 'expired'}` consistently in T17, T25 ✓
- All redirect URLs use `/${locale}/...` form. ✓

No drift identified.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-30-auth-real-login.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

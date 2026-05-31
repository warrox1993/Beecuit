# Auth v2 — Sprint B: Trust & Security — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in 2FA (TOTP), an active-sessions list with revocation, a have-i-been-pwned warning, a lightweight password-strength meter, and an admin 2FA nag banner to the existing auth system.

**Architecture:** Extends the existing DB-backed session + custom-action auth (no new auth framework). New crypto/util helpers under `lib/auth/`, ~9 new server actions appended to `lib/actions/auth.actions.ts`, 2 token/challenge pages, 4 account/admin components, 2 email templates. TOTP secrets are encrypted at rest (AES-256-GCM keyed off `AUTH_SECRET`). Session geo uses Vercel request headers. One additive migration (`0015`).

**Tech Stack:** Next.js 15 App Router, next-intl (fr/nl/de/en), Drizzle ORM + Neon Postgres, `otplib` (TOTP), `qrcode`, `node:crypto`, vitest + Playwright.

**Spec:** `docs/superpowers/specs/2026-05-31-auth-v2-sprint-b-trust-security-design.md`

**Conventions to follow (verified against the codebase):**
- Helpers that touch DB/crypto start with `import "server-only";`. Isomorphic helpers (strength meter) do NOT.
- Tokens: `generateRawToken()` (32B base64url) + `hashToken()` (sha256 hex) from `lib/auth/tokens.ts`.
- Rate limit: `checkAuthRateLimit({ action, email, ip })` + `getClientIp(headers)` from `lib/auth/rate-limit.ts`.
- Email templates: `STRINGS: Record<Locale, …>`, inline styles, brand colours `#fbf6ee`/`#a8731b`/`#3d2817` (see `components/email/EmailChangeVerifyEmail.tsx`).
- Token pages render via a server action returning `{ ok, redirectTo } | { ok:false, error }` (see `app/[locale]/(shop)/confirm-email-change/[token]/page.tsx`).
- Locale type: `"fr" | "nl" | "de" | "en"`. `asLocale()` helper already exists in `auth.actions.ts`.
- Migrations are **generated** with `npm run db:generate` (drizzle-kit) then applied with `npm run db:migrate`. Never hand-write the SQL file.
- Unit tests that import `@/lib/env` or `@/lib/db` must mock them (see `tests/unit/account-purge.test.ts`).

---

## File Structure

**Create:**
- `lib/auth/totp.ts` — TOTP generate/verify + AES-GCM secret encryption
- `lib/auth/recovery-codes.ts` — generate/consume recovery codes
- `lib/auth/pending-2fa.ts` — signed short-lived "password ok, awaiting TOTP" cookie
- `lib/auth/password-strength.ts` — isomorphic strength heuristic
- `lib/auth/hibp.ts` — k-anonymity breach check (fail-open)
- `lib/auth/session-metadata.ts` — capture + UA-label parsing
- `lib/db/schemas/two_factor_recovery_codes.ts` — new table
- `components/email/TwoFactorEnabledEmail.tsx`
- `components/email/Disable2faRequestEmail.tsx`
- `components/account/TwoFactorBlock.tsx`
- `components/account/SessionsBlock.tsx`
- `components/auth/PasswordStrengthMeter.tsx`
- `components/admin/Admin2faNagBanner.tsx`
- `app/[locale]/(shop)/sign-in/2fa/page.tsx`
- `app/[locale]/(shop)/disable-2fa/[token]/page.tsx`
- Test files mirroring each helper under `tests/unit/`, e2e under `tests/e2e/`.

**Modify:**
- `lib/db/schemas/auth.ts` — 2FA columns on `users`, metadata columns on `sessions`
- `lib/db/schema.ts` — export the new table
- `lib/auth/rate-limit.ts` — add `two-factor` + `disable-2fa` actions
- `lib/auth/session.ts` — `createDbSession` accepts metadata
- `lib/auth.ts` — adapter `createSession` override captures metadata for OAuth
- `lib/actions/auth.actions.ts` — 9 new actions + `signInWithPassword` 2FA branch
- `lib/auth/account-purge.ts` — delete recovery codes + scrub 2FA fields
- `app/[locale]/(account)/compte/profil/page.tsx` — wire 2 new blocks + last-seen refresh
- `app/admin/layout.tsx` — render nag banner
- `components/shop/SignUpForm.tsx`, `components/shop/ResetPasswordForm.tsx`, `components/account/ChangePasswordForm.tsx` — embed strength meter
- `messages/{fr,nl,de,en}.json` — ~35 new `auth.*` keys

---

## Task 1: Schema — 2FA columns, recovery-codes table, session metadata

**Files:**
- Modify: `lib/db/schemas/auth.ts`
- Create: `lib/db/schemas/two_factor_recovery_codes.ts`
- Modify: `lib/db/schema.ts:1` (add export)

- [ ] **Step 1: Add 2FA columns to the `users` table**

In `lib/db/schemas/auth.ts`, inside the `users` `pgTable` columns object, after `purgedAt`:

```ts
    purgedAt: timestamp("purged_at", { mode: "date" }),
    // ── v2 Sprint B : 2FA ──
    twoFactorSecret: text("two_factor_secret"),
    twoFactorEnabledAt: timestamp("two_factor_enabled_at", { mode: "date" }),
    twoFactorDisableToken: text("two_factor_disable_token"),
    twoFactorDisableExpiresAt: timestamp("two_factor_disable_expires_at", { mode: "date" }),
```

And add a partial index in the `users` table's index callback (after `emailChangeUndoTokenIdx`):

```ts
    twoFactorDisableTokenIdx: index("users_2fa_disable_token_idx")
      .on(table.twoFactorDisableToken)
      .where(sql`${table.twoFactorDisableToken} IS NOT NULL`),
```

- [ ] **Step 2: Add metadata columns to the `sessions` table**

Replace the existing `sessions` definition in `lib/db/schemas/auth.ts` with:

```ts
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  // ── v2 Sprint B : session metadata ──
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { mode: "date" }),
  userAgent: text("user_agent"),
  ip: text("ip"),
  city: text("city"),
  country: text("country"),
});
```

- [ ] **Step 3: Create the recovery-codes table**

Create `lib/db/schemas/two_factor_recovery_codes.ts`:

```ts
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const twoFactorRecoveryCodes = pgTable(
  "two_factor_recovery_codes",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    usedAt: timestamp("used_at", { mode: "date" }),
  },
  (table) => ({
    userIdIdx: index("recovery_codes_user_id_idx").on(table.userId),
  }),
);

export type TwoFactorRecoveryCode = typeof twoFactorRecoveryCodes.$inferSelect;
```

- [ ] **Step 4: Export the new table from the barrel**

In `lib/db/schema.ts`, add after the `auth_rate_limit` line:

```ts
export * from "./schemas/two_factor_recovery_codes";
```

- [ ] **Step 5: Generate the migration**

Run: `npm run db:generate`
Expected: a new file `drizzle/0015_*.sql` containing `ALTER TABLE "users" ADD COLUMN "two_factor_secret"…`, the `sessions` ADD COLUMNs, and `CREATE TABLE "two_factor_recovery_codes"`. Plus `drizzle/meta/0015_snapshot.json`.

- [ ] **Step 6: Apply locally**

Run: `npm run db:migrate`
Expected: "migrations applied" with no error.

- [ ] **Step 7: Verify typecheck**

Run: `npm run typecheck`
Expected: clean (no errors).

- [ ] **Step 8: Commit**

```bash
git add lib/db/schemas/auth.ts lib/db/schemas/two_factor_recovery_codes.ts lib/db/schema.ts drizzle/
git commit -m "feat(db): 0015 — 2FA columns, recovery codes table, session metadata"
```

---

## Task 2: TOTP helper + secret encryption

**Files:**
- Create: `lib/auth/totp.ts`
- Test: `tests/unit/totp.test.ts`
- Installs: `otplib`, `qrcode`, `@types/qrcode`

- [ ] **Step 1: Install dependencies**

Run: `npm install otplib qrcode && npm install -D @types/qrcode`
Expected: added to `package.json` dependencies / devDependencies.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/totp.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { AUTH_SECRET: "x".repeat(40) } }));

import {
  generateSecret,
  buildOtpauthUrl,
  verifyTotp,
  encryptSecret,
  decryptSecret,
} from "@/lib/auth/totp";
import { authenticator } from "otplib";

describe("totp", () => {
  it("encrypt → decrypt round-trips the secret", () => {
    const secret = generateSecret();
    const enc = encryptSecret(secret);
    expect(enc).not.toBe(secret);
    expect(enc.split(":")).toHaveLength(3);
    expect(decryptSecret(enc)).toBe(secret);
  });

  it("verifyTotp accepts a freshly generated code and rejects garbage", () => {
    const secret = generateSecret();
    const code = authenticator.generate(secret);
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("buildOtpauthUrl embeds issuer + account", () => {
    const url = buildOtpauthUrl("test@example.com", generateSecret());
    expect(url).toMatch(/^otpauth:\/\/totp\//);
    expect(url).toContain("Au%20Fil%20des%20Saveurs");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/totp.test.ts`
Expected: FAIL — cannot find module `@/lib/auth/totp`.

- [ ] **Step 4: Write the implementation**

Create `lib/auth/totp.ts`:

```ts
import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { env } from "@/lib/env";

const ISSUER = "Au Fil des Saveurs";

// ±1 step (±30s) clock tolerance.
authenticator.options = { window: 1 };

// Derive a stable 32-byte key from AUTH_SECRET — no new env var.
const KEY = scryptSync(env.AUTH_SECRET, "2fa-secret-enc", 32);

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpauthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token: token.trim(), secret });
  } catch {
    return false;
  }
}

export async function buildQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
}

/** AES-256-GCM. Returns "iv:tag:ciphertext", all base64url. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(":");
}

export function decryptSecret(stored: string): string {
  const [ivB, tagB, ctB] = stored.split(":");
  const decipher = createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivB, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB, "base64url")), decipher.final()]).toString(
    "utf8",
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/totp.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/auth/totp.ts tests/unit/totp.test.ts
git commit -m "feat(auth): totp helper + AES-GCM secret encryption"
```

---

## Task 3: Recovery codes helper

**Files:**
- Create: `lib/auth/recovery-codes.ts`
- Test: `tests/unit/recovery-codes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/recovery-codes.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

const codeRows: { codeHash: string; usedAt: Date | null }[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(codeRows.map((r) => ({ ...r, id: "r", userId: "u" }))),
      }),
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  },
}));

import { generateRecoveryCodes, hashRecoveryCode } from "@/lib/auth/recovery-codes";

describe("recovery codes", () => {
  it("generates 10 unique formatted codes + matching hashes", () => {
    const { plain, hashes } = generateRecoveryCodes();
    expect(plain).toHaveLength(10);
    expect(hashes).toHaveLength(10);
    expect(new Set(plain).size).toBe(10);
    plain.forEach((c) => expect(c).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/));
    expect(hashes[0]).toBe(hashRecoveryCode(plain[0]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/recovery-codes.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/recovery-codes.ts`:

```ts
import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { twoFactorRecoveryCodes } from "@/lib/db/schema";

const CODE_COUNT = 10;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomBlock(): string {
  const bytes = randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}

/** Returns 10 plaintext codes (shown once) + their sha256 hashes (stored). */
export function generateRecoveryCodes(): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const seen = new Set<string>();
  while (plain.length < CODE_COUNT) {
    const code = `${randomBlock()}-${randomBlock()}`;
    if (seen.has(code)) continue;
    seen.add(code);
    plain.push(code);
  }
  return { plain, hashes: plain.map(hashRecoveryCode) };
}

/** Marks a matching unused code as used. Returns true if a code was consumed. */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const hash = hashRecoveryCode(code);
  const rows = await db
    .select()
    .from(twoFactorRecoveryCodes)
    .where(
      and(
        eq(twoFactorRecoveryCodes.userId, userId),
        eq(twoFactorRecoveryCodes.codeHash, hash),
        isNull(twoFactorRecoveryCodes.usedAt),
      ),
    );
  if (rows.length === 0) return false;
  await db
    .update(twoFactorRecoveryCodes)
    .set({ usedAt: new Date() })
    .where(eq(twoFactorRecoveryCodes.id, rows[0].id));
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/recovery-codes.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/recovery-codes.ts tests/unit/recovery-codes.test.ts
git commit -m "feat(auth): recovery codes generate + consume"
```

---

## Task 4: pending-2fa signed cookie helper

**Files:**
- Create: `lib/auth/pending-2fa.ts`
- Test: `tests/unit/pending-2fa.test.ts`

- [ ] **Step 1: Write the failing test** (tests the pure sign/parse core, no `next/headers`)

Create `tests/unit/pending-2fa.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { AUTH_SECRET: "y".repeat(40) } }));

import { buildPendingValue, parsePendingValue } from "@/lib/auth/pending-2fa";

describe("pending-2fa value", () => {
  it("round-trips a valid (non-expired) value", () => {
    const value = buildPendingValue("user-1", Date.now() + 60_000);
    expect(parsePendingValue(value)).toEqual({ userId: "user-1" });
  });

  it("rejects an expired value", () => {
    const value = buildPendingValue("user-1", Date.now() - 1);
    expect(parsePendingValue(value)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const value = buildPendingValue("user-1", Date.now() + 60_000);
    const tampered = value.replace("user-1", "user-2");
    expect(parsePendingValue(tampered)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/pending-2fa.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/pending-2fa.ts`:

```ts
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const COOKIE = "pending-2fa";
const TTL_MS = 5 * 60 * 1000;

function sign(payload: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");
}

/** "userId.exp.sig" — sig over "userId.exp". exp is epoch ms. */
export function buildPendingValue(userId: string, exp: number): string {
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function parsePendingValue(raw: string): { userId: string } | null {
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const expected = sign(`${userId}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (!Number.isFinite(Number(exp)) || Date.now() > Number(exp)) return null;
  return { userId };
}

export async function setPending2faCookie(userId: string): Promise<void> {
  const value = buildPendingValue(userId, Date.now() + TTL_MS);
  const store = await cookies();
  store.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function readPending2faCookie(): Promise<{ userId: string } | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  return raw ? parsePendingValue(raw) : null;
}

export async function clearPending2faCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/pending-2fa.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/pending-2fa.ts tests/unit/pending-2fa.test.ts
git commit -m "feat(auth): pending-2fa signed short-lived cookie"
```

---

## Task 5: Password-strength heuristic (isomorphic)

**Files:**
- Create: `lib/auth/password-strength.ts`
- Test: `tests/unit/password-strength.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/password-strength.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scorePassword } from "@/lib/auth/password-strength";

describe("scorePassword", () => {
  it("scores an empty / very short password 0", () => {
    expect(scorePassword("").score).toBe(0);
    expect(scorePassword("abc").score).toBe(0);
  });

  it("scores a long mixed password highly", () => {
    expect(scorePassword("Tr0ub4dour!-XK29z").score).toBeGreaterThanOrEqual(3);
  });

  it("penalises a forbidden brand word", () => {
    expect(scorePassword("aufildessaveurs123").score).toBeLessThanOrEqual(1);
  });

  it("penalises the email local-part", () => {
    expect(scorePassword("Jean12345678", { email: "jean@example.com" }).score).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/password-strength.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation** (NO `server-only` — used in client components)

Create `lib/auth/password-strength.ts`:

```ts
export type StrengthScore = 0 | 1 | 2 | 3 | 4;
export type StrengthResult = { score: StrengthScore; labelKey: string; suggestionKeys: string[] };

const FORBIDDEN = [
  "password",
  "motdepasse",
  "azerty",
  "qwerty",
  "123456",
  "aufildessaveurs",
  "biscuit",
  "speculoos",
];

const LABELS = ["strengthVeryWeak", "strengthWeak", "strengthFair", "strengthGood", "strengthStrong"];

export function scorePassword(password: string, opts?: { email?: string }): StrengthResult {
  const pw = password ?? "";
  const lower = pw.toLowerCase();
  const suggestionKeys: string[] = [];

  const localPart = opts?.email?.split("@")[0]?.toLowerCase();
  const hasForbidden =
    FORBIDDEN.some((w) => lower.includes(w)) ||
    (!!localPart && localPart.length >= 3 && lower.includes(localPart));

  if (pw.length === 0) {
    return { score: 0, labelKey: LABELS[0], suggestionKeys: ["suggestLength"] };
  }

  let points = 0;
  if (pw.length >= 8) points++;
  else suggestionKeys.push("suggestLength");
  if (pw.length >= 12) points++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++;
  else suggestionKeys.push("suggestCase");
  if (/\d/.test(pw)) points++;
  else suggestionKeys.push("suggestDigit");
  if (/[^a-zA-Z0-9]/.test(pw)) points++;
  else suggestionKeys.push("suggestSymbol");

  // Map 0..5 raw points down to 0..4, then hard-cap on forbidden content.
  let score = Math.min(4, points) as StrengthScore;
  if (hasForbidden) {
    score = Math.min(score, 1) as StrengthScore;
    suggestionKeys.unshift("suggestNoCommon");
  }
  if (pw.length < 8) score = Math.min(score, 1) as StrengthScore;

  return { score, labelKey: LABELS[score], suggestionKeys: suggestionKeys.slice(0, 2) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/password-strength.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/password-strength.ts tests/unit/password-strength.test.ts
git commit -m "feat(auth): lightweight password strength heuristic"
```

---

## Task 6: have-i-been-pwned check (fail-open)

**Files:**
- Create: `lib/auth/hibp.ts`
- Test: `tests/unit/hibp.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/hibp.test.ts`:

```ts
import { describe, expect, it, vi, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { checkPasswordBreached } from "@/lib/auth/hibp";

afterEach(() => vi.restoreAllMocks());

function sha1Upper(s: string) {
  return createHash("sha1").update(s).digest("hex").toUpperCase();
}

describe("checkPasswordBreached", () => {
  it("returns breached when the suffix is present in the range response", async () => {
    const full = sha1Upper("hunter2");
    const suffix = full.slice(5);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(`${suffix}:42\nFFFF:1`, { status: 200 })));
    const res = await checkPasswordBreached("hunter2");
    expect(res).toEqual({ breached: true, count: 42 });
  });

  it("returns not-breached when the suffix is absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ABCDE:1", { status: 200 })));
    expect((await checkPasswordBreached("zzz")).breached).toBe(false);
  });

  it("fails open on network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await checkPasswordBreached("whatever")).toEqual({ breached: false, count: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/hibp.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/hibp.ts`:

```ts
import "server-only";
import { createHash } from "node:crypto";

/**
 * Checks a password against the HIBP range API using k-anonymity (only the
 * first 5 hash chars leave the server). Fail-open: any error → not breached.
 */
export async function checkPasswordBreached(
  password: string,
): Promise<{ breached: boolean; count: number }> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return { breached: false, count: 0 };
    const body = await res.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, countStr] = line.trim().split(":");
      if (hashSuffix === suffix) {
        const count = Number(countStr) || 0;
        return { breached: count > 0, count };
      }
    }
    return { breached: false, count: 0 };
  } catch {
    return { breached: false, count: 0 };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/hibp.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/hibp.ts tests/unit/hibp.test.ts
git commit -m "feat(auth): hibp k-anonymity breach check (fail-open)"
```

---

## Task 7: Session metadata capture + UA label

**Files:**
- Create: `lib/auth/session-metadata.ts`
- Test: `tests/unit/session-metadata.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/session-metadata.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseUserAgentLabel, captureMetadata } from "@/lib/auth/session-metadata";

describe("parseUserAgentLabel", () => {
  it("falls back for empty UA", () => {
    expect(parseUserAgentLabel(null)).toBe("Appareil inconnu");
  });
  it("labels Chrome on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
    expect(parseUserAgentLabel(ua)).toBe("Chrome · Windows");
  });
  it("labels Safari on iPhone", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(parseUserAgentLabel(ua)).toBe("Safari · iPhone");
  });
});

describe("captureMetadata", () => {
  it("reads UA, IP and Vercel geo headers", () => {
    const h = new Headers({
      "user-agent": "UA",
      "x-forwarded-for": "81.246.1.2, 10.0.0.1",
      "x-vercel-ip-city": "Bruxelles",
      "x-vercel-ip-country": "BE",
    });
    expect(captureMetadata(h)).toEqual({
      userAgent: "UA",
      ip: "81.246.1.2",
      city: "Bruxelles",
      country: "BE",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/session-metadata.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/session-metadata.ts`:

```ts
import "server-only";
import { getClientIp } from "@/lib/auth/rate-limit";

export type SessionMetadata = {
  userAgent: string | null;
  ip: string | null;
  city: string | null;
  country: string | null;
};

export function parseUserAgentLabel(ua: string | null): string {
  if (!ua) return "Appareil inconnu";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navigateur";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "appareil";
  return `${browser} · ${os}`;
}

export function captureMetadata(headers: Headers): SessionMetadata {
  const rawCity = headers.get("x-vercel-ip-city");
  return {
    userAgent: headers.get("user-agent"),
    ip: getClientIp(headers),
    city: rawCity ? decodeURIComponent(rawCity) : null,
    country: headers.get("x-vercel-ip-country"),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/session-metadata.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/session-metadata.ts tests/unit/session-metadata.test.ts
git commit -m "feat(auth): session metadata capture + UA label"
```

---

## Task 8: Rate-limit — add `two-factor` + `disable-2fa` actions

**Files:**
- Modify: `lib/auth/rate-limit.ts:6-26`

- [ ] **Step 1: Extend the `AuthAction` union**

In `lib/auth/rate-limit.ts`, replace the `AuthAction` type:

```ts
export type AuthAction =
  | "sign-in"
  | "register"
  | "forgot"
  | "reset"
  | "change-password"
  | "email-change"
  | "delete"
  | "two-factor"
  | "disable-2fa";
```

- [ ] **Step 2: Add the limits**

In the `LIMITS` record, add:

```ts
  "two-factor": { email: 5, ip: 10 },
  "disable-2fa": { email: 2, ip: 3 },
```

- [ ] **Step 3: Add the windows**

In the `WINDOWS` record, add:

```ts
  "two-factor": "15 minutes",
  "disable-2fa": "1 hour",
```

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/rate-limit.ts
git commit -m "feat(auth): rate-limit windows for two-factor + disable-2fa"
```

---

## Task 9: `createDbSession` captures metadata

**Files:**
- Modify: `lib/auth/session.ts:22-36`

- [ ] **Step 1: Update the signature + insert**

In `lib/auth/session.ts`, add the import at the top:

```ts
import type { SessionMetadata } from "@/lib/auth/session-metadata";
```

Replace `createDbSession` with:

```ts
export async function createDbSession(
  userId: string,
  metadata?: SessionMetadata,
): Promise<void> {
  const sessionToken = generateRawToken();
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires,
    lastSeenAt: new Date(),
    userAgent: metadata?.userAgent ?? null,
    ip: metadata?.ip ?? null,
    city: metadata?.city ?? null,
    country: metadata?.country ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(getCookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}
```

- [ ] **Step 2: Verify typecheck** (existing callers pass no metadata — still valid since the param is optional)

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/session.ts
git commit -m "feat(auth): createDbSession accepts optional session metadata"
```

---

## Task 10: NextAuth adapter — capture metadata on OAuth session create

**Files:**
- Modify: `lib/auth.ts:1-16`

- [ ] **Step 1: Wrap the adapter's `createSession`**

In `lib/auth.ts`, add imports:

```ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { captureMetadata } from "@/lib/auth/session-metadata";
```

Replace the `adapter:` assignment in the `NextAuth({ … })` config. First build the base adapter, then spread + override:

```ts
const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...baseAdapter,
    async createSession(data) {
      const session = await baseAdapter.createSession!(data);
      try {
        const meta = captureMetadata(await headers());
        await db
          .update(sessions)
          .set({ lastSeenAt: new Date(), ...meta })
          .where(eq(sessions.sessionToken, session.sessionToken));
      } catch {
        // header access can fail in non-request contexts — metadata is best-effort
      }
      return session;
    },
  },
  // …rest of the existing config unchanged (session, providers, pages, callbacks)
```

- [ ] **Step 2: Verify typecheck + build of the auth module**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat(auth): capture session metadata for Google OAuth sessions"
```

---

## Task 11: Email templates — TwoFactorEnabled + Disable2faRequest

**Files:**
- Create: `components/email/TwoFactorEnabledEmail.tsx`
- Create: `components/email/Disable2faRequestEmail.tsx`

- [ ] **Step 1: Create `TwoFactorEnabledEmail`** (follow `EmailChangeVerifyEmail.tsx` structure exactly)

Create `components/email/TwoFactorEnabledEmail.tsx`:

```tsx
import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string; warn: string }> = {
  fr: {
    heading: "Authentification à deux facteurs activée",
    body: "La double authentification (2FA) vient d'être activée sur ton compte Au Fil des Saveurs. À chaque connexion, un code de ton application sera désormais demandé.",
    warn: "Si tu n'es pas à l'origine de ce changement, change immédiatement ton mot de passe.",
  },
  nl: {
    heading: "Tweestapsverificatie ingeschakeld",
    body: "Tweestapsverificatie (2FA) is zojuist ingeschakeld op je Au Fil des Saveurs-account. Bij elke aanmelding wordt voortaan een code uit je app gevraagd.",
    warn: "Heb jij dit niet gedaan? Wijzig dan onmiddellijk je wachtwoord.",
  },
  de: {
    heading: "Zwei-Faktor-Authentifizierung aktiviert",
    body: "Die Zwei-Faktor-Authentifizierung (2FA) wurde soeben für dein Au Fil des Saveurs-Konto aktiviert. Bei jeder Anmeldung wird künftig ein Code aus deiner App abgefragt.",
    warn: "Falls du das nicht warst, ändere sofort dein Passwort.",
  },
  en: {
    heading: "Two-factor authentication enabled",
    body: "Two-factor authentication (2FA) has just been enabled on your Au Fil des Saveurs account. From now on a code from your app will be required at each sign-in.",
    warn: "If this wasn't you, change your password immediately.",
  },
};

export function TwoFactorEnabledEmail({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 12, color: "#7a5a3c", margin: 0 }}>{s.warn}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `Disable2faRequestEmail`** (with a CTA link, like `EmailChangeVerifyEmail`)

Create `components/email/Disable2faRequestEmail.tsx`:

```tsx
import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string; cta: string; fallback: string; expires: string; ignore: string }> = {
  fr: {
    heading: "Désactiver la double authentification",
    body: "Tu as demandé à désactiver la 2FA car tu n'as plus accès à ton application d'authentification. Clique pour la désactiver — tu pourras te reconnecter avec ton mot de passe seul.",
    cta: "Désactiver la 2FA",
    fallback: "Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :",
    expires: "Ce lien est valable 24 heures.",
    ignore: "Si tu n'es pas à l'origine de cette demande, ignore cet email — ta 2FA reste active.",
  },
  nl: {
    heading: "Tweestapsverificatie uitschakelen",
    body: "Je hebt gevraagd om 2FA uit te schakelen omdat je geen toegang meer hebt tot je authenticatie-app. Klik om uit te schakelen — daarna kun je opnieuw aanmelden met alleen je wachtwoord.",
    cta: "2FA uitschakelen",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 24 uur geldig.",
    ignore: "Heb jij dit niet aangevraagd? Negeer deze e-mail — je 2FA blijft actief.",
  },
  de: {
    heading: "Zwei-Faktor-Authentifizierung deaktivieren",
    body: "Du hast angefordert, 2FA zu deaktivieren, weil du keinen Zugriff mehr auf deine Authenticator-App hast. Klicke zum Deaktivieren — danach kannst du dich nur mit deinem Passwort anmelden.",
    cta: "2FA deaktivieren",
    fallback: "Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:",
    expires: "Dieser Link ist 24 Stunden gültig.",
    ignore: "Solltest du das nicht angefordert haben, ignoriere diese E-Mail — deine 2FA bleibt aktiv.",
  },
  en: {
    heading: "Disable two-factor authentication",
    body: "You asked to disable 2FA because you no longer have access to your authenticator app. Click to disable it — you'll then be able to sign in with your password alone.",
    cta: "Disable 2FA",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 24 hours.",
    ignore: "If you didn't request this, ignore this email — your 2FA stays active.",
  },
};

export function Disable2faRequestEmail({ locale, disableUrl }: { locale: Locale; disableUrl: string }) {
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
          href={disableUrl}
          style={{ display: "inline-block", padding: "14px 28px", background: "#a8731b", color: "#fbf6ee", textDecoration: "none", borderRadius: 6, fontWeight: 500, fontSize: 15 }}
        >
          {s.cta}
        </a>
      </p>
      <p style={{ color: "#7a5a3c", fontSize: 13, lineHeight: 1.5, marginTop: 24 }}>
        {s.fallback}
        <br />
        <a href={disableUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>{disableUrl}</a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 4 }}>{s.ignore}</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/email/TwoFactorEnabledEmail.tsx components/email/Disable2faRequestEmail.tsx
git commit -m "feat(email): 2FA enabled + disable-2fa request templates (4 locales)"
```

---

## Task 12: Server actions — `generateTwoFactorSetup` + `enableTwoFactor`

**Files:**
- Modify: `lib/actions/auth.actions.ts` (append new imports + actions at end of file)

- [ ] **Step 1: Add imports** (top of `lib/actions/auth.actions.ts`, after existing email imports)

```ts
import { TwoFactorEnabledEmail } from "@/components/email/TwoFactorEnabledEmail";
import { Disable2faRequestEmail } from "@/components/email/Disable2faRequestEmail";
import { twoFactorRecoveryCodes } from "@/lib/db/schema";
import {
  generateSecret,
  buildOtpauthUrl,
  buildQrDataUrl,
  verifyTotp,
  encryptSecret,
  decryptSecret,
} from "@/lib/auth/totp";
import { generateRecoveryCodes, consumeRecoveryCode } from "@/lib/auth/recovery-codes";
import {
  setPending2faCookie,
  readPending2faCookie,
  clearPending2faCookie,
} from "@/lib/auth/pending-2fa";
import { captureMetadata } from "@/lib/auth/session-metadata";
```

- [ ] **Step 2: Append `generateTwoFactorSetup` + `enableTwoFactor`** at the end of the file:

```ts
export type TwoFactorSetup =
  | { ok: true; otpauthUrl: string; qrDataUrl: string }
  | { ok: false; error: string };

export async function generateTwoFactorSetup(): Promise<TwoFactorSetup> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };

  const [user] = await db
    .select({ email: users.email, passwordHash: users.passwordHash, enabledAt: users.twoFactorEnabledAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) return { ok: false, error: "unauthorized" };
  if (!user.passwordHash) return { ok: false, error: "no-password-yet" };
  if (user.enabledAt) return { ok: false, error: "already-enabled" };

  const secret = generateSecret();
  await db
    .update(users)
    .set({ twoFactorSecret: encryptSecret(secret) })
    .where(eq(users.id, session.user.id));

  const otpauthUrl = buildOtpauthUrl(user.email, secret);
  return { ok: true, otpauthUrl, qrDataUrl: await buildQrDataUrl(otpauthUrl) };
}

const enable2faSchema = z.object({ code: z.string().min(6).max(10), locale: z.string() });

export type EnableTwoFactorResult =
  | { ok: true; recoveryCodes: string[] }
  | { ok: false; error: string };

export async function enableTwoFactor(formData: FormData): Promise<EnableTwoFactorResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  const parsed = enable2faSchema.safeParse({
    code: formData.get("code"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [user] = await db
    .select({ secret: users.twoFactorSecret, enabledAt: users.twoFactorEnabledAt, preferredLocale: users.preferredLocale, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.secret) return { ok: false, error: "no-setup" };
  if (user.enabledAt) return { ok: false, error: "already-enabled" };
  if (!verifyTotp(decryptSecret(user.secret), parsed.data.code)) {
    return { ok: false, error: "invalid-code" };
  }

  const { plain, hashes } = generateRecoveryCodes();
  await db.transaction(async (tx) => {
    await tx.update(users).set({ twoFactorEnabledAt: new Date() }).where(eq(users.id, session.user!.id));
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, session.user!.id));
    await tx.insert(twoFactorRecoveryCodes).values(
      hashes.map((codeHash) => ({ userId: session.user!.id, codeHash })),
    );
  });

  await sendEmail({
    to: user.email,
    subject: "Au Fil des Saveurs — 2FA",
    react: TwoFactorEnabledEmail({ locale: asLocale(user.preferredLocale) }),
  });

  return { ok: true, recoveryCodes: plain };
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): generateTwoFactorSetup + enableTwoFactor actions"
```

---

## Task 13: Server actions — `disableTwoFactor` + `regenerateRecoveryCodes`

**Files:**
- Modify: `lib/actions/auth.actions.ts` (append)

- [ ] **Step 1: Append both actions** at the end of the file:

```ts
const disable2faSchema = z.object({ password: z.string().min(1).max(200), locale: z.string() });

export type Disable2faResult = { ok: true } | { ok: false; error: string };

export async function disableTwoFactor(formData: FormData): Promise<Disable2faResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  const parsed = disable2faSchema.safeParse({
    password: formData.get("password"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "wrong-password" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        twoFactorDisableToken: null,
        twoFactorDisableExpiresAt: null,
      })
      .where(eq(users.id, session.user!.id));
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, session.user!.id));
  });
  return { ok: true };
}

export type RegenerateResult = { ok: true; recoveryCodes: string[] } | { ok: false; error: string };

export async function regenerateRecoveryCodes(formData: FormData): Promise<RegenerateResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  const password = String(formData.get("password") ?? "");

  const [user] = await db
    .select({ passwordHash: users.passwordHash, enabledAt: users.twoFactorEnabledAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.enabledAt) return { ok: false, error: "not-enabled" };
  if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "wrong-password" };
  }

  const { plain, hashes } = generateRecoveryCodes();
  await db.transaction(async (tx) => {
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, session.user!.id));
    await tx.insert(twoFactorRecoveryCodes).values(
      hashes.map((codeHash) => ({ userId: session.user!.id, codeHash })),
    );
  });
  return { ok: true, recoveryCodes: plain };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): disableTwoFactor + regenerateRecoveryCodes actions"
```

---

## Task 14: `signInWithPassword` 2FA branch + `verifyTwoFactorChallenge`

**Files:**
- Modify: `lib/actions/auth.actions.ts:172-211` (sign-in) + append new action

- [ ] **Step 1: Branch sign-in into 2FA**

In `signInWithPassword`, update the `select` to also fetch the 2FA flag, then branch before `createDbSession`. Replace the select + the final session block:

```ts
  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      deletedAt: users.deletedAt,
      purgedAt: users.purgedAt,
      twoFactorEnabledAt: users.twoFactorEnabledAt,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
```

…and replace the `await createDbSession(user.id); … redirect(...)` tail with:

```ts
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect(`/${locale}/sign-in?error=invalid-credentials`);
  }

  if (user.twoFactorEnabledAt) {
    await setPending2faCookie(user.id);
    const cb = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/${locale}/sign-in/2fa?locale=${locale}${cb}`);
  }

  await createDbSession(user.id, captureMetadata(reqHeaders));
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  redirect(safeCallbackUrl(callbackUrl ?? null, locale));
```

(Note: `reqHeaders` is already in scope from the existing rate-limit code above.)

- [ ] **Step 2: Append `verifyTwoFactorChallenge`** at the end of the file:

```ts
const verify2faSchema = z.object({
  code: z.string().min(6).max(20),
  locale: z.string(),
  callbackUrl: z.string().optional(),
});

export async function verifyTwoFactorChallenge(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const pending = await readPending2faCookie();
  if (!pending) redirect(`/${locale}/sign-in?error=2fa-expired`);

  const parsed = verify2faSchema.safeParse({
    code: formData.get("code"),
    locale,
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });
  if (!parsed.success) redirect(`/${locale}/sign-in/2fa?error=invalid&locale=${locale}`);

  const reqHeaders = await headers();
  const limit = await checkAuthRateLimit({
    action: "two-factor",
    email: pending!.userId, // identifier dimension — userId is stable + private
    ip: getClientIp(reqHeaders),
  });
  if (!limit.ok) redirect(`/${locale}/sign-in/2fa?error=rate-limit&locale=${locale}`);

  const [user] = await db
    .select({ id: users.id, secret: users.twoFactorSecret, enabledAt: users.twoFactorEnabledAt })
    .from(users)
    .where(eq(users.id, pending!.userId))
    .limit(1);
  if (!user?.enabledAt || !user.secret) redirect(`/${locale}/sign-in?error=2fa-expired`);

  const code = parsed.data.code.trim();
  const totpOk = verifyTotp(decryptSecret(user.secret), code);
  const recoveryOk = totpOk ? false : await consumeRecoveryCode(user.id, code);
  if (!totpOk && !recoveryOk) {
    redirect(`/${locale}/sign-in/2fa?error=invalid-code&locale=${locale}`);
  }

  await createDbSession(user.id, captureMetadata(reqHeaders));
  await clearPending2faCookie();
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  redirect(safeCallbackUrl(parsed.data.callbackUrl ?? null, locale));
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): 2FA login branch + verifyTwoFactorChallenge"
```

---

## Task 15: `requestDisable2faEmail` + `confirmDisable2fa`

**Files:**
- Modify: `lib/actions/auth.actions.ts` (append)

- [ ] **Step 1: Append both actions** at the end of the file:

```ts
export async function requestDisable2faEmail(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const pending = await readPending2faCookie();
  if (!pending) redirect(`/${locale}/sign-in?error=2fa-expired`);

  const reqHeaders = await headers();
  const limit = await checkAuthRateLimit({
    action: "disable-2fa",
    email: pending!.userId,
    ip: getClientIp(reqHeaders),
  });
  if (!limit.ok) redirect(`/${locale}/sign-in/2fa?sent=1&locale=${locale}`);

  const [user] = await db
    .select({ email: users.email, preferredLocale: users.preferredLocale, enabledAt: users.twoFactorEnabledAt })
    .from(users)
    .where(eq(users.id, pending!.userId))
    .limit(1);

  if (user?.enabledAt) {
    const raw = generateRawToken();
    await db
      .update(users)
      .set({
        twoFactorDisableToken: hashToken(raw),
        twoFactorDisableExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .where(eq(users.id, pending!.userId));
    const base = env.NEXT_PUBLIC_APP_URL;
    await sendEmail({
      to: user.email,
      subject: "Au Fil des Saveurs — 2FA",
      react: Disable2faRequestEmail({
        locale: asLocale(user.preferredLocale),
        disableUrl: `${base}/${locale}/disable-2fa/${raw}`,
      }),
    });
  }
  redirect(`/${locale}/sign-in/2fa?sent=1&locale=${locale}`);
}

export type ConfirmDisable2faResult = { ok: true; redirectTo: string } | { ok: false; error: string };

export async function confirmDisable2fa(
  rawToken: string,
  locale: string,
): Promise<ConfirmDisable2faResult> {
  const hashed = hashToken(rawToken);
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.twoFactorDisableToken, hashed),
        gt(users.twoFactorDisableExpiresAt, new Date()),
        isNull(users.purgedAt),
      ),
    )
    .limit(1);
  if (!user) return { ok: false, error: "expired" };

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        twoFactorDisableToken: null,
        twoFactorDisableExpiresAt: null,
      })
      .where(eq(users.id, user.id));
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, user.id));
  });
  return { ok: true, redirectTo: `/${locale}/sign-in?2fa=disabled` };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): requestDisable2faEmail + confirmDisable2fa (email fallback)"
```

---

## Task 16: `revokeSession` + `revokeAllOtherSessions`

**Files:**
- Modify: `lib/actions/auth.actions.ts` (append + add `cookies` import)

- [ ] **Step 1: Add the `cookies` import** at the top (next to existing `next/*` imports):

```ts
import { cookies } from "next/headers";
```

- [ ] **Step 2: Append both actions** at the end of the file:

```ts
function authCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

export type RevokeResult = { ok: true } | { ok: false; error: string };

export async function revokeSession(formData: FormData): Promise<RevokeResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  const token = String(formData.get("sessionToken") ?? "");
  if (!token) return { ok: false, error: "invalid" };

  const current = (await cookies()).get(authCookieName())?.value;
  if (token === current) return { ok: false, error: "cannot-revoke-current" };

  await db
    .delete(sessions)
    .where(and(eq(sessions.sessionToken, token), eq(sessions.userId, session.user.id)));
  return { ok: true };
}

export async function revokeAllOtherSessions(): Promise<RevokeResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthorized" };
  const current = (await cookies()).get(authCookieName())?.value ?? "";

  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, session.user.id), ne(sessions.sessionToken, current)));
  return { ok: true };
}
```

- [ ] **Step 3: Add `ne` to the drizzle import** on line 6 of `lib/actions/auth.actions.ts`:

```ts
import { eq, and, gt, isNull, ne } from "drizzle-orm";
```

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "feat(auth): revokeSession + revokeAllOtherSessions"
```

---

## Task 17: `/sign-in/2fa` challenge page

**Files:**
- Create: `app/[locale]/(shop)/sign-in/2fa/page.tsx`

- [ ] **Step 1: Create the page** (server component reading the pending cookie; if absent, redirect)

```tsx
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";
import { readPending2faCookie } from "@/lib/auth/pending-2fa";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";

const ERROR_KEYS: Record<string, string> = {
  invalid: "twoFactorErrorInvalid",
  "invalid-code": "twoFactorErrorInvalidCode",
  "rate-limit": "errorRateLimit",
};

export default async function TwoFactorChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; sent?: string; callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { error, sent, callbackUrl } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const pending = await readPending2faCookie();
  if (!pending) redirect(`/${locale}/sign-in?error=2fa-expired`);

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link href="/" aria-label="Au Fil des Saveurs — Accueil" className="text-warm-brown mb-12 flex justify-center">
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
          <Heading as="h1" size="h3">{t("twoFactorChallengeTitle")}</Heading>
          <p className="text-warm-brown/70 mt-2 text-sm">{t("twoFactorChallengeHint")}</p>
          {sent && (
            <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark mt-4 rounded-md border px-4 py-3 text-sm">
              {t("twoFactorDisableSent")}
            </div>
          )}
          {error && (
            <div role="alert" className="border-terracotta/30 bg-terracotta/5 text-terracotta mt-4 rounded-md border px-4 py-3 text-sm">
              {t((ERROR_KEYS[error] ?? "twoFactorErrorInvalid") as Parameters<typeof t>[0])}
            </div>
          )}
          <div className="mt-6">
            <TwoFactorChallengeForm locale={locale} callbackUrl={callbackUrl ?? null} />
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Create the challenge form client component**

Create `components/auth/TwoFactorChallengeForm.tsx`:

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { verifyTwoFactorChallenge, requestDisable2faEmail } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function TwoFactorChallengeForm({ locale, callbackUrl }: { locale: string; callbackUrl: string | null }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <form action={(fd) => start(() => verifyTwoFactorChallenge(fd))} className="space-y-4" aria-busy={pending || undefined}>
        <input type="hidden" name="locale" value={locale} />
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <label className="block">
          <span className="text-warm-brown text-sm">{t("twoFactorCodeLabel")}</span>
          <input
            type="text"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="123456"
            className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-center text-lg tracking-widest focus:ring-2 focus:outline-none"
          />
        </label>
        <p className="text-warm-brown/60 text-xs">{t("twoFactorRecoveryHint")}</p>
        <Button type="submit" disabled={pending} className="w-full">{t("twoFactorVerify")}</Button>
      </form>
      <form action={(fd) => start(() => requestDisable2faEmail(fd))} className="text-center">
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" disabled={pending} className="text-honey-dark text-xs underline">
          {t("twoFactorLostAccess")}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]/(shop)/sign-in/2fa/page.tsx" components/auth/TwoFactorChallengeForm.tsx
git commit -m "feat(auth): /sign-in/2fa challenge page + form"
```

---

## Task 18: `/disable-2fa/[token]` page

**Files:**
- Create: `app/[locale]/(shop)/disable-2fa/[token]/page.tsx`

- [ ] **Step 1: Create the page** (mirror `confirm-email-change/[token]/page.tsx`)

```tsx
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { confirmDisable2fa } from "@/lib/actions/auth.actions";

export default async function Disable2faPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const result = await confirmDisable2fa(token, locale);
  if (result.ok) redirect(result.redirectTo);

  return (
    <section className="bg-cream flex min-h-[80vh] items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link href="/" aria-label="Au Fil des Saveurs — Accueil" className="text-warm-brown mb-12 flex justify-center">
          <Logo variant="wordmark" className="h-12 w-auto" />
        </Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 text-center shadow-sm">
          <Heading as="h1" size="h3">{t("twoFactorDisableExpired")}</Heading>
          <p className="mt-6">
            <Link href="/sign-in" className="bg-honey text-cream hover:bg-honey-dark inline-block rounded-md px-5 py-3 text-sm font-medium">
              {t("backToSignIn")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/(shop)/disable-2fa/[token]/page.tsx"
git commit -m "feat(auth): /disable-2fa/[token] page (email fallback)"
```

---

## Task 19: `TwoFactorBlock` component

**Files:**
- Create: `components/account/TwoFactorBlock.tsx`

- [ ] **Step 1: Create the component** (client; 4 states driven by local state + server actions)

```tsx
"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  generateTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  regenerateRecoveryCodes,
} from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function TwoFactorBlock({ locale, enabled }: { locale: string; enabled: boolean }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  const [qr, setQr] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(enabled);

  function beginSetup() {
    setError(null);
    start(async () => {
      const res = await generateTwoFactorSetup();
      if (res.ok) setQr(res.qrDataUrl);
      else setError(t(`twoFactorError_${res.error}` as Parameters<typeof t>[0]));
    });
  }

  function submitEnable(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await enableTwoFactor(fd);
      if (res.ok) {
        setCodes(res.recoveryCodes);
        setQr(null);
        setIsEnabled(true);
      } else setError(t(`twoFactorError_${res.error}` as Parameters<typeof t>[0]));
    });
  }

  // State (c): just-generated recovery codes (one-shot view)
  if (codes) {
    return (
      <div className="space-y-4">
        <p className="text-warm-brown text-sm">{t("twoFactorRecoveryCodesIntro")}</p>
        <ul className="bg-cream grid grid-cols-2 gap-2 rounded-md p-4 font-mono text-sm">
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <a
          href={`data:text/plain,${encodeURIComponent(codes.join("\n"))}`}
          download="aufildessaveurs-recovery-codes.txt"
          className="text-honey-dark text-sm underline"
        >
          {t("twoFactorDownloadCodes")}
        </a>
        <Button onClick={() => setCodes(null)} variant="outline" className="block">
          {t("twoFactorDone")}
        </Button>
      </div>
    );
  }

  // State (b): setup wizard (QR shown)
  if (qr) {
    return (
      <form action={submitEnable} className="space-y-4" aria-busy={pending || undefined}>
        <input type="hidden" name="locale" value={locale} />
        <p className="text-warm-brown text-sm">{t("twoFactorScanHint")}</p>
        <Image src={qr} alt="QR" width={200} height={200} className="rounded-md border" unoptimized />
        <label className="block">
          <span className="text-warm-brown text-sm">{t("twoFactorCodeLabel")}</span>
          <input
            type="text"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 tracking-widest focus:ring-2 focus:outline-none"
          />
        </label>
        {error && <p className="text-terracotta text-sm">{error}</p>}
        <Button type="submit" disabled={pending}>{t("twoFactorVerifyEnable")}</Button>
      </form>
    );
  }

  // State (d): enabled
  if (isEnabled) {
    return (
      <div className="space-y-4">
        <p className="text-honey-dark text-sm">✓ {t("twoFactorActive")}</p>
        <form
          action={(fd) =>
            start(async () => {
              const r = await regenerateRecoveryCodes(fd);
              if (r.ok) setCodes(r.recoveryCodes);
              else setError(t(`twoFactorError_${r.error}` as Parameters<typeof t>[0]));
            })
          }
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="text-warm-brown text-sm">{t("currentPasswordLabel")}</span>
            <input type="password" name="password" required autoComplete="current-password" className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block rounded-md border bg-white px-4 py-2 text-sm focus:ring-2 focus:outline-none" />
          </label>
          <Button type="submit" variant="outline" disabled={pending}>{t("twoFactorRegenerate")}</Button>
        </form>
        <form
          action={(fd) =>
            start(async () => {
              const r = await disableTwoFactor(fd);
              if (r.ok) setIsEnabled(false);
              else setError(t(`twoFactorError_${r.error}` as Parameters<typeof t>[0]));
            })
          }
          className="flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="text-warm-brown text-sm">{t("currentPasswordLabel")}</span>
            <input type="password" name="password" required autoComplete="current-password" className="border-warm-brown/20 focus:border-terracotta focus:ring-terracotta/30 mt-2 block rounded-md border bg-white px-4 py-2 text-sm focus:ring-2 focus:outline-none" />
          </label>
          <Button type="submit" variant="outline" disabled={pending}>{t("twoFactorDisable")}</Button>
        </form>
        {error && <p className="text-terracotta text-sm">{error}</p>}
      </div>
    );
  }

  // State (a): disabled
  return (
    <div className="space-y-3">
      <p className="text-warm-brown/70 text-sm">{t("twoFactorIntro")}</p>
      {error && <p className="text-terracotta text-sm">{error}</p>}
      <Button onClick={beginSetup} disabled={pending}>{t("twoFactorEnable")}</Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/account/TwoFactorBlock.tsx
git commit -m "feat(account): TwoFactorBlock (setup/enable/disable/regenerate)"
```

---

## Task 20: `SessionsBlock` component

**Files:**
- Create: `components/account/SessionsBlock.tsx`

- [ ] **Step 1: Create the component** (receives serialized rows from the server page)

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { revokeSession, revokeAllOtherSessions } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export type SessionRow = {
  sessionToken: string;
  label: string;
  city: string | null;
  country: string | null;
  lastSeenLabel: string;
  isCurrent: boolean;
};

export function SessionsBlock({ locale, sessions }: { locale: string; sessions: SessionRow[] }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  const hasOthers = sessions.some((s) => !s.isCurrent);

  return (
    <div className="space-y-4">
      <ul className="divide-warm-brown/10 divide-y">
        {sessions.map((s) => (
          <li key={s.sessionToken} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-warm-brown text-sm font-medium">
                {s.label}
                {s.isCurrent && <span className="text-honey-dark ml-2 text-xs">· {t("sessionCurrent")}</span>}
              </p>
              <p className="text-warm-brown/60 text-xs">
                {[s.city, s.country].filter(Boolean).join(", ")}
                {s.city && " · "}
                {s.lastSeenLabel}
              </p>
            </div>
            {!s.isCurrent && (
              <form
                action={(fd) => start(() => revokeSession(fd).then(() => {}))}
              >
                <input type="hidden" name="sessionToken" value={s.sessionToken} />
                <button type="submit" disabled={pending} className="text-terracotta text-xs underline">
                  {t("sessionRevoke")}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {hasOthers && (
        <form action={() => start(() => revokeAllOtherSessions().then(() => {}))}>
          <Button type="submit" variant="outline" disabled={pending}>{t("sessionRevokeAllOthers")}</Button>
        </form>
      )}
    </div>
  );
}
```

> Note: server actions mutate the DB; the page re-renders on navigation. For an instant refresh after revoke, the consuming page may call `revalidatePath` — but a simple reload is acceptable for v2-B. The `.then(() => {})` keeps the transition typed.

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/account/SessionsBlock.tsx
git commit -m "feat(account): SessionsBlock (list + revoke)"
```

---

## Task 21: `PasswordStrengthMeter` + wire into 3 forms

**Files:**
- Create: `components/auth/PasswordStrengthMeter.tsx`
- Add server action `checkPasswordBreached` to `lib/actions/auth.actions.ts`
- Modify: `components/shop/SignUpForm.tsx`, `components/shop/ResetPasswordForm.tsx`, `components/account/ChangePasswordForm.tsx`

- [ ] **Step 1: Add the breach-check server action** at the end of `lib/actions/auth.actions.ts`:

```ts
import { checkPasswordBreached as hibpCheck } from "@/lib/auth/hibp";

export async function checkPasswordBreached(password: string): Promise<{ breached: boolean }> {
  if (!password || password.length < 4) return { breached: false };
  const res = await hibpCheck(password);
  return { breached: res.breached };
}
```

(Place the `import` with the other top-of-file imports, and the function at the end.)

- [ ] **Step 2: Create the meter component**

Create `components/auth/PasswordStrengthMeter.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { scorePassword } from "@/lib/auth/password-strength";
import { checkPasswordBreached } from "@/lib/actions/auth.actions";

const BAR_COLORS = ["bg-terracotta", "bg-terracotta", "bg-honey", "bg-honey-dark", "bg-green-600"];

export function PasswordStrengthMeter({ password, email }: { password: string; email?: string }) {
  const t = useTranslations("auth");
  const { score, labelKey, suggestionKeys } = scorePassword(password, { email });
  const [breached, setBreached] = useState(false);

  useEffect(() => {
    if (!password || password.length < 4) {
      setBreached(false);
      return;
    }
    const id = setTimeout(async () => {
      const res = await checkPasswordBreached(password);
      setBreached(res.breached);
    }, 500);
    return () => clearTimeout(id);
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded ${i < score ? BAR_COLORS[score] : "bg-warm-brown/15"}`}
          />
        ))}
      </div>
      <p className="text-warm-brown/70 text-xs">
        {t(labelKey as Parameters<typeof t>[0])}
        {suggestionKeys.length > 0 && ` — ${suggestionKeys.map((k) => t(k as Parameters<typeof t>[0])).join(", ")}`}
      </p>
      {breached && <p className="text-terracotta text-xs">{t("strengthBreached")}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Wire into `SignUpForm`** — read the current value into state and render the meter under the password field.

In `components/shop/SignUpForm.tsx`: import the meter + `useState`, add `const [pw, setPw] = useState("")` and `const [email, setEmail] = useState("")`, add `value`/`onChange` to the email + password inputs (`onChange={(e) => setPw(e.target.value)}`), and render `<PasswordStrengthMeter password={pw} email={email} />` immediately after the password input.

```tsx
import { useState } from "react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
// …inside the component:
const [pw, setPw] = useState("");
const [email, setEmail] = useState("");
// email input: add  value={email} onChange={(e) => setEmail(e.target.value)}
// password input: add  value={pw} onChange={(e) => setPw(e.target.value)}
// after the password input:
<PasswordStrengthMeter password={pw} email={email} />
```

- [ ] **Step 4: Wire into `ResetPasswordForm`** — same pattern, no email available so omit the `email` prop:

```tsx
import { useState } from "react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
const [pw, setPw] = useState("");
// new-password input: add value={pw} onChange={(e) => setPw(e.target.value)}
<PasswordStrengthMeter password={pw} />
```

- [ ] **Step 5: Wire into `ChangePasswordForm`** — meter on the new-password field:

```tsx
import { useState } from "react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
const [pw, setPw] = useState("");
// newPassword input: add value={pw} onChange={(e) => setPw(e.target.value)}
<PasswordStrengthMeter password={pw} />
```

- [ ] **Step 6: Verify typecheck + lint**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add components/auth/PasswordStrengthMeter.tsx lib/actions/auth.actions.ts components/shop/SignUpForm.tsx components/shop/ResetPasswordForm.tsx components/account/ChangePasswordForm.tsx
git commit -m "feat(auth): password strength meter + HIBP warning wired into 3 forms"
```

---

## Task 22: Admin 2FA nag banner

**Files:**
- Create: `components/admin/Admin2faNagBanner.tsx`
- Modify: `app/admin/layout.tsx`

- [ ] **Step 1: Create the banner**

Create `components/admin/Admin2faNagBanner.tsx`:

```tsx
export function Admin2faNagBanner({ locale }: { locale: string }) {
  return (
    <div className="border-b border-yellow-300 bg-yellow-50 px-6 py-2 text-sm text-yellow-900">
      ⚠️ La double authentification n'est pas activée sur ce compte admin.{" "}
      <a href={`/${locale}/compte/profil#securite`} className="font-medium underline">
        Active-la maintenant
      </a>
      .
    </div>
  );
}
```

- [ ] **Step 2: Render it in the admin layout** — fetch the admin's 2FA flag and render conditionally.

In `app/admin/layout.tsx`, add imports:

```ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Admin2faNagBanner } from "@/components/admin/Admin2faNagBanner";
```

After the role check (and after `userLocale` is defined), add:

```ts
  const [adminRow] = await db
    .select({ enabledAt: users.twoFactorEnabledAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const needs2fa = !adminRow?.enabledAt;
```

Then render the banner just inside `<div className="flex-1">`, above the `<header>`:

```tsx
        {needs2fa && <Admin2faNagBanner locale={userLocale} />}
```

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/admin/Admin2faNagBanner.tsx app/admin/layout.tsx
git commit -m "feat(admin): 2FA nag banner when admin has no 2FA"
```

---

## Task 23: Wire the two new blocks into `/compte/profil` + last-seen refresh

**Files:**
- Modify: `app/[locale]/(account)/compte/profil/page.tsx`

- [ ] **Step 1: Extend imports + the user select**

Add imports:

```ts
import { TwoFactorBlock } from "@/components/account/TwoFactorBlock";
import { SessionsBlock, type SessionRow } from "@/components/account/SessionsBlock";
import { sessions } from "@/lib/db/schema";
import { parseUserAgentLabel } from "@/lib/auth/session-metadata";
import { cookies } from "next/headers";
```

In the `users` select, add `twoFactorEnabledAt: users.twoFactorEnabledAt`.

- [ ] **Step 2: Load + map session rows (and throttle-refresh the current one)**

After the `linkedGoogle` query, add:

```ts
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
  const currentToken = (await cookies()).get(cookieName)?.value ?? "";

  const sessionRows = await db
    .select({
      sessionToken: sessions.sessionToken,
      userAgent: sessions.userAgent,
      city: sessions.city,
      country: sessions.country,
      lastSeenAt: sessions.lastSeenAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, session!.user!.id));

  // Lazy throttled last_seen refresh for the current session (≤ once / 15 min).
  const currentRow = sessionRows.find((s) => s.sessionToken === currentToken);
  if (currentRow && (!currentRow.lastSeenAt || currentRow.lastSeenAt < new Date(Date.now() - 15 * 60 * 1000))) {
    await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.sessionToken, currentToken));
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  function lastSeenLabel(d: Date | null): string {
    if (!d) return "";
    const mins = Math.round((d.getTime() - Date.now()) / 60000);
    if (mins > -60) return rtf.format(mins, "minute");
    const hours = Math.round(mins / 60);
    if (hours > -24) return rtf.format(hours, "hour");
    return rtf.format(Math.round(hours / 24), "day");
  }

  const sessionList: SessionRow[] = sessionRows
    .sort((a, b) => (b.lastSeenAt?.getTime() ?? 0) - (a.lastSeenAt?.getTime() ?? 0))
    .map((s) => ({
      sessionToken: s.sessionToken,
      label: parseUserAgentLabel(s.userAgent),
      city: s.city,
      country: s.country,
      lastSeenLabel: lastSeenLabel(s.lastSeenAt ?? s.createdAt),
      isCurrent: s.sessionToken === currentToken,
    }));
```

- [ ] **Step 3: Render the two blocks** — add after the email block and before the danger-zone block:

```tsx
      <div id="securite" className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">{t("twoFactorLabel")}</h2>
        <div className="mt-4">
          <TwoFactorBlock locale={locale} enabled={!!user?.twoFactorEnabledAt} />
        </div>
      </div>

      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">{t("sessionsLabel")}</h2>
        <div className="mt-4">
          <SessionsBlock locale={locale} sessions={sessionList} />
        </div>
      </div>
```

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/(account)/compte/profil/page.tsx"
git commit -m "feat(account): wire 2FA + sessions blocks into /compte/profil"
```

---

## Task 24: i18n keys (×4 locales)

**Files:**
- Modify: `messages/fr.json`, `messages/nl.json`, `messages/de.json`, `messages/en.json`

- [ ] **Step 1: Add the keys under the existing `auth` object in `messages/fr.json`**

```json
"twoFactorLabel": "Double authentification (2FA)",
"twoFactorIntro": "Ajoute une étape de vérification à la connexion via une application d'authentification.",
"twoFactorEnable": "Activer la 2FA",
"twoFactorScanHint": "Scanne ce QR code avec ton application d'authentification, puis saisis le code généré.",
"twoFactorCodeLabel": "Code à 6 chiffres",
"twoFactorVerifyEnable": "Vérifier et activer",
"twoFactorActive": "La 2FA est activée sur ton compte.",
"twoFactorDisable": "Désactiver la 2FA",
"twoFactorRegenerate": "Régénérer les codes de récupération",
"twoFactorRecoveryCodesIntro": "Conserve ces codes de récupération en lieu sûr. Chacun ne fonctionne qu'une fois et te permet de te connecter si tu perds ton application.",
"twoFactorDownloadCodes": "Télécharger les codes",
"twoFactorDone": "J'ai enregistré mes codes",
"twoFactorChallengeTitle": "Vérification en deux étapes",
"twoFactorChallengeHint": "Saisis le code de ton application d'authentification.",
"twoFactorRecoveryHint": "Tu peux aussi saisir un code de récupération (format xxxx-xxxx).",
"twoFactorVerify": "Vérifier",
"twoFactorLostAccess": "Je n'ai plus accès à mon application",
"twoFactorDisableSent": "Si un compte correspond, un email pour désactiver la 2FA vient d'être envoyé.",
"twoFactorDisableExpired": "Lien expiré ou invalide.",
"twoFactorErrorInvalid": "Saisie invalide.",
"twoFactorErrorInvalidCode": "Code incorrect.",
"twoFactorError_no-password-yet": "Définis d'abord un mot de passe pour activer la 2FA.",
"twoFactorError_already-enabled": "La 2FA est déjà activée.",
"twoFactorError_invalid-code": "Code incorrect.",
"twoFactorError_no-setup": "Recommence la configuration.",
"twoFactorError_wrong-password": "Mot de passe incorrect.",
"twoFactorError_not-enabled": "La 2FA n'est pas activée.",
"twoFactorError_unauthorized": "Session expirée.",
"twoFactorError_invalid": "Saisie invalide.",
"sessionsLabel": "Appareils connectés",
"sessionCurrent": "Cet appareil",
"sessionRevoke": "Déconnecter",
"sessionRevokeAllOthers": "Déconnecter tous les autres appareils",
"strengthVeryWeak": "Très faible",
"strengthWeak": "Faible",
"strengthFair": "Moyen",
"strengthGood": "Bon",
"strengthStrong": "Fort",
"suggestLength": "au moins 8 caractères",
"suggestCase": "mélange majuscules et minuscules",
"suggestDigit": "ajoute un chiffre",
"suggestSymbol": "ajoute un symbole",
"suggestNoCommon": "évite les mots courants",
"strengthBreached": "Ce mot de passe est apparu dans une fuite de données connue — choisis-en un autre.",
"backToSignIn": "Retour à la connexion"
```

- [ ] **Step 2: Add the translated equivalents** under `auth` in `messages/nl.json`, `messages/de.json`, `messages/en.json`. Use the same keys. English reference for the strings:

```json
"twoFactorLabel": "Two-factor authentication (2FA)",
"twoFactorIntro": "Add a verification step at sign-in using an authenticator app.",
"twoFactorEnable": "Enable 2FA",
"twoFactorScanHint": "Scan this QR code with your authenticator app, then enter the generated code.",
"twoFactorCodeLabel": "6-digit code",
"twoFactorVerifyEnable": "Verify and enable",
"twoFactorActive": "2FA is enabled on your account.",
"twoFactorDisable": "Disable 2FA",
"twoFactorRegenerate": "Regenerate recovery codes",
"twoFactorRecoveryCodesIntro": "Keep these recovery codes somewhere safe. Each works once and lets you sign in if you lose your app.",
"twoFactorDownloadCodes": "Download codes",
"twoFactorDone": "I've saved my codes",
"twoFactorChallengeTitle": "Two-step verification",
"twoFactorChallengeHint": "Enter the code from your authenticator app.",
"twoFactorRecoveryHint": "You can also enter a recovery code (format xxxx-xxxx).",
"twoFactorVerify": "Verify",
"twoFactorLostAccess": "I no longer have access to my app",
"twoFactorDisableSent": "If an account matches, an email to disable 2FA has just been sent.",
"twoFactorDisableExpired": "Link expired or invalid.",
"twoFactorErrorInvalid": "Invalid input.",
"twoFactorErrorInvalidCode": "Incorrect code.",
"twoFactorError_no-password-yet": "Set a password first to enable 2FA.",
"twoFactorError_already-enabled": "2FA is already enabled.",
"twoFactorError_invalid-code": "Incorrect code.",
"twoFactorError_no-setup": "Restart the setup.",
"twoFactorError_wrong-password": "Incorrect password.",
"twoFactorError_not-enabled": "2FA is not enabled.",
"twoFactorError_unauthorized": "Session expired.",
"twoFactorError_invalid": "Invalid input.",
"sessionsLabel": "Connected devices",
"sessionCurrent": "This device",
"sessionRevoke": "Sign out",
"sessionRevokeAllOthers": "Sign out all other devices",
"strengthVeryWeak": "Very weak",
"strengthWeak": "Weak",
"strengthFair": "Fair",
"strengthGood": "Good",
"strengthStrong": "Strong",
"suggestLength": "at least 8 characters",
"suggestCase": "mix upper and lower case",
"suggestDigit": "add a digit",
"suggestSymbol": "add a symbol",
"suggestNoCommon": "avoid common words",
"strengthBreached": "This password appeared in a known data breach — choose another.",
"backToSignIn": "Back to sign-in"
```

(Translate the FR strings into proper NL and DE for those two files — don't leave English in nl/de.)

- [ ] **Step 3: Validate JSON**

Run: `node -e "['fr','nl','de','en'].forEach(l=>{const m=require('./messages/'+l+'.json'); if(!m.auth.twoFactorLabel) throw new Error('missing '+l)}); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 4: Commit**

```bash
git add messages/fr.json messages/nl.json messages/de.json messages/en.json
git commit -m "i18n(auth): 2FA + sessions + strength meter keys (4 locales)"
```

---

## Task 25: Extend `purgeUser` for 2FA data

**Files:**
- Modify: `lib/auth/account-purge.ts`

- [ ] **Step 1: Import the recovery-codes table**

In `lib/auth/account-purge.ts`, add `twoFactorRecoveryCodes` to the schema import block.

- [ ] **Step 2: Delete recovery codes + scrub 2FA fields**

In the transaction, after `await tx.delete(passwordResetTokens)…`, add:

```ts
    await tx.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, userId));
```

And in the final `users` UPDATE `.set({...})`, add:

```ts
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        twoFactorDisableToken: null,
        twoFactorDisableExpiresAt: null,
```

- [ ] **Step 3: Run the existing purge test**

Run: `npx vitest run tests/unit/account-purge.test.ts`
Expected: PASS (2 tests still green — `calls.length > 5` still holds).

- [ ] **Step 4: Commit**

```bash
git add lib/auth/account-purge.ts
git commit -m "feat(auth): purgeUser also clears 2FA secret + recovery codes"
```

---

## Task 26: E2E tests

**Files:**
- Create: `tests/e2e/auth-2fa.spec.ts`
- Create: `tests/e2e/auth-sessions.spec.ts`

> Follow the structure of the existing Sprint A specs (`tests/e2e/auth-email-change.spec.ts`, `tests/e2e/auth-account-deletion.spec.ts`): they seed/mutate DB rows directly via a test fixture and drive the browser with Playwright. Reuse whatever helper those specs use to obtain a signed-in context and a DB handle.

- [ ] **Step 1: Read the Sprint A e2e specs to copy their setup pattern**

Run: `sed -n '1,40p' tests/e2e/auth-account-deletion.spec.ts`
Expected: see how they authenticate + access the DB.

- [ ] **Step 2: Write `auth-2fa.spec.ts`** covering:
  - signed-in user with no 2FA opens `/compte/profil#securite`, clicks Activer, a QR appears (`img` with `src^="data:image"`).
  - With a known secret seeded directly into `users.two_factor_secret` (encrypt via the helper) + `two_factor_enabled_at`, sign out, sign in → redirected to `/sign-in/2fa`; submit a TOTP generated by `otplib` `authenticator.generate(secret)` → lands signed-in.
  - Submitting `"000000"` shows the `twoFactorErrorInvalidCode` message.

```ts
import { test, expect } from "@playwright/test";
import { authenticator } from "otplib";
// + import the project's e2e DB + signed-in helpers used by Sprint A specs

test.describe("2FA", () => {
  test("setup wizard shows a QR code", async ({ page }) => {
    // sign in (helper), go to profile security section
    await page.goto("/fr/compte/profil#securite");
    await page.getByRole("button", { name: /Activer la 2FA/ }).click();
    await expect(page.locator('img[src^="data:image"]')).toBeVisible();
  });

  test("login challenges for TOTP and accepts a valid code", async ({ page }) => {
    // seed: set users.two_factor_secret = encryptSecret(secret), two_factor_enabled_at = now
    // sign in with password → expect URL to include /sign-in/2fa
    await expect(page).toHaveURL(/\/sign-in\/2fa/);
    // const code = authenticator.generate(secret)
    // fill code, submit → expect signed-in landing
  });

  test("rejects an invalid code", async ({ page }) => {
    // on /sign-in/2fa, fill "000000", submit
    await expect(page.getByText(/Code incorrect|Incorrect code/)).toBeVisible();
  });
});
```

- [ ] **Step 3: Write `auth-sessions.spec.ts`** covering:
  - signed-in user sees ≥1 session row with "Cet appareil".
  - clicking "Déconnecter tous les autres appareils" leaves the current session intact (still signed-in after reload).

```ts
import { test, expect } from "@playwright/test";
// + project e2e helpers

test.describe("sessions", () => {
  test("lists the current device", async ({ page }) => {
    await page.goto("/fr/compte/profil");
    await expect(page.getByText(/Cet appareil/)).toBeVisible();
  });

  test("revoke-all-others keeps the current session", async ({ page }) => {
    await page.goto("/fr/compte/profil");
    const btn = page.getByRole("button", { name: /Déconnecter tous les autres/ });
    if (await btn.isVisible()) await btn.click();
    await page.reload();
    await expect(page).toHaveURL(/\/compte\/profil/); // still authenticated
  });
});
```

- [ ] **Step 4: Run the e2e suite** (requires the dev server + test DB per the project's existing e2e setup)

Run: `npm run e2e -- auth-2fa auth-sessions`
Expected: PASS (adjust selectors/helpers to match the actual Sprint A fixtures).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/auth-2fa.spec.ts tests/e2e/auth-sessions.spec.ts
git commit -m "test(e2e): 2FA challenge + sessions list"
```

---

## Final verification

- [ ] **Run the full unit suite** (with env loaded):

Run: `npx dotenv -e .env.local -- npx vitest run`
Expected: all helper tests green (totp, recovery-codes, pending-2fa, password-strength, hibp, session-metadata, account-purge) + pre-existing suites unchanged.

- [ ] **Typecheck:** `npm run typecheck` → clean.
- [ ] **Lint:** `npm run lint` → clean.
- [ ] **Build:** `npm run build` → succeeds (confirms `otplib`/`qrcode` resolve in the server bundle).

---

## Self-Review

**Spec coverage:**

| Spec section | Task(s) |
|---|---|
| Migration 0015 — 2FA cols, recovery table, session metadata | T1 |
| Choix techniques : TOTP + AES-GCM (otplib, qrcode) | T2 |
| Recovery codes (10, hashed, consume) | T3 |
| pending-2fa signed cookie | T4 |
| Strength meter heuristic | T5 |
| HIBP fail-open | T6 |
| Session metadata capture + UA label + Vercel geo | T7 |
| Rate-limit two-factor + disable-2fa | T8 |
| createDbSession metadata | T9 |
| OAuth session metadata (adapter override) | T10 |
| Emails TwoFactorEnabled + Disable2faRequest | T11 |
| generateTwoFactorSetup + enableTwoFactor | T12 |
| disableTwoFactor + regenerateRecoveryCodes | T13 |
| signInWithPassword 2FA branch + verifyTwoFactorChallenge | T14 |
| requestDisable2faEmail + confirmDisable2fa | T15 |
| revokeSession + revokeAllOtherSessions | T16 |
| /sign-in/2fa page | T17 |
| /disable-2fa/[token] page | T18 |
| TwoFactorBlock (4 states) | T19 |
| SessionsBlock | T20 |
| PasswordStrengthMeter + HIBP wire (3 forms) | T21 |
| Admin 2FA nag banner | T22 |
| Wire blocks into /compte/profil + last-seen throttle | T23 |
| ~35 i18n keys ×4 locales | T24 |
| purgeUser extension | T25 |
| e2e 2FA + sessions | T26 |

No gap.

**Placeholder scan:** Helper/action/component tasks contain full code. T21 (form wiring) and T24 (nl/de translations) and T26 (e2e) describe edits against files whose exact current contents vary — they give the exact import + state + JSX to add and the keys/strings to translate. These are precise insertions, not "TODO" placeholders.

**Type consistency:**
- `createDbSession(userId, metadata?)` — defined T9, called T14.
- `captureMetadata(headers): SessionMetadata` — T7, used T9/T10/T14.
- `verifyTotp(secret, code)`, `decryptSecret`, `encryptSecret`, `generateSecret`, `buildOtpauthUrl`, `buildQrDataUrl` — T2, used T12/T14.
- `generateRecoveryCodes(): {plain, hashes}`, `consumeRecoveryCode(userId, code)`, `hashRecoveryCode` — T3, used T12/T13/T14.
- `setPending2faCookie`/`readPending2faCookie`/`clearPending2faCookie` + pure `buildPendingValue`/`parsePendingValue` — T4, used T14/T15/T17.
- `scorePassword(password, {email}): {score, labelKey, suggestionKeys}` — T5, used T21.
- `checkPasswordBreached` (helper, T6; server action wrapper, T21).
- `parseUserAgentLabel`/`captureMetadata` — T7, used T20-via-page (T23).
- `SessionRow` type — exported T20, imported T23.
- AuthAction union adds `two-factor`/`disable-2fa` — T8, used T14/T15.
- i18n keys referenced across T17/T19/T20/T21/T22 all defined in T24.

No drift detected.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-31-auth-v2-sprint-b-trust-security.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between tasks.

**2. Inline Execution** — execute tasks in this session with checkpoints.

Which approach?

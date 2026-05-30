# Auth v2 Sprint A — RGPD Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RGPD-compliant account deletion (30-day cool-off + daily cron purge that anonymizes orders for accounting) and email change (verify-before-switch + 7-day undo) to the v1 auth system.

**Architecture:** All state lives on the existing `users` table (10 nullable columns: 3 for deletion, 3 for pending email, 3 for undo, 1 tombstone). 5 new server actions append to `lib/actions/auth.actions.ts`. A single `purgeUser(userId)` helper encapsulates the anonymization transaction, callable from the daily cron and unit-testable. 3 new token pages mirror the existing `/verify-email/[token]` pattern. 4 brand-themed email templates in 4 locales each.

**Tech Stack:** Next.js 15 App Router, Auth.js v5 (DB sessions), Drizzle + Neon Postgres, next-intl (4 locales), Vitest + Playwright, Resend, Vercel Cron.

**Reference spec:** `docs/superpowers/specs/2026-05-31-auth-v2-sprint-a-rgpd-design.md`

---

## File Structure

**Create:**
- `drizzle/0014_account_actions.sql` + `drizzle/meta/0014_snapshot.json` (generated)
- `lib/auth/account-purge.ts` — `purgeUser(userId)` helper
- `components/email/AccountDeletionRequestedEmail.tsx` — locale-aware
- `components/email/AccountDeletionCancelledEmail.tsx` — locale-aware
- `components/email/EmailChangeVerifyEmail.tsx` — locale-aware
- `components/email/EmailChangedNotificationEmail.tsx` — locale-aware
- `components/account/EmailChangeBlock.tsx` — client form
- `components/account/DangerZoneBlock.tsx` — client form
- `app/[locale]/(shop)/confirm-email-change/[token]/page.tsx`
- `app/[locale]/(shop)/undo-email-change/[token]/page.tsx`
- `app/[locale]/(shop)/cancel-deletion/[token]/page.tsx`
- `app/api/cron/account-purge/route.ts`
- `scripts/test-purge-locally.mjs`
- `tests/unit/account-purge.test.ts`
- `tests/e2e/auth-email-change.spec.ts`
- `tests/e2e/auth-account-deletion.spec.ts`

**Modify:**
- `lib/db/schemas/auth.ts` — add 10 columns to `users`
- `lib/auth/rate-limit.ts` — extend `AuthAction` + `LIMITS` with `email-change` + `delete`
- `lib/actions/auth.actions.ts` — append 5 server actions + extend `signInWithPassword` guard
- `lib/auth.ts` — add NextAuth `signIn` callback to block deleted/purged users on Google OAuth
- `app/[locale]/(account)/compte/profil/page.tsx` — wire 2 new blocks
- `messages/{fr,nl,de,en}.json` — add ~25 new auth.* keys
- `vercel.json` — add cron entry

---

## Phase 1 — Schema + migration

### Task 1: Add 10 columns + 4 partial indexes to `users` schema

**Files:** Modify `lib/db/schemas/auth.ts`

- [ ] **Step 1: Read the current file**

Open `lib/db/schemas/auth.ts` and locate the `users` table definition. The current shape ends with `lastLoginAt`.

- [ ] **Step 2: Add the 10 new columns**

Replace the `users` definition with the version below (only the columns block changes — keep the imports and the pgEnum declarations untouched):

```ts
export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    passwordHash: text("password_hash"),
    role: userRole("role").notNull().default("customer"),
    preferredLocale: locale("preferred_locale").notNull().default("fr"),
    newsletterOptIn: boolean("newsletter_opt_in").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
    // ── v2 Sprint A : account actions ──
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    cancelDeletionToken: text("cancel_deletion_token"),
    cancelDeletionExpiresAt: timestamp("cancel_deletion_expires_at", { mode: "date" }),
    pendingEmail: text("pending_email"),
    pendingEmailToken: text("pending_email_token"),
    pendingEmailExpiresAt: timestamp("pending_email_expires_at", { mode: "date" }),
    emailChangeUndoToken: text("email_change_undo_token"),
    emailChangeUndoExpiresAt: timestamp("email_change_undo_expires_at", { mode: "date" }),
    emailChangeUndoTo: text("email_change_undo_to"),
    purgedAt: timestamp("purged_at", { mode: "date" }),
  },
  (table) => ({
    deletedAtIdx: index("users_deleted_at_idx")
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} IS NOT NULL`),
    pendingEmailTokenIdx: index("users_pending_email_token_idx")
      .on(table.pendingEmailToken)
      .where(sql`${table.pendingEmailToken} IS NOT NULL`),
    cancelDeletionTokenIdx: index("users_cancel_deletion_token_idx")
      .on(table.cancelDeletionToken)
      .where(sql`${table.cancelDeletionToken} IS NOT NULL`),
    emailChangeUndoTokenIdx: index("users_email_change_undo_token_idx")
      .on(table.emailChangeUndoToken)
      .where(sql`${table.emailChangeUndoToken} IS NOT NULL`),
  }),
);
```

Make sure `index` is imported in the `import { ... } from "drizzle-orm/pg-core"` line. If not present, add it.

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schemas/auth.ts
git commit -m "$(cat <<'EOF'
feat(db): users — add 10 columns for v2 account deletion + email change

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Generate + apply migration `0014_account_actions`

**Files:** `drizzle/0014_account_actions.sql`, `drizzle/meta/0014_snapshot.json`, `drizzle/meta/_journal.json`

- [ ] **Step 1: Generate**

```bash
pnpm drizzle-kit generate --name account_actions
```

Expected: writes `drizzle/0014_account_actions.sql` with the 10 ADD COLUMN + 4 CREATE INDEX statements, snapshot, and updated journal.

- [ ] **Step 2: Verify the generated SQL**

Open `drizzle/0014_account_actions.sql` and confirm it contains all 10 `ALTER TABLE "users" ADD COLUMN` lines plus the 4 partial `CREATE INDEX ... WHERE ... IS NOT NULL` lines. If a CREATE INDEX is missing the WHERE clause, edit the SQL file manually to add `WHERE "deleted_at" IS NOT NULL` (etc.) to the matching indexes — drizzle-kit sometimes drops the WHERE on partial indexes.

- [ ] **Step 3: Apply to local Neon**

```bash
node scripts/apply-pending-migrations.mjs
```

Expected: ends with `0014_account_actions.sql applied`.

- [ ] **Step 4: Verify columns**

```bash
node -e "(async () => { require('dotenv').config({ path: '.env.local' }); const { neon } = await import('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); const cols = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('deleted_at','pending_email','purged_at','email_change_undo_token') ORDER BY column_name\`; console.log(cols); })()"
```

Expected: prints 4 column names — `deleted_at`, `email_change_undo_token`, `pending_email`, `purged_at`.

- [ ] **Step 5: Commit**

```bash
git add drizzle/0014_account_actions.sql drizzle/meta/0014_snapshot.json drizzle/meta/_journal.json
git commit -m "$(cat <<'EOF'
chore(db): migration 0014 — account actions columns + partial indexes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Helpers

### Task 3: `lib/auth/account-purge.ts` — `purgeUser` helper

**Files:**
- Create: `lib/auth/account-purge.ts`
- Test: `tests/unit/account-purge.test.ts`

- [ ] **Step 1: Audit related schemas**

Before writing the purge SQL, read these files to confirm exact column names:
- `lib/db/schemas/orders.ts`
- `lib/db/schemas/subscriptions.ts`
- `lib/db/schemas/b2b.ts`
- `lib/db/schemas/gift_cards.ts`
- `lib/db/schemas/addresses.ts`
- `lib/db/schemas/cart.ts`
- `lib/db/schemas/auth_rate_limit.ts`
- `lib/db/schemas/newsletter.ts`

For each, note the columns that hold PII linked to a user. Common patterns:
- `orders` likely has `userId`, `email`, `shipping_*`, `billing_*` (snapshots), maybe `phone`
- `subscriptions` likely has `userId`, an `address_snapshot` jsonb, contact fields
- `b2b_quote_requests` likely has `email`, `contact_name`, `phone`, `message`, `shipping_address` jsonb, plus a FK like `quoted_by` or `created_by_user_id`
- `gift_cards` likely has `purchaser_user_id`, `purchaser_email`, `purchaser_name`

Write a short scratch list of `{schemaFile: [columnsToScrub]}` you intend to touch in the purge helper. This list informs Step 3.

- [ ] **Step 2: Write the failing test**

`tests/unit/account-purge.test.ts`:
```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { purgeUser } from "@/lib/auth/account-purge";

// Mock the db module — the test asserts that purgeUser issues the expected
// sequence of statements without hitting a real DB.
const calls: Array<{ kind: string; args: unknown[] }> = [];

vi.mock("@/lib/db", () => {
  const tx = {
    update: (table: unknown) => ({
      set: (vals: unknown) => ({
        where: (cond: unknown) => {
          calls.push({ kind: "update", args: [table, vals, cond] });
          return Promise.resolve();
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: (cond: unknown) => {
        calls.push({ kind: "delete", args: [table, cond] });
        return Promise.resolve();
      },
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ id: "user-x", email: "x@example.test" }]),
        }),
      }),
    }),
    execute: (q: unknown) => {
      calls.push({ kind: "execute", args: [q] });
      return Promise.resolve({ rows: [] });
    },
  };
  return {
    db: {
      transaction: async <T>(fn: (t: typeof tx) => Promise<T>) => fn(tx),
      select: tx.select,
    },
  };
});

beforeEach(() => {
  calls.length = 0;
});

describe("purgeUser", () => {
  it("performs delete + anonymize statements wrapped in a transaction", async () => {
    await purgeUser("user-x");
    expect(calls.length).toBeGreaterThan(5);
    // at least one user UPDATE setting purged_at + sentinel email
    const userUpdate = calls.find(
      (c) =>
        c.kind === "update" &&
        JSON.stringify(c.args[1]).includes("purged_at") &&
        JSON.stringify(c.args[1]).includes("deleted-user-x@anon.invalid"),
    );
    expect(userUpdate).toBeDefined();
  });

  it("is idempotent — purging the same user twice doesn't throw", async () => {
    await purgeUser("user-x");
    calls.length = 0;
    await expect(purgeUser("user-x")).resolves.not.toThrow();
  });
});
```

- [ ] **Step 3: Run test — expect fail**

```bash
pnpm vitest run tests/unit/account-purge.test.ts
```

Expected: module not found.

- [ ] **Step 4: Implement the helper**

Create `lib/auth/account-purge.ts`. Use the schema list from Step 1 to write the exact set of UPDATE / DELETE statements. The skeleton below covers the standard tables — extend `extraAnonymizations` based on what Step 1 surfaced (e.g. coffret-specific tables, subscription_boxes).

```ts
import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  passwordResetTokens,
  addresses,
  carts,
  cartItems,
  newsletterSubscribers,
  orders,
} from "@/lib/db/schema";

const SENTINEL_EMAIL = (userId: string) => `deleted-${userId}@anon.invalid`;
const ANON_NAME = "[supprimé]";

/**
 * Anonymize a user and delete their non-essential PII rows.
 *
 * Keeps rows the law requires (orders for 7y BE accounting) but scrubs
 * personally identifying fields. Idempotent: a second call on a row
 * already carrying purged_at is a no-op.
 */
export async function purgeUser(userId: string): Promise<void> {
  // Skip if already purged (idempotent).
  const [existing] = await db
    .select({ id: users.id, email: users.email, purgedAt: users.purgedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!existing || existing.purgedAt) return;

  const sentinel = SENTINEL_EMAIL(userId);

  await db.transaction(async (tx) => {
    // ── DELETE rows that are pure personal data ──
    await tx.delete(addresses).where(eq(addresses.userId, userId));
    await tx.delete(cartItems).where(
      sql`${cartItems.cartId} IN (SELECT ${carts.id} FROM ${carts} WHERE ${carts.userId} = ${userId})`,
    );
    await tx.delete(carts).where(eq(carts.userId, userId));
    await tx.delete(accounts).where(eq(accounts.userId, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    if (existing.email) {
      await tx
        .delete(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, existing.email));
      await tx
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, existing.email));
      await tx.execute(
        sql`DELETE FROM auth_rate_limit_hits WHERE identifier LIKE '%:' || ${existing.email}`,
      );
    }

    // ── ANONYMIZE rows the law requires us to keep ──
    await tx
      .update(orders)
      .set({
        email: sentinel,
        // Snapshot scrubbing — use raw SQL to preserve the jsonb shape
        // and only null PII fields (city/country remain for analytics).
      })
      .where(eq(orders.userId, userId));
    await tx.execute(sql`
      UPDATE orders SET
        shipping_address_snapshot = COALESCE(shipping_address_snapshot, '{}'::jsonb) - 'firstName' - 'lastName' - 'phone' - 'line1' - 'line2' - 'postalCode',
        billing_address_snapshot  = COALESCE(billing_address_snapshot, '{}'::jsonb)  - 'firstName' - 'lastName' - 'phone' - 'line1' - 'line2' - 'postalCode'
      WHERE user_id = ${userId}
    `);
    // Extra anonymizations (subscriptions, b2b_quote_requests, gift_cards)
    // — fill these in from the schema audit you did in Step 1. Example:
    await tx.execute(sql`
      UPDATE subscriptions SET
        address_snapshot = COALESCE(address_snapshot, '{}'::jsonb) - 'firstName' - 'lastName' - 'phone' - 'line1' - 'line2' - 'postalCode'
      WHERE user_id = ${userId}
    `);
    await tx.execute(sql`
      UPDATE b2b_quote_requests SET
        contact_name = ${ANON_NAME},
        email = ${sentinel},
        phone = NULL,
        message = NULL,
        shipping_address = NULL
      WHERE email = ${existing.email}
    `);
    await tx.execute(sql`
      UPDATE gift_cards SET
        purchaser_email = ${sentinel},
        purchaser_name = NULL
      WHERE purchaser_user_id = ${userId}
    `);

    // ── Final: scrub the user row, set tombstone ──
    await tx
      .update(users)
      .set({
        email: sentinel,
        name: null,
        image: null,
        passwordHash: null,
        newsletterOptIn: false,
        deletedAt: null,
        cancelDeletionToken: null,
        cancelDeletionExpiresAt: null,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
        emailChangeUndoToken: null,
        emailChangeUndoExpiresAt: null,
        emailChangeUndoTo: null,
        purgedAt: new Date(),
      })
      .where(eq(users.id, userId));
  });
}
```

**Important** — if any of the UPDATE statements references a column that doesn't actually exist on the table (e.g. `subscriptions.address_snapshot` may be named differently), the migration will fail at runtime, not at typecheck (raw SQL). Cross-check against Step 1's notes. If a column is missing on the real table, either remove the statement or rename it. Do not invent columns.

- [ ] **Step 5: Run test — expect pass**

```bash
pnpm vitest run tests/unit/account-purge.test.ts
```

Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/account-purge.ts tests/unit/account-purge.test.ts
git commit -m "$(cat <<'EOF'
feat(auth): purgeUser helper — anonymize + delete PII on cron expiry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Extend `lib/auth/rate-limit.ts` with `email-change` + `delete`

**Files:** Modify `lib/auth/rate-limit.ts`

- [ ] **Step 1: Read the current `LIMITS` and `AuthAction` block**

The file exports `AuthAction` (a union of strings) and `LIMITS` (a Record). Locate both — they live near the top.

- [ ] **Step 2: Extend the type + record**

Replace the `AuthAction` declaration with:
```ts
export type AuthAction =
  | "sign-in"
  | "register"
  | "forgot"
  | "reset"
  | "change-password"
  | "email-change"
  | "delete";
```

Replace the `LIMITS` block with:
```ts
const LIMITS: Record<AuthAction, { email: number; ip: number }> = {
  "sign-in": { email: 3, ip: 10 },
  register: { email: 3, ip: 5 },
  forgot: { email: 3, ip: 5 },
  reset: { email: Number.POSITIVE_INFINITY, ip: 5 },
  "change-password": { email: 5, ip: Number.POSITIVE_INFINITY },
  "email-change": { email: 3, ip: 5 },
  delete: { email: 2, ip: 3 },
};
```

Note: the `delete` window is 1 hour, not 15 minutes. The current helper hardcodes a single `WINDOW_INTERVAL` constant. To support a per-action window, replace the constant with a record and use it inside the SQL:

```ts
const WINDOWS: Record<AuthAction, string> = {
  "sign-in": "15 minutes",
  register: "15 minutes",
  forgot: "15 minutes",
  reset: "15 minutes",
  "change-password": "15 minutes",
  "email-change": "15 minutes",
  delete: "1 hour",
};
```

Then inside `checkAuthRateLimit`, replace the existing references to `WINDOW_INTERVAL` with `WINDOWS[opts.action]`. Both `SELECT COUNT` queries use it — update both.

- [ ] **Step 3: Typecheck + run existing unit tests**

```bash
pnpm typecheck && pnpm vitest run tests/unit
```

Expected: clean (modulo the pre-existing `db.test.ts` env failure).

- [ ] **Step 4: Commit**

```bash
git add lib/auth/rate-limit.ts
git commit -m "$(cat <<'EOF'
refactor(auth): rate-limit — add email-change + delete actions with per-action windows

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Email templates

### Task 5: 4 locale-aware email templates

**Files:**
- Create `components/email/AccountDeletionRequestedEmail.tsx`
- Create `components/email/AccountDeletionCancelledEmail.tsx`
- Create `components/email/EmailChangeVerifyEmail.tsx`
- Create `components/email/EmailChangedNotificationEmail.tsx`

All 4 follow the brand pattern used by `VerifyEmailEmail.tsx` (cream `#fbf6ee`, warm-brown text, honey-dark CTA, Snell Roundhand wordmark, `STRINGS: Record<Locale, ...>`).

- [ ] **Step 1: Create `AccountDeletionRequestedEmail.tsx`**

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
    heading: "Ton compte sera supprimé dans 30 jours",
    body: "Tu as demandé la suppression de ton compte Au Fil des Saveurs. Tes données seront effacées le {expiresHuman}. Tu peux annuler à tout moment d'ici là.",
    cta: "Annuler la suppression",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Ce lien est valable 30 jours.",
    ignore: "Si tu n'as pas demandé cette suppression, clique sur le bouton immédiatement et change ton mot de passe.",
  },
  nl: {
    heading: "Je account wordt over 30 dagen verwijderd",
    body: "Je hebt om de verwijdering van je Au Fil des Saveurs-account gevraagd. Je gegevens worden gewist op {expiresHuman}. Je kunt tot dan annuleren.",
    cta: "Verwijdering annuleren",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 30 dagen geldig.",
    ignore: "Heb jij deze verwijdering niet aangevraagd? Klik direct op de knop en wijzig je wachtwoord.",
  },
  de: {
    heading: "Dein Konto wird in 30 Tagen gelöscht",
    body: "Du hast die Löschung deines Au Fil des Saveurs-Kontos angefordert. Deine Daten werden am {expiresHuman} entfernt. Du kannst bis dahin abbrechen.",
    cta: "Löschung abbrechen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Dieser Link ist 30 Tage gültig.",
    ignore: "Solltest du die Löschung nicht angefordert haben, klicke sofort auf den Button und ändere dein Passwort.",
  },
  en: {
    heading: "Your account will be deleted in 30 days",
    body: "You requested the deletion of your Au Fil des Saveurs account. Your data will be erased on {expiresHuman}. You can cancel until then.",
    cta: "Cancel deletion",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 30 days.",
    ignore: "If you didn't request this deletion, click the button immediately and change your password.",
  },
};

export function AccountDeletionRequestedEmail({
  locale,
  cancelUrl,
  expiresHuman,
}: {
  locale: Locale;
  cancelUrl: string;
  expiresHuman: string;
}) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>
        {s.body.replace("{expiresHuman}", expiresHuman)}
      </p>
      <p style={{ marginTop: 24 }}>
        <a
          href={cancelUrl}
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
        <a href={cancelUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {cancelUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#a13b1f", marginTop: 4, fontWeight: 600 }}>{s.ignore}</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `AccountDeletionCancelledEmail.tsx`**

```tsx
import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string }> = {
  fr: {
    heading: "Suppression annulée",
    body: "La suppression de ton compte Au Fil des Saveurs a été annulée. Tout est revenu à la normale.",
  },
  nl: {
    heading: "Verwijdering geannuleerd",
    body: "De verwijdering van je Au Fil des Saveurs-account is geannuleerd. Alles is hersteld.",
  },
  de: {
    heading: "Löschung abgebrochen",
    body: "Die Löschung deines Au Fil des Saveurs-Kontos wurde abgebrochen. Alles ist wiederhergestellt.",
  },
  en: {
    heading: "Deletion cancelled",
    body: "The deletion of your Au Fil des Saveurs account has been cancelled. Everything is back to normal.",
  },
};

export function AccountDeletionCancelledEmail({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `EmailChangeVerifyEmail.tsx`**

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
    heading: "Confirme ta nouvelle adresse email",
    body: "Tu as demandé à changer l'adresse email de ton compte Au Fil des Saveurs vers celle-ci. Clique pour confirmer.",
    cta: "Confirmer la nouvelle adresse",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Ce lien est valable 24 heures.",
    ignore: "Si tu n'es pas à l'origine de cette demande, ignore cet email — rien ne sera changé.",
  },
  nl: {
    heading: "Bevestig je nieuwe e-mailadres",
    body: "Je hebt het e-mailadres van je Au Fil des Saveurs-account naar dit adres willen wijzigen. Klik om te bevestigen.",
    cta: "Nieuw adres bevestigen",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 24 uur geldig.",
    ignore: "Heb jij deze wijziging niet aangevraagd? Negeer deze e-mail — er verandert niets.",
  },
  de: {
    heading: "Bestätige deine neue E-Mail-Adresse",
    body: "Du hast die E-Mail-Adresse deines Au Fil des Saveurs-Kontos auf diese geändert. Klicke zur Bestätigung.",
    cta: "Neue Adresse bestätigen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Dieser Link ist 24 Stunden gültig.",
    ignore: "Solltest du diese Änderung nicht angefordert haben, ignoriere diese E-Mail — es wird nichts geändert.",
  },
  en: {
    heading: "Confirm your new email address",
    body: "You asked to change the email address on your Au Fil des Saveurs account to this one. Click to confirm.",
    cta: "Confirm new address",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 24 hours.",
    ignore: "If you didn't request this change, ignore this email — nothing will be changed.",
  },
};

export function EmailChangeVerifyEmail({
  locale,
  confirmUrl,
}: {
  locale: Locale;
  confirmUrl: string;
}) {
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
          href={confirmUrl}
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
        <a href={confirmUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {confirmUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 4 }}>{s.ignore}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create `EmailChangedNotificationEmail.tsx`**

```tsx
import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, {
  heading: string;
  body: string;
  cta: string;
  fallback: string;
  expires: string;
  warning: string;
}> = {
  fr: {
    heading: "Ton adresse email a été modifiée",
    body: "L'adresse email de ton compte Au Fil des Saveurs a été modifiée vers {newEmail}. Tu n'as plus rien à faire.",
    cta: "Si ce n'est pas toi, annuler le changement",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Le lien d'annulation est valable 7 jours.",
    warning: "Si tu n'es pas à l'origine de ce changement, clique immédiatement sur le bouton ci-dessus. Cela révoquera également toutes les sessions actives.",
  },
  nl: {
    heading: "Je e-mailadres is gewijzigd",
    body: "Het e-mailadres van je Au Fil des Saveurs-account is gewijzigd naar {newEmail}. Verder hoef je niets te doen.",
    cta: "Niet jij? Wijziging annuleren",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "De annuleringslink is 7 dagen geldig.",
    warning: "Heb jij deze wijziging niet aangevraagd? Klik direct op de knop hierboven. Daarmee worden ook alle actieve sessies ingetrokken.",
  },
  de: {
    heading: "Deine E-Mail-Adresse wurde geändert",
    body: "Die E-Mail-Adresse deines Au Fil des Saveurs-Kontos wurde auf {newEmail} geändert. Du musst nichts weiter tun.",
    cta: "Nicht du? Änderung rückgängig machen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Der Rücksetzlink ist 7 Tage gültig.",
    warning: "Solltest du diese Änderung nicht ausgelöst haben, klicke sofort auf den Button oben. Damit werden auch alle aktiven Sitzungen abgemeldet.",
  },
  en: {
    heading: "Your email address was changed",
    body: "The email address on your Au Fil des Saveurs account was changed to {newEmail}. You don't need to do anything else.",
    cta: "Wasn't you? Undo the change",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "The undo link is valid for 7 days.",
    warning: "If you didn't make this change, click the button above immediately. It will also revoke all active sessions.",
  },
};

export function EmailChangedNotificationEmail({
  locale,
  undoUrl,
  newEmail,
}: {
  locale: Locale;
  undoUrl: string;
  newEmail: string;
}) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>
        {s.body.replace("{newEmail}", newEmail)}
      </p>
      <p style={{ marginTop: 24 }}>
        <a
          href={undoUrl}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#a13b1f",
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
        <a href={undoUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {undoUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#a13b1f", marginTop: 4, fontWeight: 600 }}>{s.warning}</p>
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
git add components/email/AccountDeletionRequestedEmail.tsx components/email/AccountDeletionCancelledEmail.tsx components/email/EmailChangeVerifyEmail.tsx components/email/EmailChangedNotificationEmail.tsx
git commit -m "$(cat <<'EOF'
feat(email): 4 locale-aware templates for account deletion + email change

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Server actions + auth guards

### Task 6: `requestEmailChange` server action

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Add new imports**

At the top of the file, after existing imports, ensure these are present (add any missing):
```ts
import { AccountDeletionRequestedEmail } from "@/components/email/AccountDeletionRequestedEmail";
import { AccountDeletionCancelledEmail } from "@/components/email/AccountDeletionCancelledEmail";
import { EmailChangeVerifyEmail } from "@/components/email/EmailChangeVerifyEmail";
import { EmailChangedNotificationEmail } from "@/components/email/EmailChangedNotificationEmail";
import { and, gt, isNull } from "drizzle-orm";
```

The existing `eq` import already exists.

- [ ] **Step 2: Append the action**

At the end of `lib/actions/auth.actions.ts`:

```ts
const emailChangeSchema = z.object({
  newEmail: z.string().email().max(254),
  currentPassword: z.string().min(1).max(200),
  locale: z.string(),
});

export async function requestEmailChange(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const parsed = emailChangeSchema.safeParse({
    newEmail: formData.get("newEmail"),
    currentPassword: formData.get("currentPassword"),
    locale,
  });
  if (!parsed.success) redirect(`/${locale}/compte/profil?email=invalid`);

  const { newEmail, currentPassword } = parsed.data;
  const normalized = newEmail.trim().toLowerCase();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(and(eq(users.id, session.user.id), isNull(users.purgedAt)))
    .limit(1);
  if (!user) redirect(`/${locale}/sign-in`);

  if (normalized === user.email.toLowerCase()) {
    redirect(`/${locale}/compte/profil?email=same`);
  }
  if (!user.passwordHash) {
    redirect(`/${locale}/compte/profil?email=set-password-first`);
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) redirect(`/${locale}/compte/profil?email=wrong-password`);

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({
    action: "email-change",
    email: user.email,
    ip,
  });
  if (!limit.ok) redirect(`/${locale}/compte/profil?email=rate-limit`);

  // Check new address not taken (by a non-purged user)
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, normalized), isNull(users.purgedAt)))
    .limit(1);
  if (existing) redirect(`/${locale}/compte/profil?email=taken`);

  const rawToken = generateRawToken();
  await db
    .update(users)
    .set({
      pendingEmail: normalized,
      pendingEmailToken: hashToken(rawToken),
      pendingEmailExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .where(eq(users.id, user.id));

  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const confirmUrl = `${appBase}/${locale}/confirm-email-change/${rawToken}`;
  try {
    await sendEmail({
      to: normalized,
      subject: "Confirme ta nouvelle adresse email — Au Fil des Saveurs",
      react: EmailChangeVerifyEmail({ locale, confirmUrl }),
    });
  } catch (e) {
    console.error("[auth] email-change verify send failed", e);
  }
  redirect(`/${locale}/compte/profil?email=verify-sent`);
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "$(cat <<'EOF'
feat(auth): requestEmailChange — verify-before-switch

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `confirmEmailChange` + `revertEmailChange`

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Append both actions**

```ts
export type EmailChangeResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: "expired" | "taken-race" | "cannot-revert" };

export async function confirmEmailChange(
  rawToken: string,
  locale: string,
): Promise<EmailChangeResult> {
  const safeLocale = asLocale(locale);
  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      pendingEmail: users.pendingEmail,
      expiresAt: users.pendingEmailExpiresAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.pendingEmailToken, hashed))
    .limit(1);
  if (!row || row.purgedAt || !row.pendingEmail) {
    return { ok: false, error: "expired" };
  }
  if (!row.expiresAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  // Race check: nobody else registered the new address in the meantime.
  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.email, row.pendingEmail),
        isNull(users.purgedAt),
      ),
    )
    .limit(1);
  if (conflict && conflict.id !== row.id) {
    await db
      .update(users)
      .set({
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
      })
      .where(eq(users.id, row.id));
    return { ok: false, error: "taken-race" };
  }

  const oldEmail = row.email;
  const undoRaw = generateRawToken();

  await db
    .update(users)
    .set({
      email: row.pendingEmail,
      emailVerified: new Date(),
      emailChangeUndoTo: oldEmail,
      emailChangeUndoToken: hashToken(undoRaw),
      emailChangeUndoExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpiresAt: null,
    })
    .where(eq(users.id, row.id));

  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const undoUrl = `${appBase}/${safeLocale}/undo-email-change/${undoRaw}`;
  try {
    await sendEmail({
      to: oldEmail,
      subject: "Ton adresse email a été modifiée — Au Fil des Saveurs",
      react: EmailChangedNotificationEmail({
        locale: safeLocale,
        undoUrl,
        newEmail: row.pendingEmail,
      }),
    });
  } catch (e) {
    console.error("[auth] email-changed notif send failed", e);
  }

  return { ok: true, redirectTo: `/${safeLocale}/compte/profil?email=changed` };
}

export async function revertEmailChange(
  rawToken: string,
  locale: string,
): Promise<EmailChangeResult> {
  const safeLocale = asLocale(locale);
  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({
      id: users.id,
      currentEmail: users.email,
      undoTo: users.emailChangeUndoTo,
      undoExpiresAt: users.emailChangeUndoExpiresAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.emailChangeUndoToken, hashed))
    .limit(1);
  if (!row || row.purgedAt || !row.undoTo) {
    return { ok: false, error: "expired" };
  }
  if (!row.undoExpiresAt || row.undoExpiresAt.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  // Make sure the old address isn't taken by someone else now
  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, row.undoTo), isNull(users.purgedAt)))
    .limit(1);
  if (conflict && conflict.id !== row.id) {
    return { ok: false, error: "cannot-revert" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        email: row.undoTo as string,
        emailChangeUndoTo: null,
        emailChangeUndoToken: null,
        emailChangeUndoExpiresAt: null,
      })
      .where(eq(users.id, row.id));
    await tx.delete(sessions).where(eq(sessions.userId, row.id));
  });

  return { ok: true, redirectTo: `/${safeLocale}/sign-in?email=reverted` };
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
git commit -m "$(cat <<'EOF'
feat(auth): confirmEmailChange + revertEmailChange (7-day undo)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `requestAccountDeletion` + `cancelAccountDeletion`

**Files:** Modify `lib/actions/auth.actions.ts`

- [ ] **Step 1: Append both actions**

```ts
const deletionSchema = z.object({
  confirmText: z.literal("SUPPRIMER"),
  currentPassword: z.string().max(200),
  locale: z.string(),
});

function humanDate(d: Date, locale: "fr" | "nl" | "de" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : `${locale}-BE`, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export async function requestAccountDeletion(formData: FormData) {
  const locale = asLocale(formData.get("locale") as string | null);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const parsed = deletionSchema.safeParse({
    confirmText: formData.get("confirmText"),
    currentPassword: formData.get("currentPassword") ?? "",
    locale,
  });
  if (!parsed.success) {
    redirect(`/${locale}/compte/profil?delete=invalid`);
  }
  const { currentPassword } = parsed.data;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(and(eq(users.id, session.user.id), isNull(users.purgedAt)))
    .limit(1);
  if (!user) redirect(`/${locale}/sign-in`);

  // If the user has a password, we require it. OAuth-only users can submit
  // an empty password and rely on confirmText.
  if (user.passwordHash) {
    if (!currentPassword) {
      redirect(`/${locale}/compte/profil?delete=wrong-password`);
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) redirect(`/${locale}/compte/profil?delete=wrong-password`);
  }

  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);
  const limit = await checkAuthRateLimit({
    action: "delete",
    email: user.email,
    ip,
  });
  if (!limit.ok) redirect(`/${locale}/compte/profil?delete=rate-limit`);

  const rawToken = generateRawToken();
  const deletedAt = new Date();
  const expiresAt = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        deletedAt,
        cancelDeletionToken: hashToken(rawToken),
        cancelDeletionExpiresAt: expiresAt,
        // also clear any in-flight pending email so it can't be reused
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
      })
      .where(eq(users.id, user.id));
    await tx.delete(sessions).where(eq(sessions.userId, user.id));
  });

  // Best-effort Stripe subscription cancellation at period end.
  // Look up the user's active subscription via Drizzle if the schema supports
  // it; otherwise skip. (Real cancellation belongs in a small helper; out of
  // scope for v2-A — the cron will purge the user even if Stripe still bills,
  // and the cliente can refund manually.)
  // TODO(v2-B): integrate stripe.subscriptions.update(id, { cancel_at_period_end: true }).
  // Intentionally left as a comment — do NOT add a placeholder helper here.

  const appBase = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const cancelUrl = `${appBase}/${locale}/cancel-deletion/${rawToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Suppression de compte programmée — Au Fil des Saveurs",
      react: AccountDeletionRequestedEmail({
        locale,
        cancelUrl,
        expiresHuman: humanDate(expiresAt, locale),
      }),
    });
  } catch (e) {
    console.error("[auth] deletion-requested email send failed", e);
  }

  redirect(`/${locale}?deletion=requested`);
}

export type CancelDeletionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: "expired" };

export async function cancelAccountDeletion(
  rawToken: string,
  locale: string,
): Promise<CancelDeletionResult> {
  const safeLocale = asLocale(locale);
  const hashed = hashToken(rawToken);
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      preferredLocale: users.preferredLocale,
      expiresAt: users.cancelDeletionExpiresAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.cancelDeletionToken, hashed))
    .limit(1);
  if (!row || row.purgedAt) return { ok: false, error: "expired" };
  if (!row.expiresAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  await db
    .update(users)
    .set({
      deletedAt: null,
      cancelDeletionToken: null,
      cancelDeletionExpiresAt: null,
    })
    .where(eq(users.id, row.id));

  try {
    await sendEmail({
      to: row.email,
      subject: "Suppression annulée — Au Fil des Saveurs",
      react: AccountDeletionCancelledEmail({ locale: asLocale(row.preferredLocale) }),
    });
  } catch (e) {
    console.error("[auth] deletion-cancelled email send failed", e);
  }

  return { ok: true, redirectTo: `/${safeLocale}/sign-in?deletion=cancelled` };
}
```

The `TODO(v2-B)` comment is intentional — Stripe cancellation is deliberately out of scope for v2-A per the spec. Do not implement it here.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/auth.actions.ts
git commit -m "$(cat <<'EOF'
feat(auth): requestAccountDeletion + cancelAccountDeletion (30-day cool-off)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Guard `signInWithPassword` + NextAuth `signIn` callback

**Files:**
- Modify: `lib/actions/auth.actions.ts`
- Modify: `lib/auth.ts`

- [ ] **Step 1: Update `signInWithPassword` to honour deleted/purged**

In `lib/actions/auth.actions.ts`, find `signInWithPassword`. After the line:
```ts
  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
```
Change the selection to also fetch `deletedAt` and `purgedAt`:
```ts
  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      deletedAt: users.deletedAt,
      purgedAt: users.purgedAt,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
```

Then insert these guards before the existing "if (!user)" block (so they short-circuit for tombstones, but anonymously):
```ts
  if (user?.purgedAt) {
    // Treat tombstones like non-existent — never leak that the account once
    // existed.
    redirect(`/${locale}/sign-in?error=invalid-credentials`);
  }
  if (user?.deletedAt) {
    redirect(`/${locale}/sign-in?error=account-deleted`);
  }
```

(The existing `if (!user)` check stays after these.)

- [ ] **Step 2: Add NextAuth `signIn` callback in `lib/auth.ts`**

In `lib/auth.ts`, locate the `callbacks: { ... }` block. Add a `signIn` callback alongside the existing `session` callback:
```ts
  callbacks: {
    async signIn({ user }) {
      // Block OAuth sign-in for users in cool-off or already tombstoned.
      const u = user as {
        id?: string;
        deletedAt?: Date | null;
        purgedAt?: Date | null;
      };
      if (u?.purgedAt) return false;
      if (u?.deletedAt) return "/fr/sign-in?error=account-deleted";
      return true;
    },
    async session({ session, user }) {
      // ... existing body unchanged ...
    },
  },
```

(Leave the existing `session` callback body intact — only add the `signIn` callback above it.)

- [ ] **Step 3: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/auth.actions.ts lib/auth.ts
git commit -m "$(cat <<'EOF'
feat(auth): block sign-in for deleted/purged users (password + OAuth)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Pages & components

### Task 10: `/[locale]/(shop)/confirm-email-change/[token]/page.tsx`

**Files:** Create the page.

- [ ] **Step 1: Create file**

```tsx
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { confirmEmailChange } from "@/lib/actions/auth.actions";

const ERROR_HEADINGS: Record<string, string> = {
  expired: "emailChangeExpired",
  "taken-race": "emailChangeTakenRace",
  "cannot-revert": "emailChangeExpired",
};

export default async function ConfirmEmailChangePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const result = await confirmEmailChange(token, locale);
  if (result.ok) redirect(result.redirectTo);

  const key = ERROR_HEADINGS[result.error] ?? "emailChangeExpired";

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
            {t(key)}
          </Heading>
          <p className="mt-6">
            <Link
              href="/compte/profil"
              className="bg-honey text-cream hover:bg-honey-dark inline-block rounded-md px-5 py-3 text-sm font-medium"
            >
              {t("backToProfile")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: complains about missing `emailChangeExpired`, `emailChangeTakenRace`, `backToProfile` i18n keys — those are added in Task 17. **Ignore the runtime fallback warning for now.** Typecheck itself should still pass (next-intl doesn't fail typecheck on missing keys, only at runtime).

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/\(shop\)/confirm-email-change
git commit -m "$(cat <<'EOF'
feat(auth): /confirm-email-change/[token] page

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: `/[locale]/(shop)/undo-email-change/[token]/page.tsx`

**Files:** Create the page.

- [ ] **Step 1: Create file**

```tsx
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { revertEmailChange } from "@/lib/actions/auth.actions";

const ERROR_HEADINGS: Record<string, string> = {
  expired: "undoEmailExpired",
  "cannot-revert": "undoEmailCannotRevert",
};

export default async function UndoEmailChangePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const result = await revertEmailChange(token, locale);
  if (result.ok) redirect(result.redirectTo);

  const key = ERROR_HEADINGS[result.error] ?? "undoEmailExpired";

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
            {t(key)}
          </Heading>
          <p className="mt-6">
            <Link
              href="/sign-in"
              className="bg-honey text-cream hover:bg-honey-dark inline-block rounded-md px-5 py-3 text-sm font-medium"
            >
              {t("backToSignIn")}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add app/[locale]/\(shop\)/undo-email-change
git commit -m "$(cat <<'EOF'
feat(auth): /undo-email-change/[token] page (7-day window)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: `/[locale]/(shop)/cancel-deletion/[token]/page.tsx`

**Files:** Create the page.

- [ ] **Step 1: Create file**

```tsx
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Logo } from "@/components/brand/Logo";
import { cancelAccountDeletion } from "@/lib/actions/auth.actions";

export default async function CancelDeletionPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const result = await cancelAccountDeletion(token, locale);
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
            {t("cancelDeletionExpired")}
          </Heading>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add app/[locale]/\(shop\)/cancel-deletion
git commit -m "$(cat <<'EOF'
feat(auth): /cancel-deletion/[token] page

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: `components/account/EmailChangeBlock.tsx`

**Files:** Create the client component.

- [ ] **Step 1: Create file**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { requestEmailChange } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function EmailChangeBlock({
  locale,
  currentEmail,
  pendingEmail,
}: {
  locale: string;
  currentEmail: string;
  pendingEmail: string | null;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => requestEmailChange(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <div>
        <span className="text-warm-brown text-sm">{t("currentEmailLabel")}</span>
        <p className="text-warm-brown mt-1 font-medium">{currentEmail}</p>
      </div>
      {pendingEmail && (
        <div className="border-honey/40 bg-honey-cream text-warm-brown rounded-md border px-4 py-3 text-sm">
          📬 {t("emailChangePendingHint", { email: pendingEmail })}
        </div>
      )}
      <label className="block">
        <span className="text-warm-brown text-sm">{t("newEmailLabel")}</span>
        <input
          type="email"
          name="newEmail"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
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
      <Button type="submit" disabled={pending} variant="outline">
        {t("emailChangeSubmit")}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add components/account/EmailChangeBlock.tsx
git commit -m "$(cat <<'EOF'
feat(account): EmailChangeBlock client form

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: `components/account/DangerZoneBlock.tsx`

**Files:** Create the client component.

- [ ] **Step 1: Create file**

```tsx
"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { requestAccountDeletion } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function DangerZoneBlock({
  locale,
  hasPassword,
}: {
  locale: string;
  hasPassword: boolean;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => requestAccountDeletion(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <p className="text-warm-brown/80 text-sm">{t("deleteAccountIntro")}</p>
      {hasPassword && (
        <label className="block">
          <span className="text-warm-brown text-sm">{t("currentPasswordLabel")}</span>
          <input
            type="password"
            name="currentPassword"
            required
            autoComplete="current-password"
            className="border-warm-brown/20 focus:border-terracotta focus:ring-terracotta/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
          />
        </label>
      )}
      {!hasPassword && (
        <input type="hidden" name="currentPassword" value="" />
      )}
      <label className="block">
        <span className="text-warm-brown text-sm">
          {t("deleteAccountConfirmHint")}
        </span>
        <input
          type="text"
          name="confirmText"
          required
          pattern="SUPPRIMER"
          autoComplete="off"
          className="border-warm-brown/20 focus:border-terracotta focus:ring-terracotta/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none font-mono"
        />
      </label>
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
        className="border-terracotta text-terracotta hover:bg-terracotta hover:text-cream"
      >
        {t("deleteAccountSubmit")}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck
git add components/account/DangerZoneBlock.tsx
git commit -m "$(cat <<'EOF'
feat(account): DangerZoneBlock — delete account form

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Wire the 2 new blocks into `/compte/profil`

**Files:** Modify `app/[locale]/(account)/compte/profil/page.tsx`

- [ ] **Step 1: Read current file structure**

Open the file. It already renders 3 sections (Password / Linked accounts / Preferences). We're appending 2 more.

- [ ] **Step 2: Add imports**

After the existing imports, add:
```ts
import { EmailChangeBlock } from "@/components/account/EmailChangeBlock";
import { DangerZoneBlock } from "@/components/account/DangerZoneBlock";
```

Also extend the `searchParams` type signature with `email`, `delete`:
```ts
  searchParams: Promise<{
    error?: string;
    password?: string;
    profile?: string;
    email?: string;
    delete?: string;
  }>;
```

And destructure them:
```ts
  const { error, password, profile, email, delete: deleteFlag } = await searchParams;
```

- [ ] **Step 3: Add toast handling for new query strings**

After the existing `(password === "ok" || profile === "ok")` toast block, add a similar block for email change toasts:
```ts
      {email && (
        <div
          role={email === "changed" || email === "verify-sent" || email === "reverted" ? undefined : "alert"}
          className={
            email === "changed" || email === "verify-sent" || email === "reverted"
              ? "border-honey-dark/30 bg-honey-dark/5 text-honey-dark rounded-md border px-4 py-3 text-sm"
              : "border-terracotta/30 bg-terracotta/5 text-terracotta rounded-md border px-4 py-3 text-sm"
          }
        >
          {t(`emailToast_${email}`)}
        </div>
      )}
      {deleteFlag && (
        <div
          role="alert"
          className="border-terracotta/30 bg-terracotta/5 text-terracotta rounded-md border px-4 py-3 text-sm"
        >
          {t(`deleteToast_${deleteFlag}`)}
        </div>
      )}
```

(Translation keys like `emailToast_changed`, `emailToast_verify-sent`, `emailToast_taken`, `deleteToast_wrong-password` are added in Task 17. Use kebab-case in the source values matching the action's redirect codes.)

- [ ] **Step 4: Add 2 new section cards at the bottom of the page**

After the existing "Préférences" card and before the closing `</section>`:
```tsx
      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <h2 className="text-warm-brown text-lg font-medium">{t("emailLabel")}</h2>
        <div className="mt-4">
          <EmailChangeBlock
            locale={locale}
            currentEmail={user?.email ?? ""}
            pendingEmail={user?.pendingEmail ?? null}
          />
        </div>
      </div>

      <div className="border-terracotta/30 rounded-xl border bg-white p-6">
        <div className="text-terracotta mb-3 text-xs font-bold tracking-widest uppercase">
          {t("dangerZone")}
        </div>
        <h2 className="text-warm-brown text-lg font-medium">{t("deleteAccountTitle")}</h2>
        <div className="mt-4">
          <DangerZoneBlock locale={locale} hasPassword={!!user?.passwordHash} />
        </div>
      </div>
```

For these to compile, also extend the `db.select` block at the top to include `pendingEmail`:
```ts
  const [user] = await db
    .select({
      passwordHash: users.passwordHash,
      preferredLocale: users.preferredLocale,
      newsletterOptIn: users.newsletterOptIn,
      email: users.email,
      pendingEmail: users.pendingEmail,
    })
    .from(users)
    .where(eq(users.id, session!.user!.id))
    .limit(1);
```

- [ ] **Step 5: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/\(account\)/compte/profil/page.tsx
git commit -m "$(cat <<'EOF'
feat(account): wire EmailChangeBlock + DangerZoneBlock into /compte/profil

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Cron + scripts

### Task 16: `/api/cron/account-purge` route

**Files:** Create `app/api/cron/account-purge/route.ts`

- [ ] **Step 1: Inspect an existing cron handler for the auth pattern**

Open `app/api/cron/gift-cards-deliver/route.ts`. Note how it validates `CRON_SECRET` via the `Authorization: Bearer …` header. Use the same pattern.

- [ ] **Step 2: Create the new route**

```ts
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { purgeUser } from "@/lib/auth/account-purge";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      sql`${users.deletedAt} IS NOT NULL AND ${users.deletedAt} < NOW() - INTERVAL '30 days' AND ${users.purgedAt} IS NULL`,
    );

  let purged = 0;
  for (const row of rows) {
    try {
      await purgeUser(row.id);
      purged += 1;
    } catch (e) {
      console.error("[cron account-purge] failed for user", row.id, e);
    }
  }

  return NextResponse.json({
    purged,
    candidates: rows.length,
    processedAt: new Date().toISOString(),
  });
}
```

- [ ] **Step 3: Add the cron entry to `vercel.json`**

Open `vercel.json`. Locate the `"crons": [...]` array (it already contains `gift-cards-deliver`). Add a new entry:
```json
    {
      "path": "/api/cron/account-purge",
      "schedule": "0 2 * * *"
    }
```
Preserve trailing commas correctly.

- [ ] **Step 4: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: the new route appears in the build output as `ƒ /api/cron/account-purge`.

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/account-purge vercel.json
git commit -m "$(cat <<'EOF'
feat(cron): /api/cron/account-purge daily at 02:00 UTC

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: `scripts/test-purge-locally.mjs`

**Files:** Create `scripts/test-purge-locally.mjs`

- [ ] **Step 1: Create the script**

```js
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const testEmail = `purge-test-${Date.now()}@example.invalid`;
const [inserted] = await sql`
  INSERT INTO users (email, name, email_verified, deleted_at)
  VALUES (${testEmail}, 'Purge Test', NOW(), NOW() - INTERVAL '31 days')
  RETURNING id
`;
console.log(`Inserted test user ${inserted.id} (deleted 31 days ago).`);

// Trigger purge by hitting the cron route locally — assumes `pnpm dev` is running.
const port = process.env.PORT ?? 3000;
const res = await fetch(`http://localhost:${port}/api/cron/account-purge`, {
  headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
});
const json = await res.json();
console.log("Purge route response:", json);

const [after] = await sql`
  SELECT email, name, purged_at FROM users WHERE id = ${inserted.id}
`;
console.log("After purge:", after);

if (!after.purged_at) {
  console.error("✗ User was NOT purged.");
  process.exit(1);
}
if (after.email === testEmail) {
  console.error("✗ Email was NOT anonymized.");
  process.exit(1);
}
console.log("✓ Purge worked. Tombstone email:", after.email);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/test-purge-locally.mjs
git commit -m "$(cat <<'EOF'
chore(scripts): test-purge-locally — insert fake stale user + hit cron

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — i18n

### Task 18: New `auth.*` keys × 4 locales

**Files:** Modify `messages/{fr,nl,de,en}.json`

- [ ] **Step 1: Append keys to `messages/fr.json`**

Open the file, find the `auth` object, and add these keys at the end (before the closing `}`):
```json
    "currentEmailLabel": "Adresse actuelle",
    "newEmailLabel": "Nouvelle adresse email",
    "emailChangePendingHint": "Tu as une demande en cours pour {email}. Le lien envoyé est valable 24h.",
    "emailChangeSubmit": "Envoyer le lien de vérification",
    "emailChangeExpired": "Lien expiré ou déjà utilisé.",
    "emailChangeTakenRace": "Cette adresse est désormais utilisée par un autre compte.",
    "undoEmailExpired": "Lien expiré (la fenêtre d'annulation de 7 jours est dépassée).",
    "undoEmailCannotRevert": "Impossible d'annuler — l'ancienne adresse est désormais utilisée par un autre compte.",
    "cancelDeletionExpired": "Trop tard — le compte a été supprimé définitivement.",
    "backToProfile": "Retour à mon profil",
    "backToSignIn": "Retour à la connexion",
    "dangerZone": "ZONE DE DANGER",
    "deleteAccountTitle": "Supprimer mon compte",
    "deleteAccountIntro": "La suppression désactive ton compte immédiatement. Tes données seront effacées après 30 jours. Tu peux annuler à tout moment via le lien qu'on t'enverra par email.",
    "deleteAccountConfirmHint": "Tape SUPPRIMER pour confirmer",
    "deleteAccountSubmit": "Supprimer mon compte",
    "emailToast_verify-sent": "Vérifie ta nouvelle adresse email — un lien t'attend.",
    "emailToast_changed": "Adresse email mise à jour.",
    "emailToast_reverted": "Adresse email rétablie. Reconnecte-toi.",
    "emailToast_invalid": "Les informations saisies sont incorrectes.",
    "emailToast_taken": "Cette adresse est déjà utilisée.",
    "emailToast_same": "C'est déjà ton adresse actuelle.",
    "emailToast_set-password-first": "Crée un mot de passe d'abord via « Mot de passe oublié ».",
    "emailToast_wrong-password": "Mot de passe actuel incorrect.",
    "emailToast_rate-limit": "Trop de tentatives, réessaie dans quelques minutes.",
    "deleteToast_invalid": "Tape exactement « SUPPRIMER » pour confirmer.",
    "deleteToast_wrong-password": "Mot de passe actuel incorrect.",
    "deleteToast_rate-limit": "Trop de tentatives, réessaie dans une heure.",
    "errorAccountDeleted": "Ce compte est programmé pour suppression. Annule via le lien dans ton email."
```

Make sure the previous-to-last key still ends with a comma and the last key (`errorAccountDeleted`) does NOT have a trailing comma.

Also locate the existing `errorInvalidCredentials` key and remember it — the new sign-in error code `account-deleted` needs to map to `errorAccountDeleted` in the sign-in page. Sign-in page change happens in Task 19.

- [ ] **Step 2: Repeat for `messages/nl.json`**

Add the same set of keys with Dutch translations:
```json
    "currentEmailLabel": "Huidig adres",
    "newEmailLabel": "Nieuw e-mailadres",
    "emailChangePendingHint": "Je hebt een lopende aanvraag voor {email}. De verzonden link is 24 u geldig.",
    "emailChangeSubmit": "Verificatielink versturen",
    "emailChangeExpired": "Link verlopen of al gebruikt.",
    "emailChangeTakenRace": "Dit adres wordt nu door een ander account gebruikt.",
    "undoEmailExpired": "Link verlopen (de 7-daagse annuleringsperiode is voorbij).",
    "undoEmailCannotRevert": "Annuleren niet mogelijk — het oude adres wordt nu door een ander account gebruikt.",
    "cancelDeletionExpired": "Te laat — het account is definitief verwijderd.",
    "backToProfile": "Terug naar mijn profiel",
    "backToSignIn": "Terug naar inloggen",
    "dangerZone": "GEVARENZONE",
    "deleteAccountTitle": "Mijn account verwijderen",
    "deleteAccountIntro": "Verwijdering deactiveert je account onmiddellijk. Je gegevens worden na 30 dagen gewist. Je kunt op elk moment annuleren via de link die we je per e-mail sturen.",
    "deleteAccountConfirmHint": "Typ SUPPRIMER om te bevestigen",
    "deleteAccountSubmit": "Mijn account verwijderen",
    "emailToast_verify-sent": "Controleer je nieuwe e-mailadres — er wacht een link op je.",
    "emailToast_changed": "E-mailadres bijgewerkt.",
    "emailToast_reverted": "E-mailadres hersteld. Log opnieuw in.",
    "emailToast_invalid": "De ingevoerde gegevens zijn ongeldig.",
    "emailToast_taken": "Dit adres is al in gebruik.",
    "emailToast_same": "Dit is al je huidige adres.",
    "emailToast_set-password-first": "Maak eerst een wachtwoord aan via 'Wachtwoord vergeten'.",
    "emailToast_wrong-password": "Huidig wachtwoord onjuist.",
    "emailToast_rate-limit": "Te veel pogingen, probeer het over enkele minuten opnieuw.",
    "deleteToast_invalid": "Typ exact 'SUPPRIMER' om te bevestigen.",
    "deleteToast_wrong-password": "Huidig wachtwoord onjuist.",
    "deleteToast_rate-limit": "Te veel pogingen, probeer het over een uur opnieuw.",
    "errorAccountDeleted": "Dit account staat ingepland voor verwijdering. Annuleer via de link in je e-mail."
```

(Note: the confirmation word stays "SUPPRIMER" in every locale — it's a literal the form code checks against. The hint text is localized but the typed word is not.)

- [ ] **Step 3: Repeat for `messages/en.json`**

```json
    "currentEmailLabel": "Current address",
    "newEmailLabel": "New email address",
    "emailChangePendingHint": "You have a pending request for {email}. The link we sent is valid for 24h.",
    "emailChangeSubmit": "Send the verification link",
    "emailChangeExpired": "Link expired or already used.",
    "emailChangeTakenRace": "This address is now used by another account.",
    "undoEmailExpired": "Link expired (the 7-day undo window has passed).",
    "undoEmailCannotRevert": "Cannot undo — the old address is now used by another account.",
    "cancelDeletionExpired": "Too late — the account was permanently deleted.",
    "backToProfile": "Back to my profile",
    "backToSignIn": "Back to sign in",
    "dangerZone": "DANGER ZONE",
    "deleteAccountTitle": "Delete my account",
    "deleteAccountIntro": "Deletion disables your account immediately. Your data will be erased after 30 days. You can cancel any time using the link we'll send by email.",
    "deleteAccountConfirmHint": "Type SUPPRIMER to confirm",
    "deleteAccountSubmit": "Delete my account",
    "emailToast_verify-sent": "Check your new email address — a link is waiting for you.",
    "emailToast_changed": "Email address updated.",
    "emailToast_reverted": "Email address restored. Please sign in again.",
    "emailToast_invalid": "The information you entered is invalid.",
    "emailToast_taken": "This address is already in use.",
    "emailToast_same": "That's already your current address.",
    "emailToast_set-password-first": "Set a password first via 'Forgot password'.",
    "emailToast_wrong-password": "Current password incorrect.",
    "emailToast_rate-limit": "Too many attempts, please try again in a few minutes.",
    "deleteToast_invalid": "Type 'SUPPRIMER' exactly to confirm.",
    "deleteToast_wrong-password": "Current password incorrect.",
    "deleteToast_rate-limit": "Too many attempts, please try again in an hour.",
    "errorAccountDeleted": "This account is scheduled for deletion. Cancel via the link in your email."
```

- [ ] **Step 4: Repeat for `messages/de.json`**

```json
    "currentEmailLabel": "Aktuelle Adresse",
    "newEmailLabel": "Neue E-Mail-Adresse",
    "emailChangePendingHint": "Du hast eine ausstehende Anfrage für {email}. Der gesendete Link ist 24 Std. gültig.",
    "emailChangeSubmit": "Verifizierungslink senden",
    "emailChangeExpired": "Link abgelaufen oder bereits verwendet.",
    "emailChangeTakenRace": "Diese Adresse wird jetzt von einem anderen Konto verwendet.",
    "undoEmailExpired": "Link abgelaufen (das 7-Tage-Rücksetzfenster ist vorbei).",
    "undoEmailCannotRevert": "Rücksetzen nicht möglich — die alte Adresse wird jetzt von einem anderen Konto verwendet.",
    "cancelDeletionExpired": "Zu spät — das Konto wurde endgültig gelöscht.",
    "backToProfile": "Zurück zu meinem Profil",
    "backToSignIn": "Zurück zur Anmeldung",
    "dangerZone": "GEFAHRENZONE",
    "deleteAccountTitle": "Mein Konto löschen",
    "deleteAccountIntro": "Die Löschung deaktiviert dein Konto sofort. Deine Daten werden nach 30 Tagen gelöscht. Du kannst jederzeit über den per E-Mail gesendeten Link abbrechen.",
    "deleteAccountConfirmHint": "Tippe SUPPRIMER zur Bestätigung",
    "deleteAccountSubmit": "Mein Konto löschen",
    "emailToast_verify-sent": "Überprüfe deine neue E-Mail-Adresse — ein Link wartet auf dich.",
    "emailToast_changed": "E-Mail-Adresse aktualisiert.",
    "emailToast_reverted": "E-Mail-Adresse wiederhergestellt. Bitte melde dich erneut an.",
    "emailToast_invalid": "Die eingegebenen Daten sind ungültig.",
    "emailToast_taken": "Diese Adresse wird bereits verwendet.",
    "emailToast_same": "Das ist bereits deine aktuelle Adresse.",
    "emailToast_set-password-first": "Lege zuerst ein Passwort über 'Passwort vergessen' fest.",
    "emailToast_wrong-password": "Aktuelles Passwort falsch.",
    "emailToast_rate-limit": "Zu viele Versuche, bitte versuche es in einigen Minuten erneut.",
    "deleteToast_invalid": "Tippe exakt 'SUPPRIMER' zur Bestätigung.",
    "deleteToast_wrong-password": "Aktuelles Passwort falsch.",
    "deleteToast_rate-limit": "Zu viele Versuche, bitte versuche es in einer Stunde erneut.",
    "errorAccountDeleted": "Dieses Konto ist zur Löschung vorgemerkt. Brich über den Link in deiner E-Mail ab."
```

- [ ] **Step 5: Typecheck + build**

```bash
pnpm typecheck && pnpm build
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add messages/fr.json messages/nl.json messages/en.json messages/de.json
git commit -m "$(cat <<'EOF'
i18n(auth): keys for email change + account deletion (4 locales)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 19: Wire `errorAccountDeleted` into the sign-in page

**Files:** Modify `app/[locale]/(shop)/sign-in/page.tsx`

- [ ] **Step 1: Extend the `ERROR_KEYS` map**

Locate the `ERROR_KEYS` constant at the top of the file. Add one entry:
```ts
const ERROR_KEYS: Record<string, string> = {
  invalid: "errorInvalid",
  "invalid-credentials": "errorInvalidCredentials",
  "rate-limit": "errorRateLimit",
  "use-oauth": "errorUseOauth",
  "oauth-error": "errorOauth",
  "account-deleted": "errorAccountDeleted",
};
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/\(shop\)/sign-in/page.tsx
git commit -m "$(cat <<'EOF'
feat(auth): sign-in surfaces account-deleted error

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — End-to-end tests

### Task 20: `tests/e2e/auth-email-change.spec.ts`

**Files:** Create the spec.

- [ ] **Step 1: Create the spec**

```ts
import { test, expect } from "@playwright/test";

test("expired email-change confirm token shows expired screen", async ({ page }) => {
  await page.goto("/fr/confirm-email-change/this-is-not-a-real-token");
  await expect(page.getByText(/expir[eé]/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /profil/i })).toBeVisible();
});

test("expired email-change undo token shows undo-expired screen", async ({ page }) => {
  await page.goto("/fr/undo-email-change/this-is-not-a-real-token");
  await expect(page.getByText(/expir[eé]/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /connexion/i })).toBeVisible();
});

test("unauthenticated /compte/profil redirects to /sign-in", async ({ page }) => {
  await page.goto("/fr/compte/profil");
  await expect(page).toHaveURL(/\/fr\/sign-in/);
});
```

The happy path (logged-in user changes email → real confirm via Resend) is left as a manual smoke per the spec — wiring Resend in tests is out of scope.

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/auth-email-change.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): email-change pages (expired tokens, auth guard)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 21: `tests/e2e/auth-account-deletion.spec.ts`

**Files:** Create the spec.

- [ ] **Step 1: Create the spec**

```ts
import { test, expect } from "@playwright/test";

test("expired cancel-deletion token shows expired screen", async ({ page }) => {
  await page.goto("/fr/cancel-deletion/this-is-not-a-real-token");
  await expect(page.getByText(/trop tard|d[eé]finitivement/i)).toBeVisible();
});

test("danger zone form not visible to anonymous user", async ({ page }) => {
  await page.goto("/fr/compte/profil");
  // Redirect to sign-in: never see the danger zone heading.
  await expect(page.getByText(/zone de danger/i)).not.toBeVisible();
});
```

(Happy-path account deletion + cancel via email link is manual smoke — same rationale as Task 20.)

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/auth-account-deletion.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): account-deletion pages (expired cancel token, auth guard)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Covered by tasks |
|---|---|
| 10 new columns + 4 partial indexes on users | T1 |
| Migration 0014 | T2 |
| `purgeUser(userId)` helper | T3 |
| Rate-limit `email-change` + `delete` | T4 |
| 4 email templates × 4 locales | T5 |
| `requestEmailChange` | T6 |
| `confirmEmailChange` + `revertEmailChange` | T7 |
| `requestAccountDeletion` + `cancelAccountDeletion` | T8 |
| Sign-in guard + NextAuth OAuth signIn callback | T9 |
| `/confirm-email-change/[token]` page | T10 |
| `/undo-email-change/[token]` page | T11 |
| `/cancel-deletion/[token]` page | T12 |
| `EmailChangeBlock` component | T13 |
| `DangerZoneBlock` component | T14 |
| `/compte/profil` wires the 2 new blocks | T15 |
| `/api/cron/account-purge` route + `vercel.json` | T16 |
| Local-test purge script | T17 |
| ~30 new i18n keys × 4 locales | T18 |
| Sign-in page surfaces `account-deleted` | T19 |
| E2E email-change | T20 |
| E2E account-deletion | T21 |

No gap.

**Placeholder scan:**
- T8 contains a `TODO(v2-B)` comment for Stripe — this is **intentional** per the spec hors-scope. Flagged inline, not a placeholder in the code itself.
- All other steps have full code or full commands. ✓

**Type consistency:**
- `purgeUser(userId: string): Promise<void>` used in T3, T16 ✓
- `confirmEmailChange(rawToken, locale): EmailChangeResult` used in T7, T10 ✓
- `revertEmailChange(rawToken, locale): EmailChangeResult` used in T7, T11 ✓
- `cancelAccountDeletion(rawToken, locale): CancelDeletionResult` used in T8, T12 ✓
- `checkAuthRateLimit({action: 'email-change' | 'delete', ...})` consistent with T4 union ✓
- i18n keys referenced in T10, T11, T12, T13, T14, T15 all defined in T18 ✓
- New search-params (`email`, `delete`) used in T15 match action redirect codes from T6, T7, T8 ✓

No drift detected.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-31-auth-v2-sprint-a-rgpd.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

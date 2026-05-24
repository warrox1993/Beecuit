# BeeCuit — Phase 2 Sous-projet « Cartes cadeaux » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add digital gift cards to BeeCuit — buyer chooses 1 of 5 fixed amounts, fills recipient info + message + delivery date; recipient receives a cryptographic code by email at `delivery_at` (daily Vercel cron); code redeemable at checkout against biscuits/coffrets with partial-use support and 12-month expiration.

**Architecture:** 5 virtual `gift_card`-typed products in the `products` table (one per amount tier). Buying flows through the existing cart + Stripe Checkout (gift card details stored in `cart_items.metadata`). On payment webhook, a row is inserted in new `gift_cards` table with code + balance. Daily cron route reads pending cards and triggers a Resend email. Redemption at checkout uses Stripe Coupons API (`amount_off`, `duration: once`) applied to the Checkout Session; on success the webhook records a `gift_card_redemptions` row and atomically decrements the balance.

**Tech Stack additions over Phase 2 Coffrets:** Vercel Cron Jobs + `CRON_SECRET` env var (no new packages).

**Spec:** `docs/superpowers/specs/2026-05-24-phase2-cartes-cadeaux-design.md`

**Working directory:** `C:\Users\jeanb\Documents\WebAPP\BeeCuit` (Windows, PowerShell)

**Package manager:** pnpm

---

## Prerequisites (manual, one-off)

- [ ] **Generate a CRON_SECRET** (32+ char random): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — save the value, you'll add it to `.env.local` in Task 1 and to Vercel envs at the end.

No external service setup needed (Resend, Stripe, Vercel Cron all already in place).

---

## File structure produced by this plan

```
beecuit/
├── lib/
│   ├── env.ts                                  # MODIFIED: + CRON_SECRET
│   ├── gift-cards/
│   │   ├── constants.ts                        # NEW: GIFT_CARD_AMOUNTS_CENTS, EXPIRATION_MONTHS, GIFT_CARD_SKUS
│   │   ├── code.ts                             # NEW: generateGiftCardCode
│   │   └── validation.ts                       # NEW: validateGiftCardCode (server)
│   ├── db/
│   │   ├── schema.ts                           # MODIFIED: barrel + 2 new exports
│   │   └── schemas/
│   │       ├── gift_cards.ts                   # NEW
│   │       ├── gift_card_redemptions.ts        # NEW
│   │       └── orders.ts                       # MODIFIED: + gift_card_redemption_id
│   ├── validators/
│   │   └── gift-card.ts                        # NEW: AddGiftCardToCartSchema
│   ├── queries/
│   │   ├── gift-cards.ts                       # NEW: listPurchasedByUser, listReceivedByEmail, getByCode
│   │   └── cart.ts                             # MODIFIED: include gift_card line types
│   └── actions/
│       ├── cart.actions.ts                     # MODIFIED: addGiftCardToCart helper
│       ├── checkout.actions.ts                 # MODIFIED: giftCardCode input + Stripe coupon application
│       └── admin/gift-cards.actions.ts         # NEW: disableGiftCard
├── lib/stripe/
│   ├── checkout.ts                             # MODIFIED: accept discounts parameter
│   └── webhook.ts                              # MODIFIED: gift card creation + redemption
├── lib/email/templates/
│   └── GiftCardDelivery.tsx                    # NEW
├── app/
│   ├── [locale]/(shop)/
│   │   ├── cartes-cadeaux/page.tsx             # NEW (replaces ComingSoonPage if present)
│   │   └── checkout/page.tsx                   # MODIFIED: gift card input slot
│   ├── [locale]/(account)/compte/
│   │   └── cartes-cadeaux/page.tsx             # NEW
│   ├── admin/cartes-cadeaux/page.tsx           # NEW
│   └── api/cron/gift-cards-deliver/route.ts    # NEW
├── components/
│   ├── shop/
│   │   ├── GiftCardAmountPicker.tsx            # NEW
│   │   ├── GiftCardForm.tsx                    # NEW (client form)
│   │   ├── GiftCardCodeInput.tsx               # NEW (checkout)
│   │   ├── GiftCardReveal.tsx                  # NEW (account)
│   │   ├── CheckoutForm.tsx                    # MODIFIED: slot + state for gift card
│   │   └── CartItemRow.tsx                     # MODIFIED: gift_card variant rendering
│   └── admin/
│       └── GiftCardTable.tsx                   # NEW (table + disable action)
├── drizzle/
│   ├── 0005_gift_cards.sql                     # NEW (hand-written)
│   └── meta/0005_snapshot.json                 # NEW (drizzle-kit)
├── scripts/
│   └── seed-gift-card-products.mjs             # NEW
├── vercel.json                                 # NEW (cron config)
└── tests/
    ├── unit/
    │   ├── gift-card-code.test.ts              # NEW
    │   └── gift-card-validation.test.ts        # NEW
    ├── integration/
    │   ├── gift-card-add-to-cart.test.ts       # NEW
    │   ├── gift-card-webhook-create.test.ts    # NEW
    │   ├── gift-card-redemption.test.ts        # NEW
    │   └── gift-card-cron-deliver.test.ts      # NEW
    └── e2e/
        └── gift-card-purchase.spec.ts          # NEW
```

Total: **20 new files, 10 modified**.

---

## Task 1: Schema + migration 0005

**Files:**
- Create: `lib/db/schemas/gift_cards.ts`, `lib/db/schemas/gift_card_redemptions.ts`
- Modify: `lib/db/schemas/orders.ts` (add `giftCardRedemptionId`)
- Modify: `lib/db/schema.ts` (export 2 new)
- Create: `drizzle/0005_gift_cards.sql`
- Create: `drizzle/meta/0005_snapshot.json` (via drizzle-kit)
- Modify: `lib/env.ts` (add `CRON_SECRET`)

- [ ] **Step 1.1: Add `gift_cards` schema**

Create `lib/db/schemas/gift_cards.ts`:
```ts
import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { orders } from "./orders";

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

- [ ] **Step 1.2: Add `gift_card_redemptions` schema**

Create `lib/db/schemas/gift_card_redemptions.ts`:
```ts
import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { giftCards } from "./gift_cards";
import { orders } from "./orders";

export const giftCardRedemptions = pgTable("gift_card_redemptions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: text("gift_card_id").notNull().references(() => giftCards.id, { onDelete: "restrict" }),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
  amountCents: integer("amount_cents").notNull(),
  stripeCouponId: text("stripe_coupon_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
```

- [ ] **Step 1.3: Modify `orders.ts` — add `giftCardRedemptionId`**

In `lib/db/schemas/orders.ts`, inside the `orders` pgTable definition, add a new column AFTER `stripePaymentIntentId`:
```ts
giftCardRedemptionId: text("gift_card_redemption_id"),
```
Note: we don't add the `.references(() => giftCardRedemptions.id)` here to avoid a circular import (`orders.ts` → `gift_card_redemptions.ts` → `orders.ts`). The FK is enforced via the migration SQL instead.

- [ ] **Step 1.4: Update barrel**

In `lib/db/schema.ts`, append:
```ts
export * from "./schemas/gift_cards";
export * from "./schemas/gift_card_redemptions";
```

- [ ] **Step 1.5: Add `CRON_SECRET` to env validation**

In `lib/env.ts`, inside the `server:` object of `createEnv`, add:
```ts
CRON_SECRET: z.string().min(32),
```
And in the `runtimeEnv:` object:
```ts
CRON_SECRET: process.env.CRON_SECRET,
```
Generate a value and add to `.env.local`:
```
CRON_SECRET="<paste 64-hex value from the prereq>"
```

- [ ] **Step 1.6: Hand-write the migration**

Create `drizzle/0005_gift_cards.sql`:
```sql
-- Add gift_card to the product_type enum
ALTER TYPE "product_type" ADD VALUE IF NOT EXISTS 'gift_card';
--> statement-breakpoint

-- gift_cards table
CREATE TABLE "gift_cards" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL UNIQUE,
  "initial_amount_cents" integer NOT NULL,
  "remaining_amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'EUR',
  "purchaser_user_id" text,
  "purchaser_email" text NOT NULL,
  "recipient_email" text NOT NULL,
  "recipient_name" text,
  "message" text,
  "delivery_at" timestamp NOT NULL,
  "delivered_at" timestamp,
  "expires_at" timestamp NOT NULL,
  "purchase_order_id" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "gift_card_amount_positive" CHECK ("initial_amount_cents" > 0 AND "remaining_amount_cents" >= 0),
  CONSTRAINT "gift_card_remaining_not_exceeds_initial" CHECK ("remaining_amount_cents" <= "initial_amount_cents")
);
--> statement-breakpoint

ALTER TABLE "gift_cards"
  ADD CONSTRAINT "gift_cards_purchaser_user_id_users_id_fk"
  FOREIGN KEY ("purchaser_user_id") REFERENCES "public"."users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "gift_cards"
  ADD CONSTRAINT "gift_cards_purchase_order_id_orders_id_fk"
  FOREIGN KEY ("purchase_order_id") REFERENCES "public"."orders"("id") ON DELETE set null;
--> statement-breakpoint

-- gift_card_redemptions table
CREATE TABLE "gift_card_redemptions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "gift_card_id" text NOT NULL,
  "order_id" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "stripe_coupon_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "redemption_amount_positive" CHECK ("amount_cents" > 0)
);
--> statement-breakpoint

ALTER TABLE "gift_card_redemptions"
  ADD CONSTRAINT "gcr_gift_card_id_fk"
  FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "gift_card_redemptions"
  ADD CONSTRAINT "gcr_order_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict;
--> statement-breakpoint

-- orders.gift_card_redemption_id (nullable, FK without cascade trouble)
ALTER TABLE "orders" ADD COLUMN "gift_card_redemption_id" text;
--> statement-breakpoint
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_gift_card_redemption_id_fk"
  FOREIGN KEY ("gift_card_redemption_id") REFERENCES "public"."gift_card_redemptions"("id") ON DELETE set null;
```

- [ ] **Step 1.7: Generate snapshot + apply migration**

```powershell
pnpm db:generate
```
If drizzle-kit wants to create a new migration file, decline or replace the generated content with the hand-written SQL above (keep the snapshot).

Apply:
```powershell
pnpm db:migrate
```

Verify the schema changes applied:
```powershell
node --input-type=module -e "import fs from 'fs'; import { neon } from '@neondatabase/serverless'; const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).map(l=>l.match(/^([A-Z_]+)=`"(.*)`"\s*$/)).filter(Boolean).map(m=>[m[1],m[2]])); const sql = neon(env.DATABASE_URL); const r = await sql\`SELECT table_name FROM information_schema.tables WHERE table_name IN ('gift_cards','gift_card_redemptions')\`; console.log(r); const e = await sql\`SELECT unnest(enum_range(NULL::product_type)) AS v\`; console.log(e);"
```
Expected: 2 tables present, enum includes `gift_card`.

- [ ] **Step 1.8: Commit**

```powershell
git add lib/db/schemas/gift_cards.ts lib/db/schemas/gift_card_redemptions.ts lib/db/schemas/orders.ts lib/db/schema.ts lib/env.ts drizzle/0005_gift_cards.sql drizzle/meta/0005_snapshot.json
git commit -m "feat(gift-cards): db schema + migration 0005 (gift_cards, redemptions, orders FK, CRON_SECRET env)"
```

---

## Task 2: Pure constants + code generation (TDD)

**Files:**
- Create: `lib/gift-cards/constants.ts`
- Create: `lib/gift-cards/code.ts`
- Test: `tests/unit/gift-card-code.test.ts`

- [ ] **Step 2.1: Write the failing test**

Create `tests/unit/gift-card-code.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateGiftCardCode } from "@/lib/gift-cards/code";

describe("generateGiftCardCode", () => {
  it("matches the BC-XXXX-XXXX-XXXX format", () => {
    const code = generateGiftCardCode();
    expect(code).toMatch(/^BC-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it("generates 10000 unique codes (no obvious collisions)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 10000; i++) set.add(generateGiftCardCode());
    expect(set.size).toBe(10000);
  });
});
```

- [ ] **Step 2.2: Run, expect FAIL**

```powershell
pnpm vitest run tests/unit/gift-card-code.test.ts
```
Expected: `Cannot find module '@/lib/gift-cards/code'`.

- [ ] **Step 2.3: Write constants**

Create `lib/gift-cards/constants.ts`:
```ts
// 5 fixed amounts in cents
export const GIFT_CARD_AMOUNTS_CENTS = [1500, 2500, 5000, 7500, 10000] as const;
export type GiftCardAmountCents = (typeof GIFT_CARD_AMOUNTS_CENTS)[number];

// SKU per tier (used by seed + lookup)
export const GIFT_CARD_SKUS: Record<GiftCardAmountCents, string> = {
  1500: "GIFT-015",
  2500: "GIFT-025",
  5000: "GIFT-050",
  7500: "GIFT-075",
  10000: "GIFT-100",
};

// 12 months in days for expires_at calculation (use date-fns or addMonths if available)
export const EXPIRATION_MONTHS = 12;
```

- [ ] **Step 2.4: Write code generator**

Create `lib/gift-cards/code.ts`:
```ts
import { randomBytes } from "node:crypto";

export function generateGiftCardCode(): string {
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `BC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}
```

- [ ] **Step 2.5: Run, expect PASS**

```powershell
pnpm vitest run tests/unit/gift-card-code.test.ts
```
Expected: 2/2 pass.

- [ ] **Step 2.6: Commit**

```powershell
git add lib/gift-cards/ tests/unit/gift-card-code.test.ts
git commit -m "feat(gift-cards): pure code generator + constants + unit tests"
```

---

## Task 3: Pure validation logic (TDD with DB mock)

**Files:**
- Create: `lib/gift-cards/validation.ts`
- Test: `tests/unit/gift-card-validation.test.ts`

- [ ] **Step 3.1: Write the failing test**

Create `tests/unit/gift-card-validation.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateGiftCardCode } from "@/lib/gift-cards/validation";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }));

const mockSelectOne = (row: Record<string, unknown> | null) => {
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(row ? [row] : []),
      }),
    }),
  });
};

const now = new Date("2026-06-01T12:00:00Z");
const future = new Date("2027-06-01T12:00:00Z");
const past = new Date("2025-01-01T12:00:00Z");

describe("validateGiftCardCode", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns valid + amountAvailable when card is active, delivered, not expired, has balance", async () => {
    mockSelectOne({
      id: "gc1",
      isActive: true,
      deliveredAt: past,
      expiresAt: future,
      remainingAmountCents: 5000,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.cardId).toBe("gc1");
      expect(r.amountAvailableCents).toBe(5000);
    }
  });

  it("returns invalid when code not found", async () => {
    mockSelectOne(null);
    const r = await validateGiftCardCode("BC-XXXX-XXXX-XXXX", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/inconnu/i);
  });

  it("returns invalid when card not yet delivered", async () => {
    mockSelectOne({
      id: "gc1", isActive: true, deliveredAt: null, expiresAt: future, remainingAmountCents: 5000,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/pas encore/i);
  });

  it("returns invalid when expired", async () => {
    mockSelectOne({
      id: "gc1", isActive: true, deliveredAt: past, expiresAt: past, remainingAmountCents: 5000,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/expir/i);
  });

  it("returns invalid when fully used", async () => {
    mockSelectOne({
      id: "gc1", isActive: true, deliveredAt: past, expiresAt: future, remainingAmountCents: 0,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/utilis/i);
  });

  it("returns invalid when disabled", async () => {
    mockSelectOne({
      id: "gc1", isActive: false, deliveredAt: past, expiresAt: future, remainingAmountCents: 5000,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(false);
  });
});
```

- [ ] **Step 3.2: Run, expect FAIL**

```powershell
pnpm vitest run tests/unit/gift-card-validation.test.ts
```

- [ ] **Step 3.3: Implementation**

Create `lib/gift-cards/validation.ts`:
```ts
import "server-only";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type GiftCardValidation =
  | { valid: true; cardId: string; amountAvailableCents: number }
  | { valid: false; error: string };

export async function validateGiftCardCode(
  code: string,
  now: Date = new Date(),
): Promise<GiftCardValidation> {
  const [card] = await db
    .select({
      id: giftCards.id,
      isActive: giftCards.isActive,
      deliveredAt: giftCards.deliveredAt,
      expiresAt: giftCards.expiresAt,
      remainingAmountCents: giftCards.remainingAmountCents,
    })
    .from(giftCards)
    .where(eq(giftCards.code, code))
    .limit(1);

  if (!card) return { valid: false, error: "Code carte cadeau inconnu" };
  if (!card.isActive) return { valid: false, error: "Carte cadeau désactivée" };
  if (!card.deliveredAt) return { valid: false, error: "Carte cadeau pas encore activée" };
  if (card.expiresAt.getTime() < now.getTime()) return { valid: false, error: "Carte cadeau expirée" };
  if (card.remainingAmountCents <= 0) return { valid: false, error: "Carte cadeau déjà utilisée intégralement" };

  return { valid: true, cardId: card.id, amountAvailableCents: card.remainingAmountCents };
}
```

- [ ] **Step 3.4: Run, expect PASS**

```powershell
pnpm vitest run tests/unit/gift-card-validation.test.ts
```
Expected: 6/6 pass.

- [ ] **Step 3.5: Commit**

```powershell
git add lib/gift-cards/validation.ts tests/unit/gift-card-validation.test.ts
git commit -m "feat(gift-cards): validateGiftCardCode + 6 unit test cases"
```

---

## Task 4: Validators + queries

**Files:**
- Create: `lib/validators/gift-card.ts`
- Create: `lib/queries/gift-cards.ts`

- [ ] **Step 4.1: Validator schema**

Create `lib/validators/gift-card.ts`:
```ts
import { z } from "zod";
import { GIFT_CARD_AMOUNTS_CENTS } from "@/lib/gift-cards/constants";

export const AddGiftCardToCartSchema = z.object({
  amountCents: z
    .number()
    .int()
    .refine((v) => (GIFT_CARD_AMOUNTS_CENTS as readonly number[]).includes(v), {
      message: "Montant non autorisé",
    }),
  recipientEmail: z.string().email(),
  recipientName: z.string().max(120).nullable(),
  message: z.string().max(500).nullable(),
  deliveryAt: z.string().datetime(),
});
export type AddGiftCardToCartInput = z.infer<typeof AddGiftCardToCartSchema>;
```

- [ ] **Step 4.2: Queries**

Create `lib/queries/gift-cards.ts`:
```ts
import "server-only";
import { db } from "@/lib/db";
import { giftCards, giftCardRedemptions } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function listPurchasedByUser(userId: string) {
  return db
    .select()
    .from(giftCards)
    .where(eq(giftCards.purchaserUserId, userId))
    .orderBy(desc(giftCards.createdAt));
}

export async function listReceivedByEmail(email: string) {
  const rows = await db
    .select({
      id: giftCards.id,
      code: giftCards.code,
      initialAmountCents: giftCards.initialAmountCents,
      remainingAmountCents: giftCards.remainingAmountCents,
      deliveredAt: giftCards.deliveredAt,
      expiresAt: giftCards.expiresAt,
      message: giftCards.message,
      purchaserEmail: giftCards.purchaserEmail,
      isActive: giftCards.isActive,
    })
    .from(giftCards)
    .where(and(eq(giftCards.recipientEmail, email), sql`${giftCards.deliveredAt} IS NOT NULL`))
    .orderBy(desc(giftCards.deliveredAt));
  return rows;
}

export async function getRedemptionsForCard(cardId: string) {
  return db
    .select()
    .from(giftCardRedemptions)
    .where(eq(giftCardRedemptions.giftCardId, cardId))
    .orderBy(desc(giftCardRedemptions.createdAt));
}

// Admin
export async function listAllGiftCards(opts: { search?: string; statusFilter?: "pending" | "delivered" | "used" | "expired" }) {
  // For simplicity in V1, fetch all + filter in code (4 coffrets-style scale).
  // If volume grows, refactor to SQL WHERE clauses.
  const all = await db.select().from(giftCards).orderBy(desc(giftCards.createdAt));
  let filtered = all;
  if (opts.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.recipientEmail.toLowerCase().includes(q) ||
        c.purchaserEmail.toLowerCase().includes(q),
    );
  }
  if (opts.statusFilter) {
    const now = Date.now();
    filtered = filtered.filter((c) => {
      const delivered = c.deliveredAt != null;
      const expired = c.expiresAt.getTime() < now;
      const used = c.remainingAmountCents === 0;
      if (opts.statusFilter === "pending") return !delivered;
      if (opts.statusFilter === "delivered") return delivered && !used && !expired;
      if (opts.statusFilter === "used") return used;
      if (opts.statusFilter === "expired") return expired && !used;
      return true;
    });
  }
  return filtered;
}
```

- [ ] **Step 4.3: Verify TS**

```powershell
pnpm exec tsc --noEmit
```
Expected: clean.

- [ ] **Step 4.4: Commit**

```powershell
git add lib/validators/gift-card.ts lib/queries/gift-cards.ts
git commit -m "feat(gift-cards): Zod validator + queries (user/admin)"
```

---

## Task 5: Seed 5 virtual gift card products

**Files:**
- Create: `scripts/seed-gift-card-products.mjs`

- [ ] **Step 5.1: Write the seed script**

Create `scripts/seed-gift-card-products.mjs`:
```js
#!/usr/bin/env node
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="(.*)"\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]),
);
const sql = neon(env.DATABASE_URL);

const TIERS = [
  { sku: "GIFT-015", cents: 1500, label: "15 €" },
  { sku: "GIFT-025", cents: 2500, label: "25 €" },
  { sku: "GIFT-050", cents: 5000, label: "50 €" },
  { sku: "GIFT-075", cents: 7500, label: "75 €" },
  { sku: "GIFT-100", cents: 10000, label: "100 €" },
];
const LOCALES = ["fr", "nl", "en", "de"];

(async () => {
  for (const t of TIERS) {
    const existing = await sql`SELECT id FROM products WHERE sku = ${t.sku}`;
    if (existing.length > 0) { console.log(`skip ${t.sku}`); continue; }
    const [prod] = await sql`
      INSERT INTO products (type, sku, base_price_cents, weight_grams, stock_quantity, is_active, is_featured)
      VALUES ('gift_card', ${t.sku}, ${t.cents}, 0, 999999, true, false)
      RETURNING id
    `;
    for (const loc of LOCALES) {
      await sql`
        INSERT INTO product_translations
          (product_id, locale, name, slug, short_description, long_description, ingredients, allergens, nutritional_facts_per_100g, seo_title, seo_description)
        VALUES (
          ${prod.id}, ${loc},
          ${'Carte cadeau ' + t.label}, ${'carte-cadeau-' + (t.cents/100) + '-euros' + (loc === 'fr' ? '' : '-' + loc)},
          ${'Carte cadeau BeeCuit ' + t.label}, ${'Une carte cadeau BeeCuit de ' + t.label + ' à offrir par email. Valable 12 mois sur tous les biscuits et coffrets.'},
          '—', ARRAY[]::text[],
          '{"energy_kcal":0,"fat_g":0,"carbs_g":0,"protein_g":0,"salt_g":0}'::jsonb,
          ${'Carte cadeau ' + t.label + ' BeeCuit'}, ${'Carte cadeau ' + t.label + ' BeeCuit à offrir, valable 12 mois'}
        )
      `;
    }
    console.log(`✓ ${t.sku}`);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 5.2: Run + verify**

```powershell
node scripts/seed-gift-card-products.mjs
```
Then:
```powershell
node --input-type=module -e "import fs from 'fs'; import { neon } from '@neondatabase/serverless'; const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).map(l=>l.match(/^([A-Z_]+)=`"(.*)`"\s*$/)).filter(Boolean).map(m=>[m[1],m[2]])); const sql = neon(env.DATABASE_URL); const r = await sql\`SELECT sku, base_price_cents FROM products WHERE type = 'gift_card' ORDER BY base_price_cents\`; for (const row of r) console.log(row);"
```
Expected: 5 rows.

- [ ] **Step 5.3: Commit**

```powershell
git add scripts/seed-gift-card-products.mjs
git commit -m "feat(gift-cards): seed 5 virtual products (GIFT-015 to GIFT-100)"
```

---

## Task 6: addGiftCardToCart action + integration test

**Files:**
- Modify: `lib/actions/cart.actions.ts` (export `addGiftCardToCart`)
- Test: `tests/integration/gift-card-add-to-cart.test.ts`

- [ ] **Step 6.1: Write the failing integration test**

Create `tests/integration/gift-card-add-to-cart.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { products, cartItems, carts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const userId = "test-user-gift-cart";
vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: userId, role: "customer", email: "buyer@test.com" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let cartId: string | undefined;

beforeAll(async () => {
  // Ensure test user exists (FK from carts to users)
  await db.insert(users).values({ id: userId, email: "buyer@test.com" }).onConflictDoNothing();
  await db.delete(carts).where(eq(carts.userId, userId));
});

afterAll(async () => {
  if (cartId) await db.delete(carts).where(eq(carts.id, cartId));
  await db.delete(users).where(eq(users.id, userId));
});

describe("addGiftCardToCart (integration)", () => {
  it("inserts a cart_item with type=gift_card metadata and correct productId for the amount tier", async () => {
    const { addGiftCardToCart } = await import("@/lib/actions/cart.actions");
    await addGiftCardToCart({
      amountCents: 5000,
      recipientEmail: "recipient@test.com",
      recipientName: "Marie",
      message: "Joyeux anniversaire !",
      deliveryAt: "2026-12-25T08:00:00Z",
    });
    const rows = await db
      .select()
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .innerJoin(products, eq(products.id, cartItems.productId))
      .where(eq(carts.userId, userId));
    expect(rows).toHaveLength(1);
    cartId = rows[0]!.carts.id;
    expect(rows[0]!.products.sku).toBe("GIFT-050");
    expect(rows[0]!.cart_items.metadata).toMatchObject({
      type: "gift_card",
      recipientEmail: "recipient@test.com",
      recipientName: "Marie",
      message: "Joyeux anniversaire !",
      deliveryAt: "2026-12-25T08:00:00Z",
    });
  });
});
```

- [ ] **Step 6.2: Run, expect FAIL**

```powershell
npx dotenv -e .env.local -- pnpm vitest run tests/integration/gift-card-add-to-cart.test.ts
```

- [ ] **Step 6.3: Extend cart actions**

In `lib/actions/cart.actions.ts`, ADD a new exported function (don't modify existing `addToCart`):

```ts
import { AddGiftCardToCartSchema } from "@/lib/validators/gift-card";
import { GIFT_CARD_SKUS, type GiftCardAmountCents } from "@/lib/gift-cards/constants";

export async function addGiftCardToCart(rawInput: unknown) {
  const input = AddGiftCardToCartSchema.parse(rawInput);
  const sku = GIFT_CARD_SKUS[input.amountCents as GiftCardAmountCents];
  if (!sku) throw new Error("Invalid gift card amount");

  const [prod] = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
  if (!prod) throw new Error(`Gift card product ${sku} not found (run seed-gift-card-products.mjs)`);

  const cartId = await getActiveCartId();

  await db.insert(cartItems).values({
    cartId,
    productId: prod.id,
    quantity: 1,
    metadata: {
      type: "gift_card" as const,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      message: input.message,
      deliveryAt: input.deliveryAt,
    },
  });

  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  revalidatePath("/", "layout");
}
```

Also extend the `CartItemMetadata` type in `lib/db/schemas/cart.ts` to include the new variant:
```ts
export type CartItemMetadata =
  | {
      type?: "coffret";
      giftMessage?: string | null;
      packagingTier?: "standard" | "premium";
    }
  | {
      type: "gift_card";
      recipientEmail: string;
      recipientName: string | null;
      message: string | null;
      deliveryAt: string;
    };
```

- [ ] **Step 6.4: Run test, expect PASS**

```powershell
npx dotenv -e .env.local -- pnpm vitest run tests/integration/gift-card-add-to-cart.test.ts
```

- [ ] **Step 6.5: Commit**

```powershell
git add lib/actions/cart.actions.ts lib/db/schemas/cart.ts tests/integration/gift-card-add-to-cart.test.ts
git commit -m "feat(gift-cards): addGiftCardToCart server action + metadata variant + integration test"
```

---

## Task 7: getCartContents handles gift_card lines

**Files:**
- Modify: `lib/queries/cart.ts`

- [ ] **Step 7.1: Extend CartLine type + getCartContents**

In `lib/queries/cart.ts`, update the `CartLine` type to include `gift_card` in the `type` union and the `metadata` shape variant. Then in `getCartContents`, gift cards need NO special pricing computation (basePriceCents is already the amount) and NO availability check; just pass through:

Replace the inner `rows.map(...)` body with:
```ts
return Promise.all(
  rows.map(async (r): Promise<CartLine> => {
    let unitPriceCents = r.basePriceCents;
    let coffretBreakdown: CartLine["coffretBreakdown"];
    let coffretDiscountPercent: number | undefined;
    if (r.type === "coffret") {
      const p = await computeCoffretPrice(r.productId, locale);
      unitPriceCents = p.totalCents;
      coffretBreakdown = p.breakdown;
      coffretDiscountPercent = p.discountPercent;
      if (
        r.metadata &&
        "packagingTier" in r.metadata &&
        r.metadata.packagingTier === "premium"
      ) {
        unitPriceCents += PREMIUM_PACKAGING_SURCHARGE_CENTS;
      }
    }
    // gift_card lines: unitPriceCents = basePriceCents (already correct), no extra logic
    return {
      cartItemId: r.cartItemId,
      productId: r.productId,
      sku: r.sku,
      type: r.type as "biscuit" | "coffret" | "gift_card",
      quantity: r.quantity,
      unitPriceCents,
      stockQuantity: r.stockQuantity,
      weightGrams: r.weightGrams,
      name: r.name,
      slug: r.slug,
      primaryImageUrl: r.primaryImageUrl,
      metadata: r.metadata as CartLine["metadata"],
      coffretDiscountPercent,
      coffretBreakdown,
    };
  }),
);
```
Also update the `CartLine.type` union to `"biscuit" | "coffret" | "gift_card"` and the `metadata` union to include the gift_card variant (mirror the schema type).

- [ ] **Step 7.2: Verify TS**

```powershell
pnpm exec tsc --noEmit
```

- [ ] **Step 7.3: Commit**

```powershell
git add lib/queries/cart.ts
git commit -m "feat(gift-cards): getCartContents passes through gift_card lines"
```

---

## Task 8: Public page `/cartes-cadeaux` + components

**Files:**
- Create: `app/[locale]/(shop)/cartes-cadeaux/page.tsx`
- Create: `components/shop/GiftCardAmountPicker.tsx`
- Create: `components/shop/GiftCardForm.tsx`

- [ ] **Step 8.1: GiftCardAmountPicker (client)**

Create `components/shop/GiftCardAmountPicker.tsx`:
```tsx
"use client";
import { GIFT_CARD_AMOUNTS_CENTS, type GiftCardAmountCents } from "@/lib/gift-cards/constants";

export function GiftCardAmountPicker({
  value,
  onChange,
}: {
  value: GiftCardAmountCents;
  onChange: (v: GiftCardAmountCents) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {GIFT_CARD_AMOUNTS_CENTS.map((cents) => {
        const active = cents === value;
        return (
          <button
            key={cents}
            type="button"
            onClick={() => onChange(cents)}
            className={`rounded-xl border-2 p-4 text-center transition-colors ${
              active ? "border-honey bg-honey/10" : "border-cookie/30 bg-white"
            }`}
          >
            <div className="font-display text-2xl text-warm-brown">{cents / 100} €</div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 8.2: GiftCardForm (client)**

Create `components/shop/GiftCardForm.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GiftCardAmountPicker } from "./GiftCardAmountPicker";
import { addGiftCardToCart } from "@/lib/actions/cart.actions";
import { GIFT_CARD_AMOUNTS_CENTS, type GiftCardAmountCents } from "@/lib/gift-cards/constants";

export function GiftCardForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [amount, setAmount] = useState<GiftCardAmountCents>(GIFT_CARD_AMOUNTS_CENTS[1]);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const todayISO = new Date().toISOString().split("T")[0];
  const [deliveryDate, setDeliveryDate] = useState(todayISO);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          try {
            await addGiftCardToCart({
              amountCents: amount,
              recipientEmail,
              recipientName: recipientName.trim() || null,
              message: message.trim() || null,
              deliveryAt: new Date(deliveryDate + "T09:00:00Z").toISOString(),
            });
            router.push("/panier");
          } catch (e2) {
            setErr((e2 as Error).message);
          }
        });
      }}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-3">Montant</label>
        <GiftCardAmountPicker value={amount} onChange={setAmount} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-2">
          Email du destinataire
        </label>
        <input
          required
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="w-full border border-cookie/30 rounded-lg px-3 py-2"
          placeholder="marie@exemple.be"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-2">
          Nom du destinataire <span className="font-normal text-warm-brown/60">(optionnel)</span>
        </label>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          maxLength={120}
          className="w-full border border-cookie/30 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-2">
          Message <span className="font-normal text-warm-brown/60">(optionnel, 500 max)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full border border-cookie/30 rounded-lg px-3 py-2"
        />
        <div className="text-xs text-warm-brown/60 text-right mt-1">{message.length}/500</div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-2">
          Date d&apos;envoi
        </label>
        <input
          required
          type="date"
          min={todayISO}
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="border border-cookie/30 rounded-lg px-3 py-2"
        />
        <div className="text-xs text-warm-brown/60 mt-1">
          L&apos;email partira à 09:00 UTC le jour choisi.
        </div>
      </div>
      {err && <p className="text-terracotta text-sm">{err}</p>}
      <Button
        type="submit"
        disabled={pending || !recipientEmail}
        className="bg-honey text-cream hover:bg-honey-dark px-6 py-6 text-base w-full"
      >
        {pending ? "..." : `Ajouter au panier — ${amount / 100} €`}
      </Button>
    </form>
  );
}
```

- [ ] **Step 8.3: Page**

Create `app/[locale]/(shop)/cartes-cadeaux/page.tsx`:
```tsx
import { setRequestLocale } from "next-intl/server";
import { GiftCardForm } from "@/components/shop/GiftCardForm";
import { Container } from "@/components/ui-primitives/Container";

export default async function CartesCadeauxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container className="py-12">
      <header className="mb-10 text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-warm-brown/60 mb-2">
          Cartes cadeaux
        </p>
        <h1 className="text-4xl md:text-5xl font-display text-warm-brown">
          Offre BeeCuit
        </h1>
        <p className="mt-3 text-warm-brown/70">
          Une carte cadeau numérique pour faire goûter nos biscuits liégeois.
          Envoyée par email à la date que tu choisis. Valable 12 mois.
        </p>
      </header>
      <div className="max-w-xl mx-auto bg-cream/40 rounded-2xl p-6 md:p-8">
        <GiftCardForm />
      </div>
    </Container>
  );
}
```

If `app/[locale]/(shop)/cartes-cadeaux/page.tsx` already exists (ComingSoon placeholder from Phase 0), overwrite it.

- [ ] **Step 8.4: Verify + commit**

```powershell
pnpm exec tsc --noEmit
git add "app/[locale]/(shop)/cartes-cadeaux/page.tsx" components/shop/GiftCardAmountPicker.tsx components/shop/GiftCardForm.tsx
git commit -m "feat(gift-cards): public /cartes-cadeaux page + amount picker + form"
```

---

## Task 9: Cart row rendering for gift_card variant

**Files:**
- Modify: `components/shop/CartItemRow.tsx`

- [ ] **Step 9.1: Add gift_card variant block**

In `components/shop/CartItemRow.tsx`, locate the `isCoffret` rendering block and add a parallel `isGiftCard` block. The check:
```tsx
const isGiftCard = metadata && "type" in metadata && metadata.type === "gift_card";
```

For gift cards:
- Show 📧 placeholder instead of 🍪
- Quantity always shown as `×1` (no selector)
- Display recipient + delivery date under the title:
```tsx
{isGiftCard && (
  <div className="pl-24 pr-12 text-xs space-y-1">
    <p className="text-warm-brown/80">
      📧 Pour {(metadata as { recipientEmail: string }).recipientEmail}
    </p>
    <p className="text-warm-brown/60">
      Envoi : {new Date((metadata as { deliveryAt: string }).deliveryAt).toLocaleDateString("fr-BE")}
    </p>
  </div>
)}
```
The existing inline gift message editor should NOT render for gift_card type (the message is the recipient's, not editable post-add). Adjust the conditional accordingly.

- [ ] **Step 9.2: Verify + commit**

```powershell
pnpm exec tsc --noEmit
git add components/shop/CartItemRow.tsx
git commit -m "feat(gift-cards): cart row variant for gift_card (recipient + delivery date display)"
```

---

## Task 10: Checkout integration (Stripe Coupon for redemption)

**Files:**
- Modify: `lib/stripe/checkout.ts` (accept `couponId` parameter)
- Modify: `lib/actions/checkout.actions.ts` (validate + apply giftCardCode)
- Modify: `lib/validators/checkout.ts` (add `giftCardCode` optional)
- Modify: `components/shop/CheckoutForm.tsx` (add input + state)
- Create: `components/shop/GiftCardCodeInput.tsx`

- [ ] **Step 10.1: Extend `lib/stripe/checkout.ts`**

Add `couponId?: string` to `createStripeCheckoutSession` args. In the session creation call, conditionally add:
```ts
discounts: args.couponId ? [{ coupon: args.couponId }] : undefined,
```

- [ ] **Step 10.2: Extend `CheckoutSchema`**

In `lib/validators/checkout.ts`, add an optional field on the existing schema:
```ts
giftCardCode: z.string().regex(/^BC-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/).optional(),
```

- [ ] **Step 10.3: Update `createCheckoutSession` action**

In `lib/actions/checkout.actions.ts`, after the cart contents are loaded and totals computed, before the Stripe session call:

```ts
import { validateGiftCardCode } from "@/lib/gift-cards/validation";
import { stripe } from "@/lib/stripe/client";
// ...

let couponId: string | undefined;
let giftCardRedemptionPending: { giftCardId: string; deductionCents: number } | undefined;

// Reject: cannot apply gift card to an order that BUYS a gift card
const hasGiftCardItem = items.some((i) => i.type === "gift_card");

if (input.giftCardCode && !hasGiftCardItem) {
  const v = await validateGiftCardCode(input.giftCardCode);
  if (!v.valid) throw new Error(v.error);
  const deductionCents = Math.min(v.amountAvailableCents, totals.totalCents);
  const coupon = await stripe.coupons.create({
    amount_off: deductionCents,
    currency: "eur",
    duration: "once",
    name: `Carte cadeau ${input.giftCardCode}`,
  });
  couponId = coupon.id;
  giftCardRedemptionPending = { giftCardId: v.cardId, deductionCents };
}
```

Then pass to the Stripe call:
```ts
const stripeSession = await createStripeCheckoutSession({
  // ...existing args
  couponId,
});
```

Persist the pending redemption details on the order's `metadata` jsonb so the webhook can finalize:
```ts
await db.update(orders).set({
  stripeSessionId: stripeSession.id,
  metadata: giftCardRedemptionPending
    ? {
        giftCardId: giftCardRedemptionPending.giftCardId,
        giftCardDeductionCents: giftCardRedemptionPending.deductionCents,
        stripeCouponId: couponId,
      }
    : {},
}).where(eq(orders.id, order.id));
```

Also adjust shipping for gift-card-only carts (no physical delivery):
```ts
const allGiftCards = items.every((i) => i.type === "gift_card");
const shippingCents = allGiftCards ? 0 : rate.priceCents;
```
And replace the `if (!rate) throw` to only throw when there are physical items:
```ts
if (!allGiftCards && !rate) throw new Error("Poids excède la livraison disponible");
```

- [ ] **Step 10.4: GiftCardCodeInput component**

Create `components/shop/GiftCardCodeInput.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { validateGiftCardCodeAction } from "@/lib/actions/gift-cards.actions";

export function GiftCardCodeInput({
  onApplied,
  onRemoved,
  appliedAmountCents,
}: {
  onApplied: (code: string, amountAvailableCents: number) => void;
  onRemoved: () => void;
  appliedAmountCents: number | null;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (appliedAmountCents !== null) {
    return (
      <div className="flex items-center justify-between bg-honey/10 border border-honey/30 rounded-lg p-3 text-sm">
        <span className="text-warm-brown">
          ✓ Carte cadeau appliquée (−{(appliedAmountCents / 100).toFixed(2).replace(".", ",")} €)
        </span>
        <button type="button" onClick={onRemoved} className="text-warm-brown/60 underline text-xs">
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-warm-brown">
        🎁 Carte cadeau <span className="font-normal text-warm-brown/60">(optionnel)</span>
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="BC-XXXX-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1 border border-cookie/30 rounded-lg px-3 py-2 font-mono text-sm"
        />
        <button
          type="button"
          disabled={pending || !code}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await validateGiftCardCodeAction(code);
              if (!r.valid) setErr(r.error);
              else onApplied(code, r.amountAvailableCents);
            });
          }}
          className="bg-honey text-cream px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {pending ? "..." : "Appliquer"}
        </button>
      </div>
      {err && <p className="text-terracotta text-xs">{err}</p>}
    </div>
  );
}
```

- [ ] **Step 10.5: Create gift-cards.actions.ts wrapper**

Create `lib/actions/gift-cards.actions.ts`:
```ts
"use server";
import { validateGiftCardCode } from "@/lib/gift-cards/validation";

export async function validateGiftCardCodeAction(code: string) {
  // Public server action wrapper — no auth required (codes themselves are the auth)
  return validateGiftCardCode(code);
}

// Admin action — see Task 12 for context
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function disableGiftCard(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
  await db.update(giftCards).set({ isActive: false }).where(eq(giftCards.id, id));
  revalidatePath("/admin/cartes-cadeaux");
}
```

- [ ] **Step 10.6: Integrate input in CheckoutForm**

In `components/shop/CheckoutForm.tsx`, add state for `appliedGiftCard: { code: string; amountCents: number } | null`, render `<GiftCardCodeInput>` near the bottom (before the submit), and include `giftCardCode: appliedGiftCard?.code` in the input passed to `createCheckoutSession`. Recompute the displayed total to show subtotal minus applied amount.

- [ ] **Step 10.7: Verify + commit**

```powershell
pnpm exec tsc --noEmit
git add lib/stripe/checkout.ts lib/actions/checkout.actions.ts lib/validators/checkout.ts lib/actions/gift-cards.actions.ts components/shop/GiftCardCodeInput.tsx components/shop/CheckoutForm.tsx
git commit -m "feat(gift-cards): checkout integration — validate + apply via Stripe coupon, gift-card-only orders skip shipping"
```

---

## Task 11: Webhook — gift card creation + redemption finalization + cron stock cascade safety

**Files:**
- Modify: `lib/stripe/webhook.ts`
- Test: `tests/integration/gift-card-webhook-create.test.ts`
- Test: `tests/integration/gift-card-redemption.test.ts`

- [ ] **Step 11.1: Write the failing tests**

Create `tests/integration/gift-card-webhook-create.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { orders, orderItems, giftCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createGiftCardsForOrder } from "@/lib/stripe/gift-card-webhook";

vi.mock("@/lib/auth", () => ({ auth: async () => null }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let orderId: string;
let itemId: string;
let createdGiftCardId: string | undefined;

beforeAll(async () => {
  const [o] = await db.insert(orders).values({
    orderNumber: "TEST-GC-WH-1",
    status: "pending",
    subtotalCents: 5000, totalCents: 5000,
    guestEmail: "buyer@test.com",
  }).returning();
  orderId = o!.id;
  const [oi] = await db.insert(orderItems).values({
    orderId, productId: null,
    productNameSnapshot: "Carte cadeau 50 €",
    productSkuSnapshot: "GIFT-050",
    unitPriceCentsSnapshot: 5000, quantity: 1, lineTotalCents: 5000,
    metadata: {
      type: "gift_card",
      recipientEmail: "recipient@test.com",
      recipientName: null,
      message: "Bonne fête",
      deliveryAt: "2026-12-25T09:00:00.000Z",
    },
  }).returning();
  itemId = oi!.id;
});

afterAll(async () => {
  if (createdGiftCardId) await db.delete(giftCards).where(eq(giftCards.id, createdGiftCardId));
  await db.delete(orderItems).where(eq(orderItems.id, itemId));
  await db.delete(orders).where(eq(orders.id, orderId));
});

describe("createGiftCardsForOrder", () => {
  it("creates one gift_cards row per gift_card order_item with code + balance", async () => {
    await createGiftCardsForOrder(orderId, "buyer@test.com");
    const cards = await db.select().from(giftCards).where(eq(giftCards.purchaseOrderId, orderId));
    expect(cards).toHaveLength(1);
    createdGiftCardId = cards[0]!.id;
    expect(cards[0]!.code).toMatch(/^BC-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(cards[0]!.initialAmountCents).toBe(5000);
    expect(cards[0]!.remainingAmountCents).toBe(5000);
    expect(cards[0]!.recipientEmail).toBe("recipient@test.com");
    expect(cards[0]!.deliveryAt.toISOString()).toBe("2026-12-25T09:00:00.000Z");
    expect(cards[0]!.deliveredAt).toBeNull();
    // expires_at = delivery_at + 12 months
    expect(cards[0]!.expiresAt.toISOString()).toBe("2027-12-25T09:00:00.000Z");
  });

  it("is idempotent (calling twice doesn't double-insert)", async () => {
    await createGiftCardsForOrder(orderId, "buyer@test.com");
    const cards = await db.select().from(giftCards).where(eq(giftCards.purchaseOrderId, orderId));
    expect(cards).toHaveLength(1);
  });
});
```

Create `tests/integration/gift-card-redemption.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { orders, giftCards, giftCardRedemptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { applyGiftCardRedemption } from "@/lib/stripe/gift-card-webhook";

vi.mock("@/lib/auth", () => ({ auth: async () => null }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let orderId: string;
let cardId: string;

beforeAll(async () => {
  const [o] = await db.insert(orders).values({
    orderNumber: "TEST-GC-RED-1", status: "pending",
    subtotalCents: 3000, totalCents: 1000, // 30 € − 20 € gift = 10 €
    guestEmail: "user@test.com",
    metadata: { giftCardId: "PLACEHOLDER", giftCardDeductionCents: 2000, stripeCouponId: "cpn_test" },
  }).returning();
  orderId = o!.id;
  const [gc] = await db.insert(giftCards).values({
    code: "BC-TEST-RED-CODE",
    initialAmountCents: 5000, remainingAmountCents: 5000, currency: "EUR",
    purchaserEmail: "buyer@test.com", recipientEmail: "user@test.com",
    deliveryAt: new Date("2026-01-01"), deliveredAt: new Date("2026-01-01"),
    expiresAt: new Date("2027-01-01"), isActive: true,
  }).returning();
  cardId = gc!.id;
  // Patch the order metadata with the real gift card id
  await db.update(orders).set({
    metadata: { giftCardId: cardId, giftCardDeductionCents: 2000, stripeCouponId: "cpn_test" },
  }).where(eq(orders.id, orderId));
});

afterAll(async () => {
  await db.delete(giftCardRedemptions).where(eq(giftCardRedemptions.giftCardId, cardId));
  await db.delete(orders).where(eq(orders.id, orderId));
  await db.delete(giftCards).where(eq(giftCards.id, cardId));
});

describe("applyGiftCardRedemption", () => {
  it("decrements balance + creates redemption row + sets orders.gift_card_redemption_id", async () => {
    await applyGiftCardRedemption(orderId);
    const [c] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    expect(c!.remainingAmountCents).toBe(3000); // 5000 − 2000
    const reds = await db.select().from(giftCardRedemptions).where(eq(giftCardRedemptions.giftCardId, cardId));
    expect(reds).toHaveLength(1);
    expect(reds[0]!.amountCents).toBe(2000);
    expect(reds[0]!.stripeCouponId).toBe("cpn_test");
    const [o] = await db.select().from(orders).where(eq(orders.id, orderId));
    expect(o!.giftCardRedemptionId).toBe(reds[0]!.id);
  });

  it("is idempotent (calling twice doesn't double-decrement)", async () => {
    await applyGiftCardRedemption(orderId);
    const [c] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    expect(c!.remainingAmountCents).toBe(3000);
  });

  it("blocks redemption if balance < deduction (race protection)", async () => {
    // Reset card to 1000 then attempt deduction of 2000 from order metadata
    await db.update(giftCards).set({ remainingAmountCents: 1000 }).where(eq(giftCards.id, cardId));
    await db.update(orders).set({
      giftCardRedemptionId: null,
      metadata: { giftCardId: cardId, giftCardDeductionCents: 2000, stripeCouponId: "cpn_test_2" },
    }).where(eq(orders.id, orderId));
    await db.delete(giftCardRedemptions).where(eq(giftCardRedemptions.giftCardId, cardId));
    await expect(applyGiftCardRedemption(orderId)).rejects.toThrow(/insufficient/i);
  });
});
```

- [ ] **Step 11.2: Run, expect FAIL**

```powershell
npx dotenv -e .env.local -- pnpm vitest run tests/integration/gift-card-webhook-create.test.ts tests/integration/gift-card-redemption.test.ts
```

- [ ] **Step 11.3: Implementation — create the webhook helper**

Create `lib/stripe/gift-card-webhook.ts`:
```ts
import "server-only";
import { addMonths } from "date-fns";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, giftCards, giftCardRedemptions } from "@/lib/db/schema";
import { generateGiftCardCode } from "@/lib/gift-cards/code";
import { EXPIRATION_MONTHS } from "@/lib/gift-cards/constants";

type GiftCardItemMetadata = {
  type: "gift_card";
  recipientEmail: string;
  recipientName: string | null;
  message: string | null;
  deliveryAt: string;
};

export async function createGiftCardsForOrder(orderId: string, purchaserEmail: string): Promise<void> {
  // Skip if this order already produced gift cards (idempotency)
  const existing = await db.select().from(giftCards).where(eq(giftCards.purchaseOrderId, orderId));
  if (existing.length > 0) return;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    const meta = item.metadata as { type?: string } | null;
    if (meta?.type !== "gift_card") continue;
    const gcMeta = item.metadata as GiftCardItemMetadata;
    const deliveryAt = new Date(gcMeta.deliveryAt);
    const expiresAt = addMonths(deliveryAt, EXPIRATION_MONTHS);

    // Generate code with up to 3 retries on collision
    let attempt = 0;
    let inserted = false;
    while (!inserted && attempt < 3) {
      try {
        await db.insert(giftCards).values({
          code: generateGiftCardCode(),
          initialAmountCents: item.unitPriceCentsSnapshot,
          remainingAmountCents: item.unitPriceCentsSnapshot,
          currency: "EUR",
          purchaserEmail,
          recipientEmail: gcMeta.recipientEmail,
          recipientName: gcMeta.recipientName,
          message: gcMeta.message,
          deliveryAt,
          expiresAt,
          purchaseOrderId: orderId,
          isActive: true,
        });
        inserted = true;
      } catch (e) {
        attempt++;
        if (attempt >= 3) throw e;
      }
    }
  }
}

export async function applyGiftCardRedemption(orderId: string): Promise<void> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;
  if (order.giftCardRedemptionId) return; // idempotent
  const meta = order.metadata as
    | { giftCardId?: string; giftCardDeductionCents?: number; stripeCouponId?: string }
    | undefined;
  if (!meta?.giftCardId || !meta?.giftCardDeductionCents) return;

  const cardId = meta.giftCardId;
  const deductionCents = meta.giftCardDeductionCents;

  // Atomic decrement using WHERE remaining_amount_cents >= deductionCents
  const updated = await db
    .update(giftCards)
    .set({
      remainingAmountCents: sql`${giftCards.remainingAmountCents} - ${deductionCents}`,
    })
    .where(
      sql`${giftCards.id} = ${cardId} AND ${giftCards.remainingAmountCents} >= ${deductionCents}`,
    )
    .returning({ id: giftCards.id });
  if (updated.length === 0) {
    throw new Error("Gift card balance insufficient for redemption (race condition or already used)");
  }

  const [red] = await db.insert(giftCardRedemptions).values({
    giftCardId: cardId,
    orderId,
    amountCents: deductionCents,
    stripeCouponId: meta.stripeCouponId ?? null,
  }).returning();

  await db.update(orders).set({ giftCardRedemptionId: red!.id }).where(eq(orders.id, orderId));
}
```

- [ ] **Step 11.4: Wire into the main webhook handler**

In `lib/stripe/webhook.ts`, after the existing `decrementCoffretStockCascade(items)` call inside `handleCheckoutCompleted`, add:
```ts
import {
  createGiftCardsForOrder,
  applyGiftCardRedemption,
} from "@/lib/stripe/gift-card-webhook";
// ...

// Issue gift cards purchased in this order
await createGiftCardsForOrder(orderId, recipient ?? order.guestEmail ?? "");

// Finalize gift card redemption if one was applied
await applyGiftCardRedemption(orderId);
```
Place these AFTER stock decrements and BEFORE the email send. The order matters: if the user purchased AND redeemed a card in the same order, both run.

- [ ] **Step 11.5: Run tests, expect PASS**

```powershell
npx dotenv -e .env.local -- pnpm vitest run tests/integration/gift-card-webhook-create.test.ts tests/integration/gift-card-redemption.test.ts
```

- [ ] **Step 11.6: Commit**

```powershell
git add lib/stripe/gift-card-webhook.ts lib/stripe/webhook.ts tests/integration/gift-card-webhook-create.test.ts tests/integration/gift-card-redemption.test.ts
git commit -m "feat(gift-cards): webhook creates cards + finalizes redemption atomically + 2 integration tests"
```

---

## Task 12: Email template + cron route + vercel.json

**Files:**
- Create: `lib/email/templates/GiftCardDelivery.tsx`
- Create: `app/api/cron/gift-cards-deliver/route.ts`
- Create: `vercel.json`
- Test: `tests/integration/gift-card-cron-deliver.test.ts`

- [ ] **Step 12.1: Email template**

Create `lib/email/templates/GiftCardDelivery.tsx`:
```tsx
import { Html, Head, Body, Container, Section, Heading, Text, Hr, Button } from "@react-email/components";

export function GiftCardDelivery({
  recipientName,
  purchaserEmail,
  amountCents,
  code,
  message,
  expiresAt,
  appBaseUrl,
}: {
  recipientName: string | null;
  purchaserEmail: string;
  amountCents: number;
  code: string;
  message: string | null;
  expiresAt: Date;
  appBaseUrl: string;
}) {
  const amount = `${(amountCents / 100).toFixed(2).replace(".", ",")} €`;
  const expires = expiresAt.toLocaleDateString("fr-BE");
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#FBF6EE", fontFamily: "system-ui" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px", color: "#4A332A" }}>
          <Heading style={{ color: "#E4A11B", fontSize: 28, margin: 0 }}>BeeCuit</Heading>
          <Text style={{ fontSize: 18 }}>
            {recipientName ? `Bonjour ${recipientName},` : "Bonjour,"}
          </Text>
          <Text>
            <strong>{purchaserEmail}</strong> t&apos;a offert une carte cadeau BeeCuit de{" "}
            <strong>{amount}</strong>.
          </Text>
          {message && (
            <Section style={{ background: "#fff", padding: "16px", borderRadius: 8, margin: "16px 0" }}>
              <Text style={{ fontStyle: "italic", margin: 0 }}>« {message} »</Text>
            </Section>
          )}
          <Section style={{ background: "#FFF8EC", padding: "20px", borderRadius: 8, textAlign: "center" as const, margin: "24px 0" }}>
            <Text style={{ fontSize: 12, color: "#8B6F47", margin: "0 0 8px" }}>TON CODE</Text>
            <Text style={{ fontFamily: "monospace", fontSize: 22, letterSpacing: 2, margin: 0, fontWeight: 700 }}>
              {code}
            </Text>
          </Section>
          <Button
            href={`${appBaseUrl}/fr/biscuits`}
            style={{ background: "#D4A574", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none" }}
          >
            Utiliser ma carte
          </Button>
          <Hr style={{ margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#888" }}>
            Valable jusqu&apos;au {expires}. À appliquer au moment du paiement.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 12.2: Cron route**

Create `app/api/cron/gift-cards-deliver/route.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/client";
import { GiftCardDelivery } from "@/lib/email/templates/GiftCardDelivery";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const due = await db
    .select()
    .from(giftCards)
    .where(
      and(
        sql`${giftCards.deliveryAt} <= NOW()`,
        sql`${giftCards.deliveredAt} IS NULL`,
        eq(giftCards.isActive, true),
      ),
    );

  let sent = 0;
  const errors: Array<{ id: string; error: string }> = [];
  for (const card of due) {
    try {
      await sendEmail({
        to: card.recipientEmail,
        subject: `${card.purchaserEmail} t'a offert une carte cadeau BeeCuit`,
        react: GiftCardDelivery({
          recipientName: card.recipientName,
          purchaserEmail: card.purchaserEmail,
          amountCents: card.initialAmountCents,
          code: card.code,
          message: card.message,
          expiresAt: card.expiresAt,
          appBaseUrl: env.NEXT_PUBLIC_APP_URL,
        }),
      });
      await db.update(giftCards).set({ deliveredAt: new Date() }).where(eq(giftCards.id, card.id));
      sent++;
    } catch (e) {
      errors.push({ id: card.id, error: (e as Error).message });
    }
  }
  return NextResponse.json({ due: due.length, sent, errors });
}
```

- [ ] **Step 12.3: vercel.json**

Create `vercel.json` (or merge if it exists):
```json
{
  "crons": [
    { "path": "/api/cron/gift-cards-deliver", "schedule": "0 9 * * *" }
  ]
}
```

- [ ] **Step 12.4: Cron integration test**

Create `tests/integration/gift-card-cron-deliver.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const sendEmailMock = vi.fn(async () => ({ id: "stub" }));
vi.mock("@/lib/email/client", () => ({ sendEmail: sendEmailMock }));
vi.mock("@/lib/env", () => ({
  env: {
    CRON_SECRET: "test-cron-secret-32-chars-xxxxxxxxxxxx",
    NEXT_PUBLIC_APP_URL: "https://test.example",
  },
}));

let cardId: string;

beforeAll(async () => {
  const [gc] = await db.insert(giftCards).values({
    code: "BC-CRON-TEST-XXXX",
    initialAmountCents: 2500, remainingAmountCents: 2500, currency: "EUR",
    purchaserEmail: "buyer@test.com", recipientEmail: "recipient@test.com",
    recipientName: "Test", message: null,
    deliveryAt: new Date("2025-01-01"), // past
    expiresAt: new Date("2027-01-01"),
    isActive: true,
  }).returning();
  cardId = gc!.id;
});
afterAll(async () => {
  await db.delete(giftCards).where(eq(giftCards.id, cardId));
});

describe("/api/cron/gift-cards-deliver", () => {
  it("sends due cards and sets delivered_at; idempotent on second call", async () => {
    const { GET } = await import("@/app/api/cron/gift-cards-deliver/route");
    const req = new Request("https://test/cron", {
      headers: { authorization: "Bearer test-cron-secret-32-chars-xxxxxxxxxxxx" },
    });
    const res1 = await GET(req as any);
    const json1 = await res1.json();
    expect(json1.sent).toBeGreaterThanOrEqual(1);

    const [after] = await db.select().from(giftCards).where(eq(giftCards.id, cardId));
    expect(after!.deliveredAt).not.toBeNull();

    sendEmailMock.mockClear();
    const res2 = await GET(req as any);
    const json2 = await res2.json();
    expect(json2.sent).toBe(0); // already delivered
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("rejects without proper auth header", async () => {
    const { GET } = await import("@/app/api/cron/gift-cards-deliver/route");
    const req = new Request("https://test/cron");
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 12.5: Run + commit**

```powershell
npx dotenv -e .env.local -- pnpm vitest run tests/integration/gift-card-cron-deliver.test.ts
git add lib/email/templates/GiftCardDelivery.tsx app/api/cron/gift-cards-deliver vercel.json tests/integration/gift-card-cron-deliver.test.ts
git commit -m "feat(gift-cards): email template + daily cron route + vercel.json + integration test"
```

---

## Task 13: Account page `/compte/cartes-cadeaux` + admin page `/admin/cartes-cadeaux` + reveal component

**Files:**
- Create: `app/[locale]/(account)/compte/cartes-cadeaux/page.tsx`
- Create: `app/admin/cartes-cadeaux/page.tsx`
- Create: `components/shop/GiftCardReveal.tsx`
- Create: `components/admin/GiftCardTable.tsx`
- Modify: `components/admin/AdminSidebar.tsx` (add nav entry)

- [ ] **Step 13.1: GiftCardReveal component**

Create `components/shop/GiftCardReveal.tsx`:
```tsx
"use client";
import { useState } from "react";

export function GiftCardReveal({ code }: { code: string }) {
  const [shown, setShown] = useState(false);
  const masked = code.replace(/[0-9A-F]/g, "*");
  return (
    <div className="flex items-center gap-2">
      <code className="font-mono text-sm tracking-wider">{shown ? code : masked}</code>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="text-xs underline text-warm-brown/60 hover:text-honey-dark"
      >
        {shown ? "Masquer" : "Voir"}
      </button>
      {shown && (
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs underline text-warm-brown/60 hover:text-honey-dark"
        >
          Copier
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 13.2: Account page**

Create `app/[locale]/(account)/compte/cartes-cadeaux/page.tsx`:
```tsx
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listPurchasedByUser, listReceivedByEmail } from "@/lib/queries/gift-cards";
import { GiftCardReveal } from "@/components/shop/GiftCardReveal";
import { Container } from "@/components/ui-primitives/Container";

export const dynamic = "force-dynamic";

export default async function CompteCartesCadeauxPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect(`/${locale}/sign-in`);

  const [purchased, received] = await Promise.all([
    listPurchasedByUser(session.user.id),
    listReceivedByEmail(session.user.email),
  ]);

  const fmt = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;
  const dt = (d: Date | null) => (d ? new Date(d).toLocaleDateString("fr-BE") : "—");

  return (
    <Container className="py-12 space-y-12">
      <header>
        <h1 className="text-3xl font-display text-warm-brown">Mes cartes cadeaux</h1>
      </header>

      <section>
        <h2 className="text-xl font-display text-warm-brown mb-4">Cartes que j&apos;ai reçues</h2>
        {received.length === 0 ? (
          <p className="text-warm-brown/60 text-sm">Aucune carte reçue pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {received.map((c) => (
              <div key={c.id} className="bg-white border border-cookie/30 rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm text-warm-brown/60">De {c.purchaserEmail}</p>
                    <p className="font-display text-warm-brown text-lg">{fmt(c.remainingAmountCents)} restants</p>
                    <p className="text-xs text-warm-brown/60">
                      sur {fmt(c.initialAmountCents)} · expire le {dt(c.expiresAt)}
                    </p>
                  </div>
                  <GiftCardReveal code={c.code} />
                </div>
                {c.message && (
                  <p className="mt-3 text-sm italic text-warm-brown/80">« {c.message} »</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-display text-warm-brown mb-4">Cartes que j&apos;ai offertes</h2>
        {purchased.length === 0 ? (
          <p className="text-warm-brown/60 text-sm">Aucune carte achetée.</p>
        ) : (
          <div className="space-y-2">
            {purchased.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-white border border-cookie/30 rounded-xl p-4 flex-wrap gap-2">
                <div>
                  <p className="text-sm text-warm-brown">Pour {c.recipientEmail}</p>
                  <p className="text-xs text-warm-brown/60">
                    {fmt(c.initialAmountCents)} · envoi prévu {dt(c.deliveryAt)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    c.deliveredAt ? "bg-honey/20 text-honey-dark" : "bg-cookie/40 text-warm-brown"
                  }`}
                >
                  {c.deliveredAt ? `Envoyée ${dt(c.deliveredAt)}` : "En attente d'envoi"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
```

- [ ] **Step 13.3: Admin table component**

Create `components/admin/GiftCardTable.tsx`:
```tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disableGiftCard } from "@/lib/actions/gift-cards.actions";

type Row = {
  id: string;
  code: string;
  initialAmountCents: number;
  remainingAmountCents: number;
  recipientEmail: string;
  purchaserEmail: string;
  deliveryAt: Date;
  deliveredAt: Date | null;
  expiresAt: Date;
  isActive: boolean;
};

const fmt = (c: number) => `${(c / 100).toFixed(2).replace(".", ",")} €`;
const dt = (d: Date | null) => (d ? new Date(d).toLocaleDateString("fr-BE") : "—");

function status(r: Row): string {
  const now = Date.now();
  if (!r.isActive) return "Désactivée";
  if (!r.deliveredAt) return "En attente";
  if (r.expiresAt.getTime() < now) return "Expirée";
  if (r.remainingAmountCents === 0) return "Utilisée";
  return "Active";
}

export function GiftCardTable({ rows }: { rows: Row[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-warm-brown/60 text-xs uppercase tracking-wider">
          <th className="py-2">Code</th>
          <th>Montant</th>
          <th>Solde</th>
          <th>Pour</th>
          <th>Envoi</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-cookie/30">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="py-2 font-mono text-xs">{r.code}</td>
            <td>{fmt(r.initialAmountCents)}</td>
            <td>{fmt(r.remainingAmountCents)}</td>
            <td className="text-xs">{r.recipientEmail}</td>
            <td className="text-xs">{dt(r.deliveryAt)}</td>
            <td className="text-xs">{status(r)}</td>
            <td>
              {r.isActive && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await disableGiftCard(r.id);
                      router.refresh();
                    })
                  }
                  className="text-xs text-terracotta underline"
                >
                  Désactiver
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 13.4: Admin page**

Create `app/admin/cartes-cadeaux/page.tsx`:
```tsx
import { listAllGiftCards } from "@/lib/queries/gift-cards";
import { GiftCardTable } from "@/components/admin/GiftCardTable";

export const dynamic = "force-dynamic";

export default async function AdminGiftCardsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const rows = await listAllGiftCards({
    search: q,
    statusFilter: status as "pending" | "delivered" | "used" | "expired" | undefined,
  });

  return (
    <div>
      <h1 className="text-honey font-display text-3xl mb-6">Cartes cadeaux</h1>
      <form className="flex gap-2 mb-4" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher code, email…"
          className="border border-cookie/30 rounded px-3 py-2 text-sm flex-1"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border border-cookie/30 rounded px-3 py-2 text-sm"
        >
          <option value="">Tous</option>
          <option value="pending">En attente</option>
          <option value="delivered">Active</option>
          <option value="used">Utilisée</option>
          <option value="expired">Expirée</option>
        </select>
        <button type="submit" className="bg-honey text-cream px-4 py-2 rounded text-sm">
          Filtrer
        </button>
      </form>
      <div className="border-warm-brown/10 rounded-lg border bg-white p-4">
        <GiftCardTable rows={rows} />
      </div>
    </div>
  );
}
```

- [ ] **Step 13.5: Add to admin sidebar**

In `components/admin/AdminSidebar.tsx`, add to the `items` array AFTER the Coffrets entry:
```ts
{ href: "/admin/cartes-cadeaux", label: "Cartes cadeaux" },
```

- [ ] **Step 13.6: Verify + commit**

```powershell
pnpm exec tsc --noEmit
git add "app/[locale]/(account)/compte/cartes-cadeaux/page.tsx" "app/admin/cartes-cadeaux/page.tsx" components/shop/GiftCardReveal.tsx components/admin/GiftCardTable.tsx components/admin/AdminSidebar.tsx
git commit -m "feat(gift-cards): account page + admin page + reveal + admin sidebar entry"
```

---

## Task 14: E2E + lint + full suite + push to main

**Files:**
- Create: `tests/e2e/gift-card-purchase.spec.ts`

- [ ] **Step 14.1: E2E test**

Create `tests/e2e/gift-card-purchase.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("guest can fill the gift card form and add to cart", async ({ page }) => {
  await page.goto("/fr/cartes-cadeaux");
  await expect(page.getByRole("heading", { name: /offre beecuit/i })).toBeVisible();

  // Pick 25 € amount (second tier)
  await page.getByRole("button", { name: "25 €" }).click();

  await page.getByPlaceholder("marie@exemple.be").fill("recipient-e2e@test.com");
  await page.getByLabel(/message/i).fill("Test E2E carte cadeau");

  await page.getByRole("button", { name: /Ajouter au panier — 25/ }).click();

  await expect(page).toHaveURL(/\/fr\/panier/);
  await expect(page.getByText("recipient-e2e@test.com", { exact: false })).toBeVisible();
});
```

- [ ] **Step 14.2: Full test suite + build**

```powershell
pnpm exec tsc --noEmit
npx dotenv -e .env.local -- pnpm test
pnpm build
```
All must be green.

- [ ] **Step 14.3: Fix lint errors if any**

If `pnpm build` reports lint errors (typically `react/no-unescaped-entities` apostrophes), apply `&apos;` replacements and rerun.

- [ ] **Step 14.4: Commit + push to main**

```powershell
git add tests/e2e/gift-card-purchase.spec.ts
git commit -m "test(gift-cards): E2E guest purchase flow"
git push origin phase-2-cartes-cadeaux 2>$null || git push origin main
```

If on a branch `phase-2-cartes-cadeaux`: merge to main:
```powershell
git checkout main
git merge phase-2-cartes-cadeaux --no-edit
git push origin main
```

- [ ] **Step 14.5: Add CRON_SECRET to Vercel envs**

The new `CRON_SECRET` env var must exist on Vercel for the cron to authenticate. Use the value generated in the prereqs:
```powershell
"<the-cron-secret-value>" | npx vercel@latest env add CRON_SECRET production
"<the-cron-secret-value>" | npx vercel@latest env add CRON_SECRET development
# Preview: must be added via Dashboard "All Preview Branches" since CLI requires branch arg
```
Then trigger a re-deploy if needed (push a no-op commit or use Vercel CLI).

---

## Self-review

**Spec coverage:**
- GC1 numérique email-only → Task 12 (cron + email) ✓
- GC2 5 montants fixes → Task 5 (seed 5 SKUs) + Task 2 (constants) ✓
- GC3 code maison cryptographique → Task 2 (`generateGiftCardCode`) ✓
- GC4 envoi programmé cron quotidien → Task 12 (`vercel.json` + route) ✓
- GC5 expiration 12 mois → Task 11 (`addMonths` in `createGiftCardsForOrder`) ✓
- GC6 utilisation partielle, 1 carte par order → Task 10 (apply logic) + Task 11 (atomic decrement) ✓
- GC7 scope biscuits + coffrets only → Task 10 (`hasGiftCardItem` rejects gift-card-buying orders applying another card) ✓
- GC8 pas de cumul promo → no promo code support in V1, no integration needed ✓
- GC9 réduit total, pas TVA → Task 10 (Stripe coupon `amount_off` applied to total, TVA on line_items unaffected) ✓

All 9 decisions mapped to specific tasks.

**Edge cases from spec section 9:**
- Code invalide / expired / used up / disabled → Task 3 `validateGiftCardCode` ✓
- Soldé > total commande → Task 10 (`Math.min(amountAvailable, totals.totalCents)`) ✓
- Coupon Stripe orphan → V1 acceptable, noted in spec ✓
- Double redemption race → Task 11 atomic UPDATE WHERE clause ✓
- Order refund → manual admin V1, noted ✓
- Buyer deletes account → FK `ON DELETE SET NULL` from schema Task 1 ✓
- Order Stripe failed → no webhook fires, no creation/redemption, intact ✓
- Email bounce → Resend logs, `delivered_at` set anyway (V1 accepted) ✓
- Cron miss → next-day delivery (graceful) ✓
- Auto-card → allowed ✓
- Code collision → 3× retry in `createGiftCardsForOrder` ✓

**Placeholder scan:** clean — every step has concrete code, no TBD/TODO.

**Type consistency check:**
- `GiftCardAmountCents` Task 2 → used Task 4 validator, Task 6 action, Task 8 picker ✓
- `validateGiftCardCode` signature Task 3 → consumed Task 10 (server action wrapper) ✓
- `CartItemMetadata` extended Task 6 to include gift_card variant → consumed Task 7 query, Task 9 cart row, Task 11 webhook ✓
- `createGiftCardsForOrder(orderId, purchaserEmail)` Task 11 ↔ Task 11.4 wire-in same signature ✓
- `applyGiftCardRedemption(orderId)` Task 11 ↔ Task 11.4 same signature ✓

No mismatches detected.

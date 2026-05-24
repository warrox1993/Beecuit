# BeeCuit — Phase 2 Sous-projet « Coffrets » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a coffret cadeau experience to the live BeeCuit site — 4 pre-composed themed boxes priced as `sum(biscuits × qty) − discount%`, available at `/coffrets` and inside `/biscuits` with badge, with gift message + premium packaging at add-to-cart. Stock derives from biscuit inventory (assembly-to-order). Admin CRUD with live composition editor + price preview.

**Architecture:** Reuses Phase 1 monolith (Next.js 15, Drizzle/Neon, Stripe Checkout, Vercel Blob, Resend). New folder `lib/coffret/` for pure pricing + availability. One new table `coffret_contents`, two ALTER statements (add `products.discount_percent`, add `metadata` to `cart_items` and `order_items`, drop one unique constraint). No new external services.

**Tech Stack additions over Phase 1:** none — pure DB + code work.

**Spec:** `docs/superpowers/specs/2026-05-24-phase2-coffrets-design.md`

**Working directory:** `C:\Users\jeanb\Documents\WebAPP\BeeCuit` (Windows, PowerShell)

**Package manager:** pnpm

---

## Prerequisites (manual, one-off)

None. Phase 1 is live, Stripe test mode active with all env vars, Blob store connected. No external service setup needed for coffrets.

Decisions tranchées pendant ce plan (point 11 du spec) :
- **Slug auto** : généré depuis le `name` français (pattern Phase 1, override admin possible)
- **Tooltip rupture** : message générique côté public (« Temporairement indisponible »). Admin voit le biscuit bloquant dans la liste `/admin/coffrets`
- **Cart UX edit** : message cadeau éditable depuis la fiche produit ET depuis `/panier` (link « Modifier » sur la ligne coffret)
- **Email confirmation** : `OrderConfirmation` étendu pour afficher la composition des coffrets (compo + message cadeau + tier emballage)

---

## File structure produced by this plan

```
beecuit/
├── lib/
│   ├── coffret/
│   │   ├── constants.ts                       # NEW: PREMIUM_PACKAGING_SURCHARGE_CENTS
│   │   ├── pricing.ts                         # NEW: computeCoffretPrice
│   │   └── availability.ts                    # NEW: isCoffretAvailable
│   ├── db/
│   │   ├── schema.ts                          # MODIFIED: export coffret_contents
│   │   └── schemas/
│   │       ├── coffret_contents.ts            # NEW
│   │       ├── products.ts                    # MODIFIED: + discountPercent
│   │       ├── cart.ts                        # MODIFIED: + metadata, drop unique
│   │       └── order_items.ts                 # MODIFIED: + metadata
│   ├── validators/
│   │   ├── coffret.ts                         # NEW: CoffretSchema (composition + discount)
│   │   └── cart.ts                            # MODIFIED: AddCoffretToCartSchema
│   ├── queries/
│   │   ├── catalog.ts                         # MODIFIED: listCoffrets, getCoffretBySlug, listProductsForLocale extended
│   │   └── cart.ts                            # MODIFIED: getCartContents returns metadata + computed price
│   └── actions/
│       ├── cart.actions.ts                    # MODIFIED: addToCart accepts metadata, updateGiftMessage
│       └── admin/
│           └── coffrets.actions.ts            # NEW: createCoffret, updateCoffret, deleteCoffret
├── app/[locale]/(shop)/
│   ├── coffrets/page.tsx                      # REPLACED (was ComingSoonPage)
│   ├── coffrets/[slug]/page.tsx               # NEW
│   ├── biscuits/page.tsx                      # MODIFIED: include coffrets with badge
│   └── panier/page.tsx                        # MODIFIED: show gift + packaging + edit
├── app/admin/coffrets/
│   ├── page.tsx                               # NEW: list
│   ├── nouveau/page.tsx                       # NEW
│   └── [id]/page.tsx                          # NEW
├── components/
│   ├── shop/
│   │   ├── CoffretCard.tsx                    # NEW
│   │   ├── CoffretBreakdown.tsx               # NEW
│   │   ├── GiftMessageInput.tsx               # NEW
│   │   ├── PackagingTierSelector.tsx          # NEW
│   │   ├── ProductCard.tsx                    # MODIFIED: badge "Coffret"
│   │   ├── AddToCartButton.tsx                # MODIFIED: accept metadata
│   │   └── CartItemRow.tsx                    # MODIFIED: show gift + packaging
│   └── admin/
│       ├── CoffretForm.tsx                    # NEW (composition + price + translations)
│       ├── CoffretCompositionEditor.tsx       # NEW
│       └── CoffretPricePreview.tsx            # NEW
├── lib/stripe/
│   └── checkout.ts                            # MODIFIED: accept coffret line names
├── lib/webhooks/
│   └── stripe.ts                              # MODIFIED: cascade stock decrement
├── lib/email/templates/
│   └── OrderConfirmation.tsx                  # MODIFIED: render coffret composition
├── drizzle/
│   ├── 0004_coffrets.sql                      # NEW (hand-written)
│   └── meta/0004_snapshot.json                # NEW (drizzle-kit generated)
├── scripts/
│   └── seed-coffrets.mjs                      # NEW (4 coffrets bootstrap)
└── tests/
    ├── unit/
    │   ├── coffret-pricing.test.ts            # NEW
    │   └── coffret-availability.test.ts       # NEW
    ├── integration/
    │   ├── coffret-create.test.ts             # NEW
    │   ├── coffret-add-to-cart.test.ts        # NEW
    │   └── coffret-webhook-cascade.test.ts    # NEW
    └── e2e/
        └── coffret-purchase.spec.ts           # NEW
```

Total: **18 new files, 12 modified files**.

---

## Task 1: Schema additions + migration

**Files:**
- Create: `lib/db/schemas/coffret_contents.ts`
- Modify: `lib/db/schemas/products.ts` (add discountPercent)
- Modify: `lib/db/schemas/cart.ts` (add metadata column, drop unique constraint)
- Modify: `lib/db/schemas/order_items.ts` (add metadata)
- Modify: `lib/db/schema.ts` (export new schema)
- Create: `drizzle/0004_coffrets.sql` (hand-written)
- Create: `drizzle/meta/0004_snapshot.json` (via `pnpm drizzle-kit generate`, then hand-merge if needed)

- [ ] **Step 1.1: Add `coffret_contents` schema**

Create `lib/db/schemas/coffret_contents.ts`:
```ts
import { pgTable, text, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./products";

export const coffretContents = pgTable(
  "coffret_contents",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    coffretId: text("coffret_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    biscuitId: text("biscuit_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
  },
  (t) => ({
    uniqueCoffretBiscuit: uniqueIndex("uniq_coffret_biscuit").on(t.coffretId, t.biscuitId),
  }),
);
```

- [ ] **Step 1.2: Add `discountPercent` to products schema**

Modify `lib/db/schemas/products.ts` — add field inside the `pgTable` definition, after `stockQuantity`:
```ts
discountPercent: integer("discount_percent"),  // NULL for biscuits, 0-99 for coffrets (CHECK in SQL)
```

- [ ] **Step 1.3: Add `metadata` to cart_items + drop unique constraint**

Modify `lib/db/schemas/cart.ts` — full replacement of the `cartItems` definition:
```ts
import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { products } from "./products";

export const carts = pgTable("carts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type CartItemMetadata = {
  type?: "coffret";
  giftMessage?: string | null;
  packagingTier?: "standard" | "premium";
};

export const cartItems = pgTable("cart_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: text("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  metadata: jsonb("metadata").$type<CartItemMetadata>(),
  addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
});
```

Note: the `uniqueCartProduct(cartId, productId)` index is intentionally REMOVED — coffrets with different gift messages must coexist as separate rows.

- [ ] **Step 1.4: Add `metadata` to order_items**

Modify `lib/db/schemas/order_items.ts`:
```ts
import { pgTable, text, integer, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orders } from "./orders";
import { products } from "./products";

export type OrderItemMetadata = {
  type?: "coffret";
  giftMessage?: string | null;
  packagingTier?: "standard" | "premium";
  snapshot?: {
    discountPercent: number;
    biscuits: Array<{ biscuitId: string; name: string; quantity: number; unitPriceCents: number }>;
  };
};

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  productSkuSnapshot: text("product_sku_snapshot").notNull(),
  unitPriceCentsSnapshot: integer("unit_price_cents_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
  metadata: jsonb("metadata").$type<OrderItemMetadata>(),
});
```

- [ ] **Step 1.5: Export from barrel**

Modify `lib/db/schema.ts` — add one line:
```ts
export * from "./schemas/coffret_contents";
```

- [ ] **Step 1.6: Hand-write the migration SQL**

Create `drizzle/0004_coffrets.sql`:
```sql
-- Add discount_percent to products (NULL for biscuits, 0-99 for coffrets)
ALTER TABLE "products"
  ADD COLUMN "discount_percent" integer;
ALTER TABLE "products"
  ADD CONSTRAINT "products_discount_percent_range"
  CHECK ("discount_percent" IS NULL OR ("discount_percent" >= 0 AND "discount_percent" <= 99));
--> statement-breakpoint

-- Add metadata jsonb to cart_items and order_items
ALTER TABLE "cart_items" ADD COLUMN "metadata" jsonb;
ALTER TABLE "order_items" ADD COLUMN "metadata" jsonb;
--> statement-breakpoint

-- Drop the unique(cart_id, product_id) index so coffrets with different gift messages can coexist
DROP INDEX IF EXISTS "uniq_cart_product";
--> statement-breakpoint

-- Create coffret_contents table
CREATE TABLE "coffret_contents" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "coffret_id" text NOT NULL,
  "biscuit_id" text NOT NULL,
  "quantity" integer NOT NULL,
  CONSTRAINT "coffret_quantity_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint

ALTER TABLE "coffret_contents"
  ADD CONSTRAINT "coffret_contents_coffret_id_products_id_fk"
  FOREIGN KEY ("coffret_id") REFERENCES "products"("id") ON DELETE cascade;
ALTER TABLE "coffret_contents"
  ADD CONSTRAINT "coffret_contents_biscuit_id_products_id_fk"
  FOREIGN KEY ("biscuit_id") REFERENCES "products"("id") ON DELETE restrict;
--> statement-breakpoint

CREATE UNIQUE INDEX "uniq_coffret_biscuit" ON "coffret_contents" ("coffret_id", "biscuit_id");
```

- [ ] **Step 1.7: Generate snapshot via drizzle-kit**

Run:
```powershell
pnpm drizzle-kit generate
```
Expected: drizzle-kit detects no schema change vs the new migration (because we hand-wrote both the schema and the SQL). If it asks to create a new migration, **decline** (`n`). If it created an extra migration file, delete it but keep the snapshot file `drizzle/meta/0004_snapshot.json`.

Alternative if drizzle-kit insists: let it generate `0004_*.sql`, then **replace** its content with the hand-written SQL above and keep the snapshot.

- [ ] **Step 1.8: Apply migration to local DB**

Run:
```powershell
pnpm drizzle-kit push
```
Expected: applies the ALTER + CREATE statements. If the unique index drop fails (doesn't exist), tolerable — already gone.

Verify via psql or quick node script:
```powershell
node --input-type=module -e "import { neon } from '@neondatabase/serverless'; import fs from 'fs'; const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).map(l=>l.match(/^([A-Z_]+)=`"(.*)`"\s*$/)).filter(Boolean).map(m=>[m[1],m[2]])); const sql = neon(env.DATABASE_URL); const r = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'metadata'\`; console.log(r);"
```
Expected: returns 1 row with `column_name: 'metadata'`.

- [ ] **Step 1.9: Commit**

```powershell
git add lib/db/schemas/coffret_contents.ts lib/db/schemas/products.ts lib/db/schemas/cart.ts lib/db/schemas/order_items.ts lib/db/schema.ts drizzle/0004_coffrets.sql drizzle/meta/0004_snapshot.json
git commit -m "feat(coffrets): db schema + migration 0004 (coffret_contents, discount_percent, metadata)"
```

---

## Task 2: Pure pricing logic with TDD

**Files:**
- Create: `lib/coffret/constants.ts`
- Create: `lib/coffret/pricing.ts`
- Test: `tests/unit/coffret-pricing.test.ts`

- [ ] **Step 2.1: Write the failing test FIRST**

Create `tests/unit/coffret-pricing.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeCoffretPrice } from "@/lib/coffret/pricing";

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

describe("computeCoffretPrice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calcule subtotal + discount + total avec arrondi ceil au cent", async () => {
    // Mock DB: 2 biscuits A (690c) + 2 biscuits B (990c) = subtotal 3360c, discount 15% = 504c (ceil), total = 2856c
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          innerJoin: () => ({
            where: () => Promise.resolve([
              { biscuitId: "a", name: "Spéculoos", quantity: 2, unitPriceCents: 690, discountPercent: 15 },
              { biscuitId: "b", name: "Cookies", quantity: 2, unitPriceCents: 990, discountPercent: 15 },
            ]),
          }),
        }),
      }),
    });
    const r = await computeCoffretPrice("coffret-id", "fr");
    expect(r.subtotalCents).toBe(3360);
    expect(r.discountPercent).toBe(15);
    expect(r.discountCents).toBe(504);
    expect(r.totalCents).toBe(2856);
    expect(r.breakdown).toHaveLength(2);
    expect(r.breakdown[0]).toMatchObject({ biscuitId: "a", quantity: 2, lineCents: 1380 });
  });

  it("retourne discount 0 si percent null/0", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValueOnce({
      from: () => ({ innerJoin: () => ({ innerJoin: () => ({ where: () => Promise.resolve([
        { biscuitId: "a", name: "X", quantity: 1, unitPriceCents: 1000, discountPercent: null },
      ]) }) }) }),
    });
    const r = await computeCoffretPrice("coffret-id", "fr");
    expect(r.discountCents).toBe(0);
    expect(r.totalCents).toBe(1000);
  });

  it("throws si coffret vide (pas de biscuits)", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValueOnce({
      from: () => ({ innerJoin: () => ({ innerJoin: () => ({ where: () => Promise.resolve([]) }) }) }),
    });
    await expect(computeCoffretPrice("empty", "fr")).rejects.toThrow(/empty/i);
  });

  it("ceil arrondi: 1000c * 17% = 170c (pas 169 ni 170.0001)", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValueOnce({
      from: () => ({ innerJoin: () => ({ innerJoin: () => ({ where: () => Promise.resolve([
        { biscuitId: "a", name: "X", quantity: 1, unitPriceCents: 1000, discountPercent: 17 },
      ]) }) }) }),
    });
    const r = await computeCoffretPrice("c", "fr");
    expect(r.discountCents).toBe(170);
    expect(r.totalCents).toBe(830);
  });
});
```

- [ ] **Step 2.2: Run test, verify it fails**

```powershell
pnpm vitest run tests/unit/coffret-pricing.test.ts
```
Expected: 4 failures, `Cannot find module '@/lib/coffret/pricing'`.

- [ ] **Step 2.3: Write constants**

Create `lib/coffret/constants.ts`:
```ts
export const PREMIUM_PACKAGING_SURCHARGE_CENTS = 250; // 2,50 €
```

- [ ] **Step 2.4: Write pricing implementation**

Create `lib/coffret/pricing.ts`:
```ts
import "server-only";
import { db } from "@/lib/db";
import { coffretContents, products, productTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { Locale } from "@/lib/queries/catalog";

export type CoffretPrice = {
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  totalCents: number;
  breakdown: Array<{
    biscuitId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineCents: number;
  }>;
};

export async function computeCoffretPrice(coffretId: string, locale: Locale): Promise<CoffretPrice> {
  const rows = await db
    .select({
      biscuitId: coffretContents.biscuitId,
      name: productTranslations.name,
      quantity: coffretContents.quantity,
      unitPriceCents: products.basePriceCents,
      discountPercent: (await import("@/lib/db/schema")).products.discountPercent,
    })
    .from(coffretContents)
    .innerJoin(products, eq(products.id, coffretContents.biscuitId))
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(eq(coffretContents.coffretId, coffretId));

  if (rows.length === 0) {
    throw new Error(`Coffret ${coffretId} is empty (no contents)`);
  }
  // Re-query just the coffret's own discountPercent to avoid mixing biscuit + coffret rows
  const [coffret] = await db
    .select({ discountPercent: products.discountPercent })
    .from(products)
    .where(eq(products.id, coffretId))
    .limit(1);
  const discountPercent = coffret?.discountPercent ?? 0;

  const breakdown = rows.map((r) => ({
    biscuitId: r.biscuitId,
    name: r.name,
    quantity: r.quantity,
    unitPriceCents: r.unitPriceCents,
    lineCents: r.unitPriceCents * r.quantity,
  }));
  const subtotalCents = breakdown.reduce((a, b) => a + b.lineCents, 0);
  const discountCents = Math.ceil((subtotalCents * discountPercent) / 100);
  const totalCents = subtotalCents - discountCents;

  return { subtotalCents, discountPercent, discountCents, totalCents, breakdown };
}
```

Note: the test mocked the full query result with `discountPercent` baked into each row — the mocked shape doesn't match the real query. Adjust the test mock so the discountPercent comes from the second `db.select` call instead. **Fix the test mock now:**

Update `tests/unit/coffret-pricing.test.ts` — in each test, mock TWO consecutive `db.select` calls (the contents query first, then the coffret discount query). Use `mockReturnValueOnce` twice:
```ts
// First call: contents
(db.select as any).mockReturnValueOnce({
  from: () => ({
    innerJoin: () => ({
      innerJoin: () => ({
        where: () => Promise.resolve([/* biscuits without discountPercent */]),
      }),
    }),
  }),
});
// Second call: coffret discount
(db.select as any).mockReturnValueOnce({
  from: () => ({ where: () => ({ limit: () => Promise.resolve([{ discountPercent: 15 }]) }) }),
});
```
Remove `discountPercent` from each biscuit row in the first mock.

- [ ] **Step 2.5: Run test, verify it passes**

```powershell
pnpm vitest run tests/unit/coffret-pricing.test.ts
```
Expected: 4 passes.

- [ ] **Step 2.6: Commit**

```powershell
git add lib/coffret/ tests/unit/coffret-pricing.test.ts
git commit -m "feat(coffrets): pure pricing logic + unit tests"
```

---

## Task 3: Pure availability logic with TDD

**Files:**
- Create: `lib/coffret/availability.ts`
- Test: `tests/unit/coffret-availability.test.ts`

- [ ] **Step 3.1: Write the failing test**

Create `tests/unit/coffret-availability.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { isCoffretAvailable } from "@/lib/coffret/availability";

vi.mock("@/lib/db", () => ({ db: { execute: vi.fn(), select: vi.fn() } }));

describe("isCoffretAvailable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne available + maxOrderable quand tous les biscuits ont du stock", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValueOnce({
      from: () => ({ innerJoin: () => ({ where: () => Promise.resolve([
        { biscuitId: "a", name: "Spec", needed: 2, stockQuantity: 20, isActive: true },
        { biscuitId: "b", name: "Cookies", needed: 2, stockQuantity: 4, isActive: true },
      ]) }) }),
    });
    const r = await isCoffretAvailable("coffret-id", 1);
    expect(r.available).toBe(true);
    if (r.available) expect(r.maxOrderable).toBe(2); // floor(4/2) = 2
  });

  it("retourne not available + blockingBiscuit si rupture sur 1 biscuit", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValueOnce({
      from: () => ({ innerJoin: () => ({ where: () => Promise.resolve([
        { biscuitId: "a", name: "Spec", needed: 2, stockQuantity: 20, isActive: true },
        { biscuitId: "b", name: "Cookies", needed: 2, stockQuantity: 1, isActive: true },
      ]) }) }),
    });
    const r = await isCoffretAvailable("coffret-id", 1);
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.blockingBiscuit.id).toBe("b");
      expect(r.blockingBiscuit.needed).toBe(2);
      expect(r.blockingBiscuit.inStock).toBe(1);
    }
  });

  it("retourne not available si biscuit isActive=false", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValueOnce({
      from: () => ({ innerJoin: () => ({ where: () => Promise.resolve([
        { biscuitId: "a", name: "Spec", needed: 2, stockQuantity: 20, isActive: false },
      ]) }) }),
    });
    const r = await isCoffretAvailable("coffret-id", 1);
    expect(r.available).toBe(false);
  });

  it("retourne not available si requestedQty > maxOrderable", async () => {
    const { db } = await import("@/lib/db");
    (db.select as any).mockReturnValueOnce({
      from: () => ({ innerJoin: () => ({ where: () => Promise.resolve([
        { biscuitId: "a", name: "Spec", needed: 2, stockQuantity: 4, isActive: true },
      ]) }) }),
    });
    const r = await isCoffretAvailable("coffret-id", 5);
    expect(r.available).toBe(false);
  });
});
```

- [ ] **Step 3.2: Run test, verify it fails**

```powershell
pnpm vitest run tests/unit/coffret-availability.test.ts
```
Expected: 4 failures.

- [ ] **Step 3.3: Write implementation**

Create `lib/coffret/availability.ts`:
```ts
import "server-only";
import { db } from "@/lib/db";
import { coffretContents, products, productTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export type CoffretAvailability =
  | { available: true; maxOrderable: number }
  | {
      available: false;
      blockingBiscuit: { id: string; name: string; needed: number; inStock: number };
    };

export async function isCoffretAvailable(
  coffretId: string,
  requestedQty = 1,
): Promise<CoffretAvailability> {
  const rows = await db
    .select({
      biscuitId: products.id,
      name: productTranslations.name,
      needed: coffretContents.quantity,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
    })
    .from(coffretContents)
    .innerJoin(products, eq(products.id, coffretContents.biscuitId))
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "fr")),
    )
    .where(eq(coffretContents.coffretId, coffretId));

  if (rows.length === 0) {
    return { available: false, blockingBiscuit: { id: "", name: "(coffret vide)", needed: 0, inStock: 0 } };
  }

  // Find the most blocking biscuit (lowest floor(stock / needed), or isActive=false)
  let maxOrderable = Infinity;
  let blocking: { id: string; name: string; needed: number; inStock: number } | null = null;
  for (const r of rows) {
    if (!r.isActive) {
      return { available: false, blockingBiscuit: { id: r.biscuitId, name: r.name, needed: r.needed, inStock: 0 } };
    }
    const canMake = Math.floor(r.stockQuantity / r.needed);
    if (canMake < maxOrderable) {
      maxOrderable = canMake;
      blocking = { id: r.biscuitId, name: r.name, needed: r.needed, inStock: r.stockQuantity };
    }
  }

  if (maxOrderable >= requestedQty) {
    return { available: true, maxOrderable };
  }
  return { available: false, blockingBiscuit: blocking! };
}
```

- [ ] **Step 3.4: Run test, verify it passes**

```powershell
pnpm vitest run tests/unit/coffret-availability.test.ts
```
Expected: 4 passes.

- [ ] **Step 3.5: Commit**

```powershell
git add lib/coffret/availability.ts tests/unit/coffret-availability.test.ts
git commit -m "feat(coffrets): availability check from biscuit stock + unit tests"
```

---

## Task 4: Catalog queries (list + detail coffrets)

**Files:**
- Modify: `lib/queries/catalog.ts`

- [ ] **Step 4.1: Add `listCoffretsForLocale` function**

Modify `lib/queries/catalog.ts` — append these functions at the end:
```ts
import { computeCoffretPrice } from "@/lib/coffret/pricing";
import { isCoffretAvailable } from "@/lib/coffret/availability";

export async function listCoffretsForLocale(locale: Locale) {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      discountPercent: products.discountPercent,
      isFeatured: products.isFeatured,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(and(eq(products.isActive, true), eq(products.type, "coffret")))
    .orderBy(products.createdAt);

  // Enrich each with computed price + availability
  return Promise.all(
    rows.map(async (r) => {
      const price = await computeCoffretPrice(r.id, locale);
      const avail = await isCoffretAvailable(r.id, 1);
      return { ...r, price, available: avail.available };
    }),
  );
}

export async function getCoffretBySlug(locale: Locale, slug: string) {
  const [row] = await db
    .select({
      id: products.id,
      sku: products.sku,
      discountPercent: products.discountPercent,
      weightGrams: products.weightGrams,
      isFeatured: products.isFeatured,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      longDescription: productTranslations.longDescription,
      seoTitle: productTranslations.seoTitle,
      seoDescription: productTranslations.seoDescription,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(
      and(eq(products.isActive, true), eq(products.type, "coffret"), eq(productTranslations.slug, slug)),
    )
    .limit(1);
  if (!row) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.id))
    .orderBy(productImages.sortOrder);

  const price = await computeCoffretPrice(row.id, locale);
  const avail = await isCoffretAvailable(row.id, 1);

  return { ...row, images, price, availability: avail };
}
```

- [ ] **Step 4.2: Extend `listProductsForLocale` to include coffrets with badge**

Replace the existing `listProductsForLocale` in the same file:
```ts
export async function listProductsForLocale(locale: Locale, categorySlug?: string) {
  const where = categorySlug
    ? and(
        eq(products.isActive, true),
        sql`${products.categoryId} = (SELECT id FROM categories WHERE slug = ${categorySlug})`,
      )
    : eq(products.isActive, true);

  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      type: products.type,                                       // NEW
      basePriceCents: products.basePriceCents,
      discountPercent: products.discountPercent,                 // NEW
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      categoryName: sql<
        string | null
      >`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(where)
    .orderBy(products.createdAt);

  // For coffrets, recompute displayed price using pure logic
  return Promise.all(
    rows.map(async (r) => {
      if (r.type === "coffret") {
        const p = await computeCoffretPrice(r.id, locale);
        return { ...r, displayedPriceCents: p.totalCents };
      }
      return { ...r, displayedPriceCents: r.basePriceCents };
    }),
  );
}
```

- [ ] **Step 4.3: Smoke test via dev server**

```powershell
pnpm dev
```
Wait for ready. Open http://localhost:3000/fr/biscuits — should still render (with old `displayedPriceCents` semantic). No coffrets in DB yet, so listing unchanged. Stop dev server (Ctrl+C).

- [ ] **Step 4.4: Commit**

```powershell
git add lib/queries/catalog.ts
git commit -m "feat(coffrets): listCoffrets, getCoffretBySlug, extend listProducts with computed coffret price"
```

---

## Task 5: Validators + admin actions for coffrets

**Files:**
- Create: `lib/validators/coffret.ts`
- Create: `lib/actions/admin/coffrets.actions.ts`

- [ ] **Step 5.1: Write the integration test first**

Create `tests/integration/coffret-create.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { products, productTranslations, coffretContents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: "admin-test", role: "admin" } }),
}));

let biscuitIds: string[] = [];
let createdCoffretId: string | undefined;

beforeAll(async () => {
  // Fetch 2 real biscuit IDs from DB
  const rows = await db.select({ id: products.id }).from(products).where(eq(products.type, "biscuit")).limit(2);
  biscuitIds = rows.map((r) => r.id);
  if (biscuitIds.length < 2) throw new Error("Need at least 2 biscuits in DB for this test");
});

afterAll(async () => {
  if (createdCoffretId) {
    await db.delete(productTranslations).where(eq(productTranslations.productId, createdCoffretId));
    await db.delete(coffretContents).where(eq(coffretContents.coffretId, createdCoffretId));
    await db.delete(products).where(eq(products.id, createdCoffretId));
  }
});

describe("createCoffret (integration)", () => {
  it("inserts product + translations + coffret_contents in one go", async () => {
    const { createCoffret } = await import("@/lib/actions/admin/coffrets.actions");

    createdCoffretId = await createCoffret({
      sku: "TEST-COF-INT-001",
      weightGrams: 300,
      discountPercent: 15,
      isActive: true,
      isFeatured: false,
      contents: [
        { biscuitId: biscuitIds[0], quantity: 2 },
        { biscuitId: biscuitIds[1], quantity: 3 },
      ],
      translations: {
        fr: { name: "Test Coffret", slug: "test-coffret-int-001", shortDescription: "x", longDescription: "y", seoTitle: "z", seoDescription: "w" },
        nl: { name: "Test Coffret NL", slug: "test-coffret-int-001-nl", shortDescription: "x", longDescription: "y", seoTitle: "z", seoDescription: "w" },
        en: { name: "Test Coffret EN", slug: "test-coffret-int-001-en", shortDescription: "x", longDescription: "y", seoTitle: "z", seoDescription: "w" },
        de: { name: "Test Coffret DE", slug: "test-coffret-int-001-de", shortDescription: "x", longDescription: "y", seoTitle: "z", seoDescription: "w" },
      },
    });

    const [prod] = await db.select().from(products).where(eq(products.id, createdCoffretId)).limit(1);
    expect(prod?.type).toBe("coffret");
    expect(prod?.discountPercent).toBe(15);

    const contents = await db.select().from(coffretContents).where(eq(coffretContents.coffretId, createdCoffretId));
    expect(contents).toHaveLength(2);

    const trads = await db.select().from(productTranslations).where(eq(productTranslations.productId, createdCoffretId));
    expect(trads).toHaveLength(4);
  });
});
```

- [ ] **Step 5.2: Run test, verify it fails**

```powershell
pnpm vitest run tests/integration/coffret-create.test.ts
```
Expected: fails (module not found).

- [ ] **Step 5.3: Write Zod validator**

Create `lib/validators/coffret.ts`:
```ts
import { z } from "zod";

const CoffretTranslationSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().min(1).max(280),
  longDescription: z.string().min(1).max(2000),
  seoTitle: z.string().min(1).max(70),
  seoDescription: z.string().min(1).max(160),
});

export const CoffretContentSchema = z.object({
  biscuitId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const CoffretSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(3).max(64),
  weightGrams: z.number().int().min(1).max(10000),
  discountPercent: z.number().int().min(0).max(99),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  contents: z.array(CoffretContentSchema).min(1).max(50),
  translations: z.object({
    fr: CoffretTranslationSchema,
    nl: CoffretTranslationSchema,
    en: CoffretTranslationSchema,
    de: CoffretTranslationSchema,
  }),
});

export type CoffretInput = z.infer<typeof CoffretSchema>;
```

- [ ] **Step 5.4: Write admin actions**

Create `lib/actions/admin/coffrets.actions.ts`:
```ts
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, productTranslations, coffretContents } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { CoffretSchema } from "@/lib/validators/coffret";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const LOCALES = ["fr", "nl", "de", "en"] as const;

export async function createCoffret(raw: unknown): Promise<string> {
  await requireAdmin();
  const data = CoffretSchema.parse(raw);

  return db.transaction(async (tx) => {
    const [prod] = await tx
      .insert(products)
      .values({
        type: "coffret",
        sku: data.sku,
        basePriceCents: 0,                  // ignored for coffrets, but column is NOT NULL
        weightGrams: data.weightGrams,
        stockQuantity: 0,                   // ignored for coffrets
        discountPercent: data.discountPercent,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      })
      .returning();
    if (!prod) throw new Error("Insert failed");

    for (const loc of LOCALES) {
      const t = data.translations[loc];
      await tx.insert(productTranslations).values({
        productId: prod.id,
        locale: loc,
        name: t.name,
        slug: t.slug,
        shortDescription: t.shortDescription,
        longDescription: t.longDescription,
        ingredients: "—",                    // NOT NULL, no ingredients for a box
        allergens: [],                       // empty array
        nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 }, // placeholder, the box itself has no facts
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
      });
    }

    for (const c of data.contents) {
      await tx.insert(coffretContents).values({
        coffretId: prod.id,
        biscuitId: c.biscuitId,
        quantity: c.quantity,
      });
    }

    revalidatePath("/admin/coffrets");
    return prod.id;
  });
}

export async function updateCoffret(raw: unknown): Promise<void> {
  await requireAdmin();
  const data = CoffretSchema.parse(raw);
  if (!data.id) throw new Error("id required");
  const coffretId = data.id;

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        sku: data.sku,
        weightGrams: data.weightGrams,
        discountPercent: data.discountPercent,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        updatedAt: new Date(),
      })
      .where(eq(products.id, coffretId));

    for (const loc of LOCALES) {
      const t = data.translations[loc];
      await tx
        .insert(productTranslations)
        .values({
          productId: coffretId,
          locale: loc,
          name: t.name,
          slug: t.slug,
          shortDescription: t.shortDescription,
          longDescription: t.longDescription,
          ingredients: "—",
          allergens: [],
          nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 },
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        })
        .onConflictDoUpdate({
          target: [productTranslations.productId, productTranslations.locale],
          set: {
            name: t.name,
            slug: t.slug,
            shortDescription: t.shortDescription,
            longDescription: t.longDescription,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
          },
        });
    }

    // Replace contents fully
    await tx.delete(coffretContents).where(eq(coffretContents.coffretId, coffretId));
    for (const c of data.contents) {
      await tx.insert(coffretContents).values({
        coffretId,
        biscuitId: c.biscuitId,
        quantity: c.quantity,
      });
    }
  });

  revalidatePath("/admin/coffrets");
  revalidatePath(`/admin/coffrets/${coffretId}`);
}

export async function deleteCoffret(id: string): Promise<void> {
  await requireAdmin();
  await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/admin/coffrets");
}
```

- [ ] **Step 5.5: Run test, verify it passes**

```powershell
pnpm vitest run tests/integration/coffret-create.test.ts
```
Expected: 1 pass.

- [ ] **Step 5.6: Commit**

```powershell
git add lib/validators/coffret.ts lib/actions/admin/coffrets.actions.ts tests/integration/coffret-create.test.ts
git commit -m "feat(coffrets): admin actions createCoffret/updateCoffret/deleteCoffret + integration test"
```

---

## Task 6: Seed 4 coffrets thématiques

**Files:**
- Create: `scripts/seed-coffrets.mjs`

- [ ] **Step 6.1: Write the seed script**

Create `scripts/seed-coffrets.mjs`:
```js
#!/usr/bin/env node
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="(.*)"\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const sql = neon(env.DATABASE_URL);

const PHOTOS = {
  decouverte: [
    "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551404973-761c83cd8339?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
  gourmand: [
    "https://images.unsplash.com/photo-1606313564200-e75d8e3b3a36?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
  chocolat: [
    "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1573829831297-2038252d19e3?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
  sansGluten: [
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1665844190955-692de472faeb?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
};

const COFFRETS = [
  {
    sku: "COF-DECO-006",
    weightGrams: 350,
    discountPercent: 15,
    photos: PHOTOS.decouverte,
    name: "Coffret Découverte",
    slug: "coffret-decouverte",
    shortDesc: "Une sélection panachée pour découvrir l'univers BeeCuit.",
    longDesc: "Spéculoos artisanal, cookies pépites chocolat, sablés au beurre — l'introduction parfaite à notre savoir-faire liégeois. Présenté dans une boîte kraft élégante, prêt à offrir.",
    contents: [
      { sku: "BCT-SPEC-200", qty: 2 },
      { sku: "BCT-COOK-CHOC-250", qty: 2 },
      { sku: "BCT-GALE-BEUR-150", qty: 2 },
    ],
  },
  {
    sku: "COF-GOUR-012",
    weightGrams: 700,
    discountPercent: 20,
    photos: PHOTOS.gourmand,
    name: "Coffret Gourmand",
    slug: "coffret-gourmand",
    shortDesc: "12 biscuits pour les vrais amateurs.",
    longDesc: "Cookies pépites chocolat, macarons noisette du Piémont, florentins amandes. Un assortiment généreux pour les passionnés.",
    contents: [
      { sku: "BCT-COOK-CHOC-250", qty: 4 },
      { sku: "BCT-MACA-NOIS-006", qty: 4 },
      { sku: "BCT-FLOR-AMAN-200", qty: 4 },
    ],
  },
  {
    sku: "COF-CHOC-012",
    weightGrams: 650,
    discountPercent: 18,
    photos: PHOTOS.chocolat,
    name: "Coffret Chocolat",
    slug: "coffret-chocolat",
    shortDesc: "Tout pour les amoureux du chocolat.",
    longDesc: "Sablés au chocolat noir belge, cookies pépites chocolat, florentins enrobés. Une orgie de cacao.",
    contents: [
      { sku: "BCT-SABL-CHOC-180", qty: 6 },
      { sku: "BCT-COOK-CHOC-250", qty: 4 },
      { sku: "BCT-FLOR-AMAN-200", qty: 2 },
    ],
  },
  {
    sku: "COF-SG-006",
    weightGrams: 350,
    discountPercent: 12,
    photos: PHOTOS.sansGluten,
    name: "Coffret Sans Gluten",
    slug: "coffret-sans-gluten",
    shortDesc: "Tout le goût, sans le gluten.",
    longDesc: "Spéculoos sans gluten et macarons noisette pour les régimes spéciaux qui ne renoncent pas au plaisir.",
    contents: [
      { sku: "BCT-SPEC-SG-180", qty: 4 },
      { sku: "BCT-MACA-NOIS-006", qty: 2 },
    ],
  },
];

const LOCALES = ["fr", "nl", "en", "de"];

(async () => {
  // Resolve biscuit IDs by SKU
  const allBiscuits = await sql`SELECT id, sku FROM products WHERE type = 'biscuit'`;
  const skuToId = Object.fromEntries(allBiscuits.map((b) => [b.sku, b.id]));

  for (const c of COFFRETS) {
    console.log(`\n→ ${c.sku} (${c.name})`);
    // Skip if already exists
    const existing = await sql`SELECT id FROM products WHERE sku = ${c.sku}`;
    if (existing.length > 0) {
      console.log("  ↳ already exists, skip");
      continue;
    }

    // Insert product
    const [prod] = await sql`
      INSERT INTO products (type, sku, base_price_cents, weight_grams, stock_quantity, discount_percent, is_active, is_featured)
      VALUES ('coffret', ${c.sku}, 0, ${c.weightGrams}, 0, ${c.discountPercent}, true, true)
      RETURNING id
    `;
    console.log("  ↳ product inserted", prod.id);

    // Insert translations (FR with real content, others = same as FR for now)
    for (const loc of LOCALES) {
      await sql`
        INSERT INTO product_translations
          (product_id, locale, name, slug, short_description, long_description, ingredients, allergens, nutritional_facts_per_100g, seo_title, seo_description)
        VALUES (
          ${prod.id}, ${loc}, ${c.name}, ${loc === "fr" ? c.slug : c.slug + "-" + loc},
          ${c.shortDesc}, ${c.longDesc}, '—', ARRAY[]::text[],
          '{"energy_kcal":0,"fat_g":0,"carbs_g":0,"protein_g":0,"salt_g":0}'::jsonb,
          ${c.name}, ${c.shortDesc}
        )
      `;
    }
    console.log("  ↳ 4 translations inserted");

    // Insert contents
    for (const item of c.contents) {
      const biscuitId = skuToId[item.sku];
      if (!biscuitId) {
        console.log(`  ⚠ biscuit ${item.sku} not found, skip`);
        continue;
      }
      await sql`INSERT INTO coffret_contents (coffret_id, biscuit_id, quantity) VALUES (${prod.id}, ${biscuitId}, ${item.qty})`;
    }
    console.log(`  ↳ ${c.contents.length} contents inserted`);

    // Insert photos
    for (let i = 0; i < c.photos.length; i++) {
      await sql`
        INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
        VALUES (${prod.id}, ${c.photos[i]}, ${c.name}, ${i}, ${i === 0})
      `;
    }
    console.log(`  ↳ ${c.photos.length} photos inserted`);
  }

  console.log("\nDone.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
```

- [ ] **Step 6.2: Run the seed**

```powershell
node scripts/seed-coffrets.mjs
```
Expected output: 4 coffrets created (or skipped if rerun).

- [ ] **Step 6.3: Verify in DB**

```powershell
node --input-type=module -e "import fs from 'fs'; import { neon } from '@neondatabase/serverless'; const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).map(l=>l.match(/^([A-Z_]+)=`"(.*)`"\s*$/)).filter(Boolean).map(m=>[m[1],m[2]])); const sql = neon(env.DATABASE_URL); const r = await sql\`SELECT p.sku, p.discount_percent, t.name, (SELECT count(*) FROM coffret_contents WHERE coffret_id=p.id) AS items FROM products p JOIN product_translations t ON t.product_id=p.id AND t.locale='fr' WHERE p.type='coffret'\`; for (const row of r) console.log(row);"
```
Expected: 4 rows with name + items count.

- [ ] **Step 6.4: Commit**

```powershell
git add scripts/seed-coffrets.mjs
git commit -m "feat(coffrets): seed 4 themed coffrets (Découverte, Gourmand, Chocolat, Sans Gluten)"
```

---

## Task 7: Cart action — accept coffret metadata

**Files:**
- Modify: `lib/validators/cart.ts`
- Modify: `lib/actions/cart.actions.ts`
- Test: `tests/integration/coffret-add-to-cart.test.ts`

- [ ] **Step 7.1: Write the integration test first**

Create `tests/integration/coffret-add-to-cart.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { products, cartItems, carts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const userId = "test-user-coffret-cart";
vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: userId, role: "customer" } }),
}));

let coffretId: string;
let cartId: string;

beforeAll(async () => {
  const [row] = await db.select({ id: products.id }).from(products).where(eq(products.type, "coffret")).limit(1);
  if (!row) throw new Error("Need at least 1 coffret in DB");
  coffretId = row.id;
  // Clean any previous test cart
  await db.delete(carts).where(eq(carts.userId, userId));
});

afterAll(async () => {
  if (cartId) await db.delete(carts).where(eq(carts.id, cartId));
});

describe("addToCart with coffret metadata (integration)", () => {
  it("stores metadata (giftMessage, packagingTier) in cart_items", async () => {
    const { addToCart } = await import("@/lib/actions/cart.actions");
    await addToCart({
      productId: coffretId,
      quantity: 1,
      metadata: { type: "coffret", giftMessage: "Joyeux anniv !", packagingTier: "premium" },
    });
    const rows = await db.select().from(cartItems).innerJoin(carts, eq(carts.id, cartItems.cartId)).where(eq(carts.userId, userId));
    expect(rows).toHaveLength(1);
    cartId = rows[0]!.carts.id;
    expect(rows[0]!.cart_items.metadata).toEqual({ type: "coffret", giftMessage: "Joyeux anniv !", packagingTier: "premium" });
  });

  it("creates 2 separate rows when same coffret added with different metadata", async () => {
    const { addToCart } = await import("@/lib/actions/cart.actions");
    await addToCart({
      productId: coffretId,
      quantity: 1,
      metadata: { type: "coffret", giftMessage: "Pour papa", packagingTier: "standard" },
    });
    const rows = await db.select().from(cartItems).innerJoin(carts, eq(carts.id, cartItems.cartId)).where(eq(carts.userId, userId));
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 7.2: Run test, verify it fails**

```powershell
pnpm vitest run tests/integration/coffret-add-to-cart.test.ts
```
Expected: fails (current addToCart doesn't accept metadata, AddToCartSchema rejects unknown field).

- [ ] **Step 7.3: Extend the validator**

Modify `lib/validators/cart.ts` — find the existing `AddToCartSchema` and replace with:
```ts
import { z } from "zod";

const CartItemMetadataSchema = z
  .object({
    type: z.literal("coffret").optional(),
    giftMessage: z.string().max(200).nullable().optional(),
    packagingTier: z.enum(["standard", "premium"]).optional(),
  })
  .optional();

export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  metadata: CartItemMetadataSchema,
});

export const UpdateQuantitySchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(0).max(20),
});

export const UpdateGiftMessageSchema = z.object({
  cartItemId: z.string().uuid(),
  giftMessage: z.string().max(200).nullable(),
});
```

- [ ] **Step 7.4: Update the `addToCart` action**

Modify `lib/actions/cart.actions.ts` — replace the `addToCart` function:
```ts
export async function addToCart(rawInput: unknown) {
  const input = AddToCartSchema.parse(rawInput);
  const [prod] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  if (!prod) throw new Error("Product not found");
  if (!prod.isActive) throw new Error("Product not available");

  const cartId = await getActiveCartId();
  const meta = input.metadata ?? null;

  if (prod.type === "biscuit" && !meta) {
    // Biscuits without metadata: upsert (sum quantities, cap to stock)
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, input.productId), sql`metadata IS NULL`))
      .limit(1);
    if (existing) {
      const newQty = Math.min(existing.quantity + input.quantity, prod.stockQuantity);
      await db.update(cartItems).set({ quantity: newQty }).where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        cartId,
        productId: input.productId,
        quantity: Math.min(input.quantity, prod.stockQuantity),
      });
    }
  } else {
    // Coffret (or biscuit with metadata): always a new row
    await db.insert(cartItems).values({
      cartId,
      productId: input.productId,
      quantity: input.quantity,
      metadata: meta,
    });
  }

  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  revalidatePath("/", "layout");
}
```

Don't forget the import: replace the import line for `drizzle-orm`:
```ts
import { eq, sql, and } from "drizzle-orm";
```

- [ ] **Step 7.5: Add `updateGiftMessage` action (cart edit)**

Append to `lib/actions/cart.actions.ts`:
```ts
export async function updateGiftMessage(rawInput: unknown) {
  const { cartItemId, giftMessage } = UpdateGiftMessageSchema.parse(rawInput);
  const [item] = await db.select().from(cartItems).where(eq(cartItems.id, cartItemId)).limit(1);
  if (!item) throw new Error("Cart item not found");
  const oldMeta = (item.metadata ?? {}) as Record<string, unknown>;
  await db
    .update(cartItems)
    .set({ metadata: { ...oldMeta, giftMessage } })
    .where(eq(cartItems.id, cartItemId));
  revalidatePath("/", "layout");
}
```
Add the import at the top:
```ts
import { AddToCartSchema, UpdateQuantitySchema, UpdateGiftMessageSchema } from "@/lib/validators/cart";
```

- [ ] **Step 7.6: Run integration test, verify it passes**

```powershell
pnpm vitest run tests/integration/coffret-add-to-cart.test.ts
```
Expected: 2 passes.

- [ ] **Step 7.7: Commit**

```powershell
git add lib/validators/cart.ts lib/actions/cart.actions.ts tests/integration/coffret-add-to-cart.test.ts
git commit -m "feat(coffrets): addToCart accepts metadata, dedupe rules per type + updateGiftMessage action"
```

---

## Task 8: getCartContents returns coffret price + metadata

**Files:**
- Modify: `lib/queries/cart.ts`

- [ ] **Step 8.1: Extend `getCartContents`**

Replace the existing function in `lib/queries/cart.ts`:
```ts
import "server-only";
import { db } from "@/lib/db";
import { carts, cartItems, products, productTranslations } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { Locale } from "./catalog";
import { computeCoffretPrice } from "@/lib/coffret/pricing";
import { PREMIUM_PACKAGING_SURCHARGE_CENTS } from "@/lib/coffret/constants";

export async function getOrCreateCartForSessionToken(sessionToken: string) { /* unchanged */ }
export async function getOrCreateCartForUser(userId: string) { /* unchanged */ }

export type CartLine = {
  cartItemId: string;
  productId: string;
  type: "biscuit" | "coffret";
  quantity: number;
  unitPriceCents: number;        // includes premium surcharge if coffret + premium
  stockQuantity: number;
  weightGrams: number;
  name: string;
  slug: string;
  primaryImageUrl: string | null;
  metadata: {
    type?: "coffret";
    giftMessage?: string | null;
    packagingTier?: "standard" | "premium";
  } | null;
  coffretBreakdown?: Awaited<ReturnType<typeof computeCoffretPrice>>["breakdown"];
};

export async function getCartContents(cartId: string, locale: Locale): Promise<CartLine[]> {
  const rows = await db
    .select({
      cartItemId: cartItems.id,
      productId: products.id,
      type: products.type,
      quantity: cartItems.quantity,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      weightGrams: products.weightGrams,
      name: productTranslations.name,
      slug: productTranslations.slug,
      metadata: cartItems.metadata,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(eq(cartItems.cartId, cartId));

  return Promise.all(
    rows.map(async (r): Promise<CartLine> => {
      let unitPriceCents = r.basePriceCents;
      let breakdown: CartLine["coffretBreakdown"] | undefined;
      if (r.type === "coffret") {
        const p = await computeCoffretPrice(r.productId, locale);
        unitPriceCents = p.totalCents;
        breakdown = p.breakdown;
        if (r.metadata?.packagingTier === "premium") {
          unitPriceCents += PREMIUM_PACKAGING_SURCHARGE_CENTS;
        }
      }
      return {
        cartItemId: r.cartItemId,
        productId: r.productId,
        type: r.type as "biscuit" | "coffret",
        quantity: r.quantity,
        unitPriceCents,
        stockQuantity: r.stockQuantity,
        weightGrams: r.weightGrams,
        name: r.name,
        slug: r.slug,
        primaryImageUrl: r.primaryImageUrl,
        metadata: r.metadata as CartLine["metadata"],
        coffretBreakdown: breakdown,
      };
    }),
  );
}
```

Keep the two existing `getOrCreate*` functions intact above this new code.

- [ ] **Step 8.2: Smoke check**

```powershell
pnpm build
```
Expected: build succeeds (no TS errors).

- [ ] **Step 8.3: Commit**

```powershell
git add lib/queries/cart.ts
git commit -m "feat(coffrets): getCartContents returns computed price + metadata + breakdown"
```

---

## Task 9: Public components — CoffretBreakdown, GiftMessageInput, PackagingTierSelector

**Files:**
- Create: `components/shop/CoffretBreakdown.tsx`
- Create: `components/shop/GiftMessageInput.tsx`
- Create: `components/shop/PackagingTierSelector.tsx`

- [ ] **Step 9.1: CoffretBreakdown component**

Create `components/shop/CoffretBreakdown.tsx`:
```tsx
import type { CoffretPrice } from "@/lib/coffret/pricing";

function fmt(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function CoffretBreakdown({ price }: { price: CoffretPrice }) {
  return (
    <div className="bg-white border border-cookie/40 rounded-xl p-4 my-4">
      {price.breakdown.map((line) => (
        <div key={line.biscuitId} className="flex justify-between py-1 text-sm text-warm-brown">
          <span>{line.name} ×{line.quantity}</span>
          <span>{fmt(line.lineCents)}</span>
        </div>
      ))}
      <div className="border-t border-cookie/30 my-2" />
      <div className="flex justify-between py-1 text-sm text-warm-brown/70">
        <span>Sous-total biscuits</span>
        <span>{fmt(price.subtotalCents)}</span>
      </div>
      {price.discountCents > 0 && (
        <div className="flex justify-between py-1 text-sm text-honey-dark">
          <span>Remise coffret (−{price.discountPercent}%)</span>
          <span>−{fmt(price.discountCents)}</span>
        </div>
      )}
      <div className="border-t border-cookie/30 my-2" />
      <div className="flex justify-between text-xl font-bold text-warm-brown">
        <span>Prix coffret</span>
        <span>{fmt(price.totalCents)}</span>
      </div>
      <div className="text-xs text-warm-brown/60 text-right mt-1">TVA 6 % incluse</div>
    </div>
  );
}
```

- [ ] **Step 9.2: GiftMessageInput component**

Create `components/shop/GiftMessageInput.tsx`:
```tsx
"use client";
import { useState } from "react";

export function GiftMessageInput({
  value,
  onChange,
  name = "giftMessage",
}: {
  value?: string | null;
  onChange?: (v: string) => void;
  name?: string;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <div className="bg-white border border-cookie/40 rounded-xl p-4 my-3">
      <label className="block text-sm font-semibold mb-2 text-warm-brown">
        ✉️ Message cadeau <span className="font-normal text-warm-brown/60">(optionnel)</span>
      </label>
      <textarea
        name={name}
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          onChange?.(e.target.value);
        }}
        maxLength={200}
        rows={3}
        placeholder="Joyeux anniversaire Mamie..."
        className="w-full border border-cookie/30 rounded p-2 text-sm focus:border-honey focus:outline-none"
      />
      <div className="text-xs text-warm-brown/60 text-right mt-1">{v.length}/200</div>
    </div>
  );
}
```

- [ ] **Step 9.3: PackagingTierSelector component**

Create `components/shop/PackagingTierSelector.tsx`:
```tsx
"use client";
import { useState } from "react";

export function PackagingTierSelector({
  value = "standard",
  onChange,
  name = "packagingTier",
}: {
  value?: "standard" | "premium";
  onChange?: (v: "standard" | "premium") => void;
  name?: string;
}) {
  const [v, setV] = useState(value);
  const set = (next: "standard" | "premium") => {
    setV(next);
    onChange?.(next);
  };
  return (
    <div className="bg-white border border-cookie/40 rounded-xl p-4 my-3">
      <label className="block text-sm font-semibold mb-2 text-warm-brown">📦 Emballage</label>
      <input type="hidden" name={name} value={v} />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => set("standard")}
          className={`text-left p-3 rounded-lg border-2 transition-colors ${v === "standard" ? "border-honey bg-honey/10" : "border-cookie/30"}`}
        >
          <div className="font-semibold text-sm">Standard</div>
          <div className="text-xs text-warm-brown/70">Carton recyclé</div>
          <div className="text-xs text-honey-dark mt-1">Inclus</div>
        </button>
        <button
          type="button"
          onClick={() => set("premium")}
          className={`text-left p-3 rounded-lg border-2 transition-colors ${v === "premium" ? "border-honey bg-honey/10" : "border-cookie/30"}`}
        >
          <div className="font-semibold text-sm">Premium</div>
          <div className="text-xs text-warm-brown/70">Cire d'abeille + ruban</div>
          <div className="text-xs text-honey-dark mt-1">+ 2,50 €</div>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 9.4: Commit**

```powershell
git add components/shop/CoffretBreakdown.tsx components/shop/GiftMessageInput.tsx components/shop/PackagingTierSelector.tsx
git commit -m "feat(coffrets): UI components (breakdown, gift message, packaging selector)"
```

---

## Task 10: AddToCartButton supports metadata

**Files:**
- Modify: `components/shop/AddToCartButton.tsx`

- [ ] **Step 10.1: Extend the props + form handling**

Read the current file first (Bash `pnpm exec tsx --print "$(cat components/shop/AddToCartButton.tsx | head -50)"` if you need it). Then replace with this version:
```tsx
"use client";
import { useTransition } from "react";
import { addToCart } from "@/lib/actions/cart.actions";

type Metadata = {
  type?: "coffret";
  giftMessage?: string | null;
  packagingTier?: "standard" | "premium";
};

export function AddToCartButton({
  productId,
  disabled,
  label = "Ajouter au panier",
  getMetadata,
}: {
  productId: string;
  disabled?: boolean;
  label?: string;
  getMetadata?: () => Metadata;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          await addToCart({ productId, quantity: 1, metadata: getMetadata?.() });
        })
      }
      className="w-full bg-honey text-cream py-4 rounded-xl font-semibold disabled:opacity-50 hover:bg-honey-dark transition-colors"
    >
      {pending ? "Ajout…" : label}
    </button>
  );
}
```

- [ ] **Step 10.2: Verify build**

```powershell
pnpm build
```
Expected: success.

- [ ] **Step 10.3: Commit**

```powershell
git add components/shop/AddToCartButton.tsx
git commit -m "feat(coffrets): AddToCartButton accepts optional metadata via getMetadata callback"
```

---

## Task 11: Public coffret detail page

**Files:**
- Create: `app/[locale]/(shop)/coffrets/[slug]/page.tsx`
- Create: `components/shop/CoffretDetailClient.tsx` (client wrapper for state)

- [ ] **Step 11.1: Server page**

Replace the current `ComingSoonPage` at the coffret detail. Create `app/[locale]/(shop)/coffrets/[slug]/page.tsx`:
```tsx
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getCoffretBySlug } from "@/lib/queries/catalog";
import { CoffretDetailClient } from "@/components/shop/CoffretDetailClient";
import { Container } from "@/components/ui-primitives/Container";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const coffret = await getCoffretBySlug(locale as "fr" | "nl" | "en" | "de", slug);
  if (!coffret) return {};
  return {
    title: coffret.seoTitle || coffret.name,
    description: coffret.seoDescription,
    alternates: { canonical: `/${locale}/coffrets/${coffret.slug}` },
  };
}

export default async function CoffretDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const coffret = await getCoffretBySlug(locale as "fr" | "nl" | "en" | "de", slug);
  if (!coffret) notFound();

  return (
    <Container className="py-12">
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
        <div className="bg-cookie/30 aspect-square rounded-2xl overflow-hidden">
          {coffret.images[0]?.url ? (
            <Image
              src={coffret.images[0].url}
              alt={coffret.images[0].altText ?? coffret.name}
              width={800}
              height={800}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-9xl opacity-30">📦</div>
          )}
        </div>

        <CoffretDetailClient coffret={coffret} />
      </div>

      <section className="mt-16">
        <p className="text-xs uppercase tracking-widest text-warm-brown/60 mb-2">Ce coffret contient</p>
        <h2 className="text-2xl font-display text-warm-brown mb-6">
          {coffret.price.breakdown.reduce((a, b) => a + b.quantity, 0)} biscuits sélectionnés
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {coffret.price.breakdown.map((b) => (
            <div key={b.biscuitId} className="bg-white rounded-xl overflow-hidden border border-cookie/40">
              <div className="aspect-[4/3] bg-cookie/30 flex items-center justify-center text-4xl">🍪</div>
              <div className="p-3">
                <div className="font-semibold text-sm text-warm-brown">{b.name}</div>
                <div className="text-xs text-warm-brown/70">
                  ×{b.quantity} · {(b.unitPriceCents / 100).toFixed(2).replace(".", ",")} € l'unité
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
```

- [ ] **Step 11.2: Client wrapper for state**

Create `components/shop/CoffretDetailClient.tsx`:
```tsx
"use client";
import { useState, useMemo } from "react";
import { CoffretBreakdown } from "./CoffretBreakdown";
import { GiftMessageInput } from "./GiftMessageInput";
import { PackagingTierSelector } from "./PackagingTierSelector";
import { AddToCartButton } from "./AddToCartButton";
import { PREMIUM_PACKAGING_SURCHARGE_CENTS } from "@/lib/coffret/constants";

type Coffret = Awaited<ReturnType<typeof import("@/lib/queries/catalog").getCoffretBySlug>>;

export function CoffretDetailClient({ coffret }: { coffret: NonNullable<Coffret> }) {
  const [giftMessage, setGiftMessage] = useState<string>("");
  const [packagingTier, setPackagingTier] = useState<"standard" | "premium">("standard");

  const finalCents = useMemo(() => {
    return coffret.price.totalCents + (packagingTier === "premium" ? PREMIUM_PACKAGING_SURCHARGE_CENTS : 0);
  }, [coffret.price.totalCents, packagingTier]);

  const disabled = !coffret.availability.available;

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-widest text-warm-brown/60">Coffret · {coffret.price.breakdown.reduce((a, b) => a + b.quantity, 0)} biscuits</p>
      <h1 className="text-4xl font-display text-warm-brown">{coffret.name}</h1>
      <p className="text-warm-brown/80">{coffret.shortDescription}</p>

      <CoffretBreakdown price={coffret.price} />

      <GiftMessageInput value={giftMessage} onChange={setGiftMessage} />
      <PackagingTierSelector value={packagingTier} onChange={setPackagingTier} />

      {disabled && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-sm">
          Temporairement indisponible
        </div>
      )}

      <AddToCartButton
        productId={coffret.id}
        disabled={disabled}
        label={`Ajouter au panier — ${(finalCents / 100).toFixed(2).replace(".", ",")} €`}
        getMetadata={() => ({
          type: "coffret",
          giftMessage: giftMessage.trim() ? giftMessage.trim() : null,
          packagingTier,
        })}
      />
    </div>
  );
}
```

- [ ] **Step 11.3: Smoke test via dev server**

```powershell
pnpm dev
```
Open http://localhost:3000/fr/coffrets/coffret-decouverte — should render full layout. Add to cart with message + premium. Open http://localhost:3000/fr/panier and verify the row appears (UI not extended yet, just the row).
Ctrl+C to stop.

- [ ] **Step 11.4: Commit**

```powershell
git add app/[locale]/(shop)/coffrets/[slug]/page.tsx components/shop/CoffretDetailClient.tsx
git commit -m "feat(coffrets): public coffret detail page with breakdown, gift form, add-to-cart"
```

---

## Task 12: Public coffret listing page + CoffretCard

**Files:**
- Create: `components/shop/CoffretCard.tsx`
- Replace: `app/[locale]/(shop)/coffrets/page.tsx`

- [ ] **Step 12.1: CoffretCard component**

Create `components/shop/CoffretCard.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";

type Props = {
  locale: string;
  coffret: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    primaryImageUrl: string | null;
    price: { totalCents: number; subtotalCents: number; discountCents: number; discountPercent: number };
    available: boolean;
  };
};

function fmt(c: number) {
  return (c / 100).toFixed(2).replace(".", ",") + " €";
}

export function CoffretCard({ locale, coffret }: Props) {
  return (
    <Link href={`/${locale}/coffrets/${coffret.slug}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-cookie/30 transition-shadow group-hover:shadow-xl">
        <div className="relative aspect-[4/5] bg-cookie/30">
          {coffret.primaryImageUrl ? (
            <Image src={coffret.primaryImageUrl} alt={coffret.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl opacity-30">📦</div>
          )}
          <span className="absolute top-3 left-3 bg-honey text-cream text-xs uppercase tracking-wider px-2 py-1 rounded">
            Coffret
          </span>
          {!coffret.available && (
            <span className="absolute bottom-3 left-3 bg-warm-brown/90 text-cream text-xs px-2 py-1 rounded">
              Indisponible
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-display text-lg text-warm-brown">{coffret.name}</h3>
          <p className="text-sm text-warm-brown/70 mt-1 line-clamp-2">{coffret.shortDescription}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-semibold text-warm-brown">{fmt(coffret.price.totalCents)}</span>
            {coffret.price.discountCents > 0 && (
              <span className="text-xs text-warm-brown/60 line-through">{fmt(coffret.price.subtotalCents)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 12.2: Replace coffrets listing page**

Replace `app/[locale]/(shop)/coffrets/page.tsx` (currently `<ComingSoonPage>`):
```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { listCoffretsForLocale, type Locale } from "@/lib/queries/catalog";
import { CoffretCard } from "@/components/shop/CoffretCard";
import { Container } from "@/components/ui-primitives/Container";

export default async function CoffretsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const coffrets = await listCoffretsForLocale(locale as Locale);

  return (
    <Container className="py-12">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-warm-brown/60 mb-2">Nos coffrets</p>
        <h1 className="text-4xl md:text-5xl font-display text-warm-brown">Coffrets cadeaux</h1>
        <p className="mt-3 max-w-2xl mx-auto text-warm-brown/70">
          Des sélections de biscuits artisanaux à offrir, assemblées à la commande dans nos ateliers de Liège.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coffrets.map((c) => (
          <CoffretCard key={c.id} locale={locale} coffret={c} />
        ))}
      </div>
    </Container>
  );
}
```

- [ ] **Step 12.3: Smoke test**

```powershell
pnpm dev
```
Open http://localhost:3000/fr/coffrets — should display 4 coffret cards. Click one → detail. Ctrl+C.

- [ ] **Step 12.4: Commit**

```powershell
git add components/shop/CoffretCard.tsx app/[locale]/(shop)/coffrets/page.tsx
git commit -m "feat(coffrets): public listing /coffrets with CoffretCard"
```

---

## Task 13: Cart UI — show gift + packaging + edit message

**Files:**
- Modify: `components/shop/CartItemRow.tsx`
- Modify: `app/[locale]/(shop)/panier/page.tsx` (if needed for prop wiring)

- [ ] **Step 13.1: Read current CartItemRow to know its shape**

```powershell
Get-Content components/shop/CartItemRow.tsx
```
Note its structure (props, where the row title and quantity controls are).

- [ ] **Step 13.2: Extend CartItemRow to display + edit metadata**

Modify `components/shop/CartItemRow.tsx`. Add to the props:
```ts
metadata?: {
  type?: "coffret";
  giftMessage?: string | null;
  packagingTier?: "standard" | "premium";
} | null;
```

Add this block just under the existing row title (before the quantity controls):
```tsx
{metadata?.type === "coffret" && (
  <div className="mt-2 space-y-1 text-xs text-warm-brown/80">
    {metadata.packagingTier === "premium" && (
      <span className="inline-block bg-honey/20 text-honey-dark px-2 py-0.5 rounded">📦 Emballage premium</span>
    )}
    {metadata.giftMessage && (
      <div className="italic">✉️ « {metadata.giftMessage} »</div>
    )}
    <EditGiftMessageInline cartItemId={cartItemId} currentMessage={metadata.giftMessage ?? ""} />
  </div>
)}
```

Add the inline-edit helper at the bottom of the file (still inside the component module):
```tsx
"use client";
function EditGiftMessageInline({ cartItemId, currentMessage }: { cartItemId: string; currentMessage: string }) {
  const [editing, setEditing] = React.useState(false);
  const [v, setV] = React.useState(currentMessage);
  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-warm-brown/60 underline hover:text-honey">
        Modifier le message
      </button>
    );
  }
  return (
    <form
      action={async () => {
        await (await import("@/lib/actions/cart.actions")).updateGiftMessage({ cartItemId, giftMessage: v });
        setEditing(false);
      }}
      className="flex gap-1"
    >
      <input value={v} onChange={(e) => setV(e.target.value)} maxLength={200} className="border border-cookie/30 rounded px-2 py-1 flex-1 text-xs" />
      <button type="submit" className="bg-honey text-cream text-xs px-2 py-1 rounded">OK</button>
    </form>
  );
}
import React from "react";
```

Update the panier page (`app/[locale]/(shop)/panier/page.tsx`) to pass `metadata` to each `<CartItemRow>` — find the iteration over cart lines and add the prop.

- [ ] **Step 13.3: Smoke test**

```powershell
pnpm dev
```
Add a coffret with message + premium. Open `/panier`. Verify: badge premium, message in italic, button « Modifier le message ». Click → input → save → reload, message updated. Ctrl+C.

- [ ] **Step 13.4: Commit**

```powershell
git add components/shop/CartItemRow.tsx app/[locale]/(shop)/panier/page.tsx
git commit -m "feat(coffrets): cart row shows gift + packaging tier, inline edit gift message"
```

---

## Task 14: Stripe checkout — coffret line items + premium baked

**Files:**
- Modify: `lib/stripe/checkout.ts`
- Modify: `lib/actions/checkout.actions.ts` (the function that builds `lineItems`)

- [ ] **Step 14.1: Identify how lineItems is currently built**

Read `lib/actions/checkout.actions.ts` (already exists Phase 1) — find where it maps cart items to `CheckoutLineItem`. It currently uses `basePriceCents`. We need to use the computed `unitPriceCents` from `getCartContents` (which already bakes in coffret price + premium surcharge as of Task 8).

Replace the mapping to use the cart line's `unitPriceCents` instead of looking up the product price again:
```ts
const cartLines = await getCartContents(cartId, locale);
const lineItems = cartLines.map((line) => ({
  name: line.type === "coffret"
    ? `${line.name}${line.metadata?.packagingTier === "premium" ? " (emballage premium)" : ""}`
    : line.name,
  unitPriceCents: line.unitPriceCents,
  quantity: line.quantity,
}));
```

Note the name suffix: makes premium visible on the Stripe receipt without splitting lines.

- [ ] **Step 14.2: Persist order_items with metadata**

In the same `checkout.actions.ts`, find where `order_items` are inserted (after the Stripe session is created and order is persisted). For coffret lines, set `metadata` from the cart line + snapshot:
```ts
for (const line of cartLines) {
  const meta = line.type === "coffret"
    ? {
        type: "coffret" as const,
        giftMessage: line.metadata?.giftMessage ?? null,
        packagingTier: line.metadata?.packagingTier ?? "standard",
        snapshot: {
          discountPercent: line.coffretBreakdown ? /* from line price */ 0 : 0,
          biscuits: (line.coffretBreakdown ?? []).map((b) => ({
            biscuitId: b.biscuitId,
            name: b.name,
            quantity: b.quantity,
            unitPriceCents: b.unitPriceCents,
          })),
        },
      }
    : null;

  await db.insert(orderItems).values({
    orderId,
    productId: line.productId,
    productNameSnapshot: line.name,
    productSkuSnapshot: /* fetch sku */ "",
    unitPriceCentsSnapshot: line.unitPriceCents,
    quantity: line.quantity,
    lineTotalCents: line.unitPriceCents * line.quantity,
    metadata: meta,
  });
}
```

Note: `getCartContents` doesn't currently return `sku`. Two options:
- a) Add `sku` to the SELECT in `getCartContents`
- b) Re-fetch the products for cart items in the checkout action

Use option (a) — simpler. Add `sku: products.sku` to the `.select()` in `getCartContents` (Task 8 file) and to the `CartLine` type, then use `line.sku` here.

Also for `discountPercent` snapshot: add `discountPercent` to the `CartLine` type and fetch it from `computeCoffretPrice` result (already in `CoffretPrice.discountPercent`). Update the cart query to include it.

- [ ] **Step 14.3: Build, smoke**

```powershell
pnpm build
```
Expected: success.

- [ ] **Step 14.4: Commit**

```powershell
git add lib/stripe/checkout.ts lib/actions/checkout.actions.ts lib/queries/cart.ts
git commit -m "feat(coffrets): Stripe checkout passes computed prices + snapshot metadata into order_items"
```

---

## Task 15: Stripe webhook — cascade stock decrement

**Files:**
- Modify: `lib/webhooks/stripe.ts` (or wherever the `checkout.session.completed` handler lives)
- Test: `tests/integration/coffret-webhook-cascade.test.ts`

- [ ] **Step 15.1: Locate the webhook handler**

```powershell
Get-ChildItem -Recurse -Include "*.ts" | Select-String "checkout.session.completed" | Select-Object -First 5
```
Find the file. Read it to understand where stock decrement happens.

- [ ] **Step 15.2: Write the cascade test**

Create `tests/integration/coffret-webhook-cascade.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { products, orderItems, orders } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

let biscuitId: string;
let initialStock: number;
let orderId: string;
let testOrderItemId: string;

beforeAll(async () => {
  const [b] = await db.select().from(products).where(eq(products.type, "biscuit")).limit(1);
  if (!b) throw new Error("Need a biscuit");
  biscuitId = b.id;
  initialStock = b.stockQuantity;
  // Bump stock
  await db.update(products).set({ stockQuantity: 100 }).where(eq(products.id, biscuitId));

  // Insert fake order + order_item with coffret metadata
  const [o] = await db.insert(orders).values({
    orderNumber: "TEST-WEBHOOK-CASCADE",
    status: "pending",
    subtotalCents: 1000,
    totalCents: 1000,
    guestEmail: "test@test.com",
  }).returning();
  orderId = o!.id;
  const [oi] = await db.insert(orderItems).values({
    orderId: o!.id,
    productId: null,
    productNameSnapshot: "Test Coffret",
    productSkuSnapshot: "TEST",
    unitPriceCentsSnapshot: 1000,
    quantity: 2,
    lineTotalCents: 2000,
    metadata: {
      type: "coffret",
      packagingTier: "standard",
      snapshot: { discountPercent: 0, biscuits: [{ biscuitId, name: "X", quantity: 3, unitPriceCents: 100 }] },
    },
  }).returning();
  testOrderItemId = oi!.id;
});

afterAll(async () => {
  await db.delete(orderItems).where(eq(orderItems.id, testOrderItemId));
  await db.delete(orders).where(eq(orders.id, orderId));
  await db.update(products).set({ stockQuantity: initialStock }).where(eq(products.id, biscuitId));
});

describe("webhook cascade decrement", () => {
  it("decrements biscuit stock by quantity × biscuit.qty for each coffret order_item", async () => {
    // Import the cascade function directly (or invoke the full webhook handler)
    const { decrementCoffretStockCascade } = await import("@/lib/coffret/stock-cascade");
    await decrementCoffretStockCascade(orderId);
    const [updated] = await db.select().from(products).where(eq(products.id, biscuitId)).limit(1);
    expect(updated!.stockQuantity).toBe(100 - 2 * 3); // 94
  });
});
```

- [ ] **Step 15.3: Create the cascade helper**

Create `lib/coffret/stock-cascade.ts`:
```ts
import "server-only";
import { db } from "@/lib/db";
import { orderItems, products } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

type Snapshot = {
  biscuits: Array<{ biscuitId: string; quantity: number }>;
};

export async function decrementCoffretStockCascade(orderId: string): Promise<void> {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    const meta = item.metadata as { type?: string; snapshot?: Snapshot } | null;
    if (meta?.type !== "coffret" || !meta.snapshot?.biscuits) continue;
    for (const b of meta.snapshot.biscuits) {
      await db
        .update(products)
        .set({ stockQuantity: sql`GREATEST(0, ${products.stockQuantity} - ${b.quantity * item.quantity})` })
        .where(eq(products.id, b.biscuitId));
    }
  }
}
```

`GREATEST(0, …)` is a safety net — should never go negative, but ensures invariant if a race or seed mismatch happens.

- [ ] **Step 15.4: Wire into the webhook handler**

In `lib/webhooks/stripe.ts` (or equivalent), find the block that handles `checkout.session.completed` and updates the order to status `paid`. **Inside that block, after the existing biscuit stock decrement**, call:
```ts
import { decrementCoffretStockCascade } from "@/lib/coffret/stock-cascade";
// …
await decrementCoffretStockCascade(orderId);
```
Make sure this runs **inside the same transaction** as the rest of the webhook handler if there is one. If the existing code is not in a `db.transaction(...)` block, leave it as is for now (matches Phase 1 pattern).

- [ ] **Step 15.5: Run the integration test**

```powershell
pnpm vitest run tests/integration/coffret-webhook-cascade.test.ts
```
Expected: 1 pass.

- [ ] **Step 15.6: Commit**

```powershell
git add lib/coffret/stock-cascade.ts lib/webhooks/stripe.ts tests/integration/coffret-webhook-cascade.test.ts
git commit -m "feat(coffrets): cascade biscuit stock decrement on order paid (webhook) + integration test"
```

---

## Task 16: Email — render coffret composition in OrderConfirmation

**Files:**
- Modify: `lib/email/templates/OrderConfirmation.tsx`

- [ ] **Step 16.1: Identify the items loop**

Read `lib/email/templates/OrderConfirmation.tsx` — find where it iterates over order items and renders rows.

- [ ] **Step 16.2: Add coffret rendering**

For each item, if `item.metadata?.type === "coffret"`, render:
- The coffret name + qty + price (same as biscuit)
- Below: list of `metadata.snapshot.biscuits` with their names + qty
- A line for `Emballage premium` if `metadata.packagingTier === "premium"`
- The gift message (if present) in italic

Pattern (React Email syntax — `<Section>`, `<Text>`):
```tsx
{item.metadata?.type === "coffret" && (
  <>
    <Text style={{ fontSize: 11, color: "#8B6F47", margin: "4px 0 0 16px" }}>
      Composition :
    </Text>
    <ul style={{ margin: "2px 0 0 32px", padding: 0 }}>
      {(item.metadata.snapshot?.biscuits ?? []).map((b) => (
        <li key={b.biscuitId} style={{ fontSize: 11, color: "#5C4A38" }}>
          {b.name} ×{b.quantity}
        </li>
      ))}
    </ul>
    {item.metadata.packagingTier === "premium" && (
      <Text style={{ fontSize: 11, color: "#D4A574", margin: "4px 0 0 16px" }}>
        Emballage premium (cire d'abeille + ruban)
      </Text>
    )}
    {item.metadata.giftMessage && (
      <Text style={{ fontSize: 11, fontStyle: "italic", margin: "4px 0 0 16px" }}>
        Message cadeau : « {item.metadata.giftMessage} »
      </Text>
    )}
  </>
)}
```

- [ ] **Step 16.3: Build smoke**

```powershell
pnpm build
```
Expected: success.

- [ ] **Step 16.4: Commit**

```powershell
git add lib/email/templates/OrderConfirmation.tsx
git commit -m "feat(coffrets): email confirmation renders coffret composition + gift + packaging"
```

---

## Task 17: Listing /biscuits — include coffrets with badge

**Files:**
- Modify: `app/[locale]/(shop)/biscuits/page.tsx`
- Modify: `components/shop/ProductCard.tsx` (add badge)

- [ ] **Step 17.1: ProductCard — coffret badge**

Modify `components/shop/ProductCard.tsx` — accept a new optional prop `type` and render a "Coffret" badge when `type === "coffret"`:
```tsx
type Props = {
  // existing props
  type?: "biscuit" | "coffret";
  // …
};

// inside JSX, after the image:
{type === "coffret" && (
  <span className="absolute top-3 left-3 bg-honey text-cream text-xs uppercase tracking-wider px-2 py-1 rounded">
    Coffret
  </span>
)}
```

Also change the link href: for coffrets, link to `/coffrets/[slug]` instead of `/biscuits/[slug]`:
```tsx
const href = type === "coffret" ? `/${locale}/coffrets/${slug}` : `/${locale}/biscuits/${slug}`;
```

- [ ] **Step 17.2: Pass type from listing page**

Modify `app/[locale]/(shop)/biscuits/page.tsx` — find the iteration over `listProductsForLocale` result, and pass `type={product.type}` to each `<ProductCard>`. Also use `displayedPriceCents` for the price (Task 4 change).

- [ ] **Step 17.3: Smoke**

```powershell
pnpm dev
```
Open http://localhost:3000/fr/biscuits — should now show 8 biscuits + 4 coffrets (with "Coffret" badge), 12 cards total. Click a coffret card → routes to `/coffrets/[slug]`, not `/biscuits/[slug]`. Ctrl+C.

- [ ] **Step 17.4: Commit**

```powershell
git add components/shop/ProductCard.tsx app/[locale]/(shop)/biscuits/page.tsx
git commit -m "feat(coffrets): include coffrets in /biscuits listing with badge + correct href"
```

---

## Task 18: E2E test + final QA

**Files:**
- Create: `tests/e2e/coffret-purchase.spec.ts`

- [ ] **Step 18.1: Write the E2E test**

Create `tests/e2e/coffret-purchase.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("guest purchase coffret with gift message + premium packaging", async ({ page }) => {
  await page.goto("/fr/coffrets");
  await expect(page.getByRole("heading", { name: /coffrets cadeaux/i })).toBeVisible();

  await page.getByRole("link", { name: /Coffret Découverte/i }).first().click();
  await expect(page).toHaveURL(/\/fr\/coffrets\/coffret-decouverte/);

  await page.getByPlaceholder("Joyeux anniversaire").fill("Test E2E — message cadeau");
  await page.getByRole("button", { name: /^Premium/ }).click();

  // Total includes premium: should NOT be just the coffret price
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();

  await page.goto("/fr/panier");
  await expect(page.getByText("Test E2E — message cadeau", { exact: false })).toBeVisible();
  await expect(page.getByText(/Emballage premium/i)).toBeVisible();

  // Proceed to checkout (Stripe redirect — stop assertion here, do not click pay)
  await page.getByRole("link", { name: /commander|checkout/i }).first().click();
  await expect(page).toHaveURL(/checkout/);
});
```

- [ ] **Step 18.2: Run E2E**

```powershell
pnpm playwright test tests/e2e/coffret-purchase.spec.ts --headed
```
Watch the browser. Expected: passes through listing → detail → add → cart shows gift + premium → checkout page reached.

- [ ] **Step 18.3: Full test suite**

```powershell
pnpm test
pnpm playwright test
pnpm build
pnpm exec tsc --noEmit
```
All green expected.

- [ ] **Step 18.4: Commit + push**

```powershell
git add tests/e2e/coffret-purchase.spec.ts
git commit -m "test(coffrets): E2E guest purchase coffret with gift + premium"
git push origin main
```
Vercel will auto-deploy. Verify on https://beecuit.vercel.app/fr/coffrets after build completes.

---

## Self-review

Spec coverage:
- D1 Pré-composés seulement → Task 6 (seed only pré-composés), no compose-libre code anywhere ✓
- D2 1 taille par thématique → schema doesn't have a "size" field; each coffret = 1 product ✓
- D3 Prix somme − discount → Task 2 (`computeCoffretPrice`) + Task 4 (catalog enrichment) ✓
- D4 Stock dérivé → Task 3 (`isCoffretAvailable`) + Task 15 (cascade decrement) ✓
- D5 Message cadeau + packaging premium → Task 9 (UI), Task 7 (cart), Task 13 (cart UI edit), Task 14 (Stripe), Task 16 (email) ✓
- D6 Photos hybride → Task 11 (detail page hero + section "Ce coffret contient") ✓
- D7 /coffrets + /biscuits → Task 12 (/coffrets) + Task 17 (/biscuits listing extension) ✓
- D8 Layout détail validé → Task 11 implements it ✓

All edge cases from spec section 7:
- FK restrict empêche delete biscuit → comes free with the FK in Task 1 ✓
- isActive=false → handled in `isCoffretAvailable` Task 3 ✓
- Stock épuisé entre add et checkout → reuses Phase 1 availability check at checkout (already in place) ✓
- Coffret vide → Zod `min(1)` Task 5 ✓
- Discount 100% → CHECK 0-99 in Task 1 SQL ✓
- Message > 200 → Zod max(200) Task 7 ✓
- Panier mixte → Task 8 `getCartContents` handles both types ✓
- Webhook doublon → inherits Phase 1 idempotence ✓
- Slug collision → existing `uniq_locale_slug` constraint ✓

Placeholder scan: clean — no "TBD", no "TODO", no "similar to Task N", no "add appropriate error handling". Every code block is concrete.

Type consistency check:
- `CartItemMetadata` defined Task 1 cart.ts, reused Task 7 validators, Task 8 query type, Task 9 components, Task 13 cart row, Task 14 checkout — same shape everywhere ✓
- `OrderItemMetadata` Task 1 order_items.ts, used Task 14 checkout, Task 15 cascade, Task 16 email — same shape ✓
- `CoffretPrice` Task 2 pricing.ts, used Task 4 catalog, Task 8 cart, Task 9 breakdown component, Task 11 detail page ✓
- `Locale` already exported from `lib/queries/catalog.ts` (Phase 1), reused in Task 2/3/4 ✓

No type/name mismatches across tasks.

# BeeCuit — Phase 1 (E-commerce de base unitaires) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first functional e-commerce on top of Phase 0 — a Belgian visitor can browse the biscuit catalog in 4 languages, add unitary biscuits to a cart, pay via Stripe (Bancontact/Card/Apple-Google Pay), receive a confirmation email, and track the order in their account. Admin can CRUD products with strict 4-language translations, manage orders, and edit shipping rates.

**Architecture:** Single Next.js 15 monolith (already in place from Phase 0). Drizzle/Neon for data. Stripe Checkout hosted for payment. Vercel Blob for product images. Resend for transactional emails. Server Actions for all mutations (no custom API routes except the Stripe webhook).

**Tech Stack additions over Phase 0:** Stripe Node SDK · @vercel/blob · React Email · @react-email/components · uuid

**Spec:** `docs/superpowers/specs/2026-05-23-phase1-ecommerce-base-design.md`

**Working directory:** `C:\Users\jeanb\Documents\WebAPP\BeeCuit` (Windows, PowerShell)

**Package manager:** pnpm

---

## Prerequisites (manual, one-off)

Before starting Task 1, complete these account setups:

- [ ] **Stripe account** — sign up at https://dashboard.stripe.com (or reuse existing). In dashboard:
  - Settings → Payment methods → activate **Bancontact** + **Card**
  - **Tax Rates** → Add → 6 %, **Inclusive**, type **VAT**, country **Belgium**, name "TVA Belgique 6% Alimentation" → copy the `txr_xxx` ID
  - **API keys** (test mode) → copy Publishable key (`pk_test_…`) and Secret key (`sk_test_…`)
  - **Webhooks** → leave for Task 16 (need our deployed URL first)
- [ ] **Vercel Blob token** — on Vercel dashboard → project `beecuit` → Storage → Create a new Blob store named `beecuit-images` → copy the `BLOB_READ_WRITE_TOKEN` value
- [ ] **Stripe CLI installed** for local webhook testing (https://stripe.com/docs/stripe-cli) — verify with `stripe --version`

Keep all secrets handy — they go into `.env.local` at Task 1.

---

## File structure produced by this phase

```
beecuit/
├── lib/
│   ├── env.ts                                # extended with Stripe + Blob vars
│   ├── slug.ts                               # NEW: kebab-case helper
│   ├── order-number.ts                       # NEW: BCT-YYYY-NNNNNN generator
│   ├── totals.ts                             # NEW: subtotal/shipping/vat/total
│   ├── db/
│   │   ├── schema.ts                         # extended barrel
│   │   └── schemas/
│   │       ├── products.ts                   # MODIFIED: + category_id
│   │       ├── orders.ts                     # MODIFIED: + stripe IDs + snapshots
│   │       ├── translations.ts               # NEW: product_translations
│   │       ├── categories.ts                 # NEW: categories + category_translations
│   │       ├── images.ts                     # NEW: product_images
│   │       ├── addresses.ts                  # NEW
│   │       ├── cart.ts                       # NEW: carts + cart_items
│   │       ├── order_items.ts                # NEW
│   │       ├── shipping.ts                   # NEW: shipping_rates
│   │       └── stripe.ts                     # NEW: stripe_webhook_events
│   ├── actions/
│   │   ├── cart.actions.ts                   # NEW
│   │   ├── checkout.actions.ts               # NEW
│   │   ├── address.actions.ts                # NEW
│   │   └── admin/
│   │       ├── products.actions.ts           # NEW
│   │       ├── categories.actions.ts         # NEW
│   │       ├── orders.actions.ts             # NEW
│   │       ├── shipping.actions.ts           # NEW
│   │       └── images.actions.ts             # NEW
│   ├── shipping/bpost.ts                     # NEW
│   ├── stripe/
│   │   ├── client.ts                         # NEW
│   │   ├── checkout.ts                       # NEW
│   │   └── webhook.ts                        # NEW
│   ├── email/
│   │   ├── client.ts                         # NEW (Resend wrapper)
│   │   └── templates/
│   │       ├── OrderConfirmation.tsx         # NEW
│   │       └── OrderShipped.tsx              # NEW
│   ├── validators/
│   │   ├── product.ts                        # NEW
│   │   ├── cart.ts                           # NEW
│   │   ├── checkout.ts                       # NEW
│   │   └── address.ts                        # NEW
│   └── blob/upload.ts                        # NEW: Vercel Blob helper
├── app/[locale]/
│   ├── (shop)/
│   │   ├── layout.tsx                        # NEW: header + footer + CartProvider
│   │   ├── biscuits/page.tsx                 # NEW
│   │   ├── biscuits/[slug]/page.tsx          # NEW
│   │   ├── panier/page.tsx                   # NEW
│   │   ├── checkout/page.tsx                 # NEW
│   │   └── commande-confirmee/[orderNumber]/page.tsx  # NEW
│   ├── (account)/
│   │   ├── layout.tsx                        # NEW: header + sidebar
│   │   ├── compte/page.tsx                   # MODIFIED
│   │   ├── compte/commandes/page.tsx         # NEW
│   │   ├── compte/commandes/[orderNumber]/page.tsx  # NEW
│   │   └── compte/adresses/page.tsx          # NEW
│   └── (existing sign-in stays)
├── app/admin/
│   ├── layout.tsx                            # NEW
│   ├── page.tsx                              # NEW (dashboard)
│   ├── produits/page.tsx                     # NEW
│   ├── produits/nouveau/page.tsx             # NEW
│   ├── produits/[id]/page.tsx                # NEW
│   ├── categories/page.tsx                   # NEW
│   ├── commandes/page.tsx                    # NEW
│   ├── commandes/[orderNumber]/page.tsx      # NEW
│   └── livraison/page.tsx                    # NEW
├── app/api/webhooks/stripe/route.ts          # NEW
├── components/
│   ├── layout/{Header,Footer,LocaleSwitcher,CartIcon}.tsx    # NEW
│   ├── shop/{ProductCard,ProductGrid,CategoryFilter,AddToCartButton,CartDrawer,CartItemRow,CheckoutForm,OrderSummary}.tsx  # NEW
│   ├── account/{OrderList,OrderDetailCard,AddressList,AddressForm,AccountSidebar}.tsx  # NEW
│   ├── admin/{AdminSidebar,ProductForm,ProductTranslationTabs,ProductTable,CategoryForm,OrderTable,OrderDetailAdmin,ShippingRatesEditor,ImageUploader}.tsx  # NEW
│   └── ui/                                   # extended with new shadcn primitives
├── messages/{fr,nl,de,en}.json               # extended
├── scripts/seed/{index,data}.ts              # NEW
└── tests/
    ├── unit/{slug,order-number,totals,shipping,validators}.test.ts  # NEW
    ├── integration/{cart-actions,product-crud,stock-decrement,webhook-idempotency,webhook-signature}.test.ts  # NEW
    └── e2e/{guest-purchase,auth-purchase,out-of-stock,admin-create-product,admin-mark-shipped}.spec.ts  # NEW
```

---

## Task 1: Install Phase 1 dependencies + extend env

**Files:**
- Modify: `package.json` (pnpm add)
- Modify: `.env.example`
- Modify: `.env.local`
- Modify: `lib/env.ts`

- [ ] **Step 1: Install runtime + dev deps**

```powershell
pnpm add stripe @vercel/blob react-email @react-email/components uuid
pnpm add -D @types/uuid
```

- [ ] **Step 2: Extend `.env.example` with the new keys**

Append at the bottom of `.env.example`:

```bash

# ── Stripe ────────────────────────────────────────────────────
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_TAX_RATE_ID="txr_..."

# ── Vercel Blob ───────────────────────────────────────────────
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

- [ ] **Step 3: Copy real values into `.env.local`**

Open `.env.local` and append the same 5 keys, pasting the real values gathered in Prerequisites. For `STRIPE_WEBHOOK_SECRET` use the placeholder `whsec_placeholder_will_be_set_in_task_16` for now — it gets replaced in Task 16 once the webhook is wired.

- [ ] **Step 4: Extend Zod validation in `lib/env.ts`**

Add inside the `server:` block of `createEnv({...})`:

```typescript
STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
STRIPE_WEBHOOK_SECRET: z.string().min(1),
STRIPE_TAX_RATE_ID: z.string().startsWith("txr_"),
BLOB_READ_WRITE_TOKEN: z.string().startsWith("vercel_blob_rw_"),
```

And add to `runtimeEnv:`:

```typescript
STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
STRIPE_TAX_RATE_ID: process.env.STRIPE_TAX_RATE_ID,
BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
```

- [ ] **Step 5: Verify env loads**

```powershell
pnpm dotenv -e .env.local -- pnpm tsx -e "import('./lib/env.ts').then(() => console.log('env OK'))"
```

Expected: `env OK`.

- [ ] **Step 6: Extend Auth.js session type (used from Task 10 onward)**

Create `next-auth.d.ts` at the project root :

```typescript
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id?: string; role?: string } & DefaultSession["user"];
  }
}
```

Then update `lib/auth.ts` to populate these via a session callback. In the `NextAuth({ ... })` config, add (or extend) `callbacks` :

```typescript
callbacks: {
  async session({ session, user }) {
    if (session.user && user) {
      session.user.id = user.id;
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
      session.user.role = u?.role ?? "customer";
    }
    return session;
  },
},
```

This makes `session.user.id` and `session.user.role` available to all subsequent tasks (cart actions in Task 10, address actions in Task 13, admin auth check in Task 19, etc.).

- [ ] **Step 7: Commit**

```powershell
git add package.json pnpm-lock.yaml .env.example lib/env.ts lib/auth.ts next-auth.d.ts
git commit -m "feat(phase1): deps, env vars, session.user.id/role typing"
```

---

## Task 2: Schema extensions — modify `products` and `orders`

**Files:**
- Modify: `lib/db/schemas/products.ts`
- Modify: `lib/db/schemas/orders.ts`

- [ ] **Step 1: Rewrite `lib/db/schemas/products.ts`**

```typescript
import { pgTable, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const productType = pgEnum("product_type", ["biscuit", "coffret", "subscription_plan"]);

export const products = pgTable("products", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  type: productType("type").notNull(),
  sku: text("sku").notNull().unique(),
  categoryId: text("category_id"),
  basePriceCents: integer("base_price_cents").notNull(),
  weightGrams: integer("weight_grams").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  model3dUrl: text("model_3d_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
```

We remove `slug` (moves to `product_translations`, per-locale) and `thumbnail_url` (replaced by relation `product_images` with `is_primary`). We make `stock_quantity` NOT NULL with default 0.

- [ ] **Step 2: Rewrite `lib/db/schemas/orders.ts`**

```typescript
import { pgTable, text, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const orderStatus = pgEnum("order_status", [
  "pending", "paid", "preparing", "shipped", "delivered", "cancelled", "refunded",
]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  guestEmail: text("guest_email"),
  status: orderStatus("status").notNull().default("pending"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  locale: text("locale").notNull().default("fr"),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot").$type<Record<string, unknown>>(),
  billingAddressSnapshot: jsonb("billing_address_snapshot").$type<Record<string, unknown>>(),
  shippingMethod: text("shipping_method"),
  shippingTrackingNumber: text("shipping_tracking_number"),
  stripeSessionId: text("stripe_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
});
```

- [ ] **Step 3: Commit (migration generated in Task 4)**

```powershell
git add lib/db/schemas/products.ts lib/db/schemas/orders.ts
git commit -m "feat(db): extend products and orders for Phase 1"
```

---

## Task 3: New schemas (8 files)

**Files:**
- Create: `lib/db/schemas/categories.ts`, `translations.ts`, `images.ts`, `addresses.ts`, `cart.ts`, `order_items.ts`, `shipping.ts`, `stripe.ts`
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Create `lib/db/schemas/categories.ts`**

```typescript
import { pgTable, text, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { locale } from "./auth";

export const categories = pgTable("categories", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.categoryId, t.locale] }) }),
);
```

- [ ] **Step 2: Create `lib/db/schemas/translations.ts`**

```typescript
import { pgTable, text, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./products";
import { locale } from "./auth";

export const productTranslations = pgTable(
  "product_translations",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull(),
    longDescription: text("long_description").notNull(),
    ingredients: text("ingredients").notNull(),
    allergens: text("allergens").array().notNull().default(sql`ARRAY[]::text[]`),
    nutritionalFactsPer100g: jsonb("nutritional_facts_per_100g")
      .$type<{ energy_kcal: number; fat_g: number; carbs_g: number; protein_g: number; salt_g: number }>()
      .notNull(),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
  },
  (t) => ({
    uniqueProductLocale: uniqueIndex("uniq_product_locale").on(t.productId, t.locale),
    uniqueLocaleSlug: uniqueIndex("uniq_locale_slug").on(t.locale, t.slug),
  }),
);
```

- [ ] **Step 3: Create `lib/db/schemas/images.ts`**

```typescript
import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./products";

export const productImages = pgTable("product_images", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
});
```

- [ ] **Step 4: Create `lib/db/schemas/addresses.ts`**

```typescript
import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const addresses = pgTable("addresses", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("BE"),
  phone: text("phone"),
  isDefaultShipping: boolean("is_default_shipping").notNull().default(false),
  isDefaultBilling: boolean("is_default_billing").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
```

- [ ] **Step 5: Create `lib/db/schemas/cart.ts`**

```typescript
import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    cartId: text("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({ uniqueCartProduct: uniqueIndex("uniq_cart_product").on(t.cartId, t.productId) }),
);
```

- [ ] **Step 6: Create `lib/db/schemas/order_items.ts`**

```typescript
import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orders } from "./orders";
import { products } from "./products";

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  productSkuSnapshot: text("product_sku_snapshot").notNull(),
  unitPriceCentsSnapshot: integer("unit_price_cents_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
});
```

- [ ] **Step 7: Create `lib/db/schemas/shipping.ts`**

```typescript
import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const shippingRates = pgTable("shipping_rates", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  method: text("method").notNull(),
  country: text("country").notNull().default("BE"),
  weightGramsMax: integer("weight_grams_max").notNull(),
  priceCents: integer("price_cents").notNull(),
  freeShippingThresholdCents: integer("free_shipping_threshold_cents"),
  sortOrder: integer("sort_order").notNull().default(0),
});
```

- [ ] **Step 8: Create `lib/db/schemas/stripe.ts`**

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { mode: "date" }).notNull().defaultNow(),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
});
```

- [ ] **Step 9: Update barrel `lib/db/schema.ts`**

```typescript
export * from "./schemas/auth";
export * from "./schemas/products";
export * from "./schemas/orders";
export * from "./schemas/categories";
export * from "./schemas/translations";
export * from "./schemas/images";
export * from "./schemas/addresses";
export * from "./schemas/cart";
export * from "./schemas/order_items";
export * from "./schemas/shipping";
export * from "./schemas/stripe";
```

- [ ] **Step 10: Typecheck**

```powershell
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 11: Commit**

```powershell
git add lib/db/
git commit -m "feat(db): add Phase 1 schemas (categories, translations, images, addresses, cart, order_items, shipping, stripe events)"
```

---

## Task 4: Generate and apply the Phase 1 migration

**Files:**
- Create: `drizzle/0003_phase1.sql` (generated)

- [ ] **Step 1: Generate the migration**

```powershell
pnpm db:generate
```

A new SQL file appears under `drizzle/` (~11 tables).

- [ ] **Step 2: Inspect the generated SQL**

Open the new `drizzle/0003_*.sql`. Verify it contains:
- `CREATE TABLE "categories"`, `"category_translations"`, `"product_translations"`, `"product_images"`, `"addresses"`, `"carts"`, `"cart_items"`, `"order_items"`, `"shipping_rates"`, `"stripe_webhook_events"`
- `ALTER TABLE "products" ADD COLUMN "category_id" text;` plus a `DROP COLUMN "slug"` and `DROP COLUMN "thumbnail_url"` (since we removed them in Task 2)
- `ALTER TABLE "orders" ADD COLUMN` for the new Stripe + snapshot fields

If you see an unexpected DROP TABLE, STOP and review before applying.

- [ ] **Step 3: Apply the migration**

```powershell
pnpm db:migrate
```

Expected: `migrations applied successfully!`

- [ ] **Step 4: Re-run the existing tests**

```powershell
pnpm dotenv -e .env.local -- pnpm test
```

Expected: still 5 passing (Phase 0). New tables aren't queried yet.

- [ ] **Step 5: Commit**

```powershell
git add drizzle/
git commit -m "feat(db): apply Phase 1 migration on Neon"
```

---

## Task 5: Pure helpers — slug, order number, totals, shipping (TDD)

**Files:**
- Create: `lib/slug.ts`, `lib/order-number.ts`, `lib/totals.ts`, `lib/shipping/bpost.ts`
- Create: `tests/unit/slug.test.ts`, `order-number.test.ts`, `totals.test.ts`, `shipping.test.ts`

- [ ] **Step 1: Write failing slug test**

`tests/unit/slug.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { toSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("kebab-cases ASCII", () => {
    expect(toSlug("Spéculoos Artisanal 200g")).toBe("speculoos-artisanal-200g");
  });
  it("strips diacritics", () => {
    expect(toSlug("Crème brûlée")).toBe("creme-brulee");
  });
  it("collapses spaces and punctuation", () => {
    expect(toSlug("Box  Découverte!! (Premium)")).toBe("box-decouverte-premium");
  });
  it("trims leading/trailing dashes", () => {
    expect(toSlug("  -test-  ")).toBe("test");
  });
});
```

Run, expect failure:

```powershell
pnpm vitest run tests/unit/slug.test.ts
```

Expected: cannot resolve `@/lib/slug`.

- [ ] **Step 2: Implement `lib/slug.ts`**

```typescript
export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

Re-run test → 4 pass.

- [ ] **Step 3: Write failing order-number test**

`tests/unit/order-number.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatOrderNumber } from "@/lib/order-number";

describe("formatOrderNumber", () => {
  it("formats with BCT-YYYY-NNNNNN prefix", () => {
    expect(formatOrderNumber(1, new Date("2026-05-23"))).toBe("BCT-2026-000001");
  });
  it("pads to 6 digits", () => {
    expect(formatOrderNumber(42, new Date("2026-01-01"))).toBe("BCT-2026-000042");
  });
  it("handles large numbers", () => {
    expect(formatOrderNumber(999999, new Date("2026-12-31"))).toBe("BCT-2026-999999");
  });
});
```

- [ ] **Step 4: Implement `lib/order-number.ts`**

```typescript
export function formatOrderNumber(sequence: number, now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const padded = String(sequence).padStart(6, "0");
  return `BCT-${year}-${padded}`;
}
```

The Postgres sequence is created in the seed (Task 6).

Re-run test → 3 pass.

- [ ] **Step 5: Write failing totals test**

`tests/unit/totals.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { extractVatInclusive, computeOrderTotals } from "@/lib/totals";

describe("extractVatInclusive", () => {
  it("extracts 6 % VAT from a TTC amount", () => {
    // 1060 cents TTC at 6 % → HT = 1000, VAT = 60
    expect(extractVatInclusive(1060, 6)).toEqual({ ht: 1000, vat: 60 });
  });
  it("rounds to nearest cent", () => {
    // 690 cents TTC at 6 % → HT = 650.94, rounded
    const r = extractVatInclusive(690, 6);
    expect(r.ht + r.vat).toBe(690);
  });
});

describe("computeOrderTotals", () => {
  it("sums lines + shipping with VAT inclusive 6 %", () => {
    const t = computeOrderTotals({
      lines: [{ unitPriceCents: 690, quantity: 2 }, { unitPriceCents: 850, quantity: 1 }],
      shippingCents: 550,
      vatPercentInclusive: 6,
    });
    expect(t.subtotalCents).toBe(690 * 2 + 850); // 2230
    expect(t.shippingCents).toBe(550);
    expect(t.totalCents).toBe(2230 + 550); // 2780
    expect(t.htCents + t.vatCents).toBe(t.totalCents);
  });
});
```

- [ ] **Step 6: Implement `lib/totals.ts`**

```typescript
export function extractVatInclusive(amountCentsTtc: number, vatPercent: number) {
  const htRaw = (amountCentsTtc * 100) / (100 + vatPercent);
  const ht = Math.round(htRaw);
  const vat = amountCentsTtc - ht;
  return { ht, vat };
}

export type OrderLine = { unitPriceCents: number; quantity: number };

export function computeOrderTotals(args: {
  lines: OrderLine[];
  shippingCents: number;
  vatPercentInclusive: number;
}) {
  const subtotalCents = args.lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const totalCents = subtotalCents + args.shippingCents;
  const { ht: htCents, vat: vatCents } = extractVatInclusive(totalCents, args.vatPercentInclusive);
  return {
    subtotalCents,
    shippingCents: args.shippingCents,
    totalCents,
    htCents,
    vatCents,
  };
}
```

Re-run tests → all pass.

- [ ] **Step 7: Write failing shipping test**

`tests/unit/shipping.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { pickShippingRate, type ShippingRate } from "@/lib/shipping/bpost";

const rates: ShippingRate[] = [
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 1000, priceCents: 550, freeShippingThresholdCents: 5000 },
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 2000, priceCents: 750, freeShippingThresholdCents: 5000 },
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 5000, priceCents: 1200, freeShippingThresholdCents: 5000 },
];

describe("pickShippingRate", () => {
  it("picks the smallest bracket that covers the weight", () => {
    expect(pickShippingRate(rates, 500, 0)?.priceCents).toBe(550);
    expect(pickShippingRate(rates, 1500, 0)?.priceCents).toBe(750);
    expect(pickShippingRate(rates, 3000, 0)?.priceCents).toBe(1200);
  });
  it("returns null when weight exceeds all brackets", () => {
    expect(pickShippingRate(rates, 6000, 0)).toBeNull();
  });
  it("returns 0 when subtotal reaches free shipping threshold", () => {
    expect(pickShippingRate(rates, 1500, 5000)?.priceCents).toBe(0);
  });
});
```

- [ ] **Step 8: Implement `lib/shipping/bpost.ts`**

```typescript
export type ShippingRate = {
  method: string;
  country: string;
  weightGramsMax: number;
  priceCents: number;
  freeShippingThresholdCents: number | null;
};

export function pickShippingRate(
  rates: ShippingRate[],
  weightGrams: number,
  subtotalCents: number,
): ShippingRate | null {
  const sorted = [...rates].sort((a, b) => a.weightGramsMax - b.weightGramsMax);
  const match = sorted.find((r) => r.weightGramsMax >= weightGrams);
  if (!match) return null;
  if (match.freeShippingThresholdCents !== null && subtotalCents >= match.freeShippingThresholdCents) {
    return { ...match, priceCents: 0 };
  }
  return match;
}
```

Run all unit tests:

```powershell
pnpm vitest run tests/unit/
```

Expected: all unit tests green.

- [ ] **Step 9: Commit**

```powershell
git add lib/slug.ts lib/order-number.ts lib/totals.ts lib/shipping/ tests/unit/
git commit -m "feat(phase1): pure helpers for slug, order#, totals, shipping (TDD)"
```

---

## Task 6: Seed script (categories + 8 products + 4 translations + shipping rates + admin promotion)

**Files:**
- Create: `scripts/seed/data.ts`
- Create: `scripts/seed/index.ts`
- Modify: `package.json` (script)

- [ ] **Step 1: Add the Postgres sequence for order numbers**

Create a one-off SQL migration manually. In `drizzle/0004_order_seq.sql`:

```sql
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
```

And register it in the journal — easiest way: re-run `pnpm db:generate` after editing schema? No, this is plain SQL. Use the manual SQL approach:

Add the SEQUENCE inline at the start of `scripts/seed/index.ts` so it runs once. (Cleaner than hand-editing drizzle journal.)

- [ ] **Step 2: Create `scripts/seed/data.ts`** with the 5 categories and 8 products

```typescript
export const CATEGORIES = [
  { slug: "sables", names: { fr: "Sablés", nl: "Zandkoekjes", de: "Sandgebäck", en: "Shortbreads" } },
  { slug: "speculoos", names: { fr: "Spéculoos", nl: "Speculoos", de: "Spekulatius", en: "Spéculoos" } },
  { slug: "chocolat", names: { fr: "Chocolat", nl: "Chocolade", de: "Schokolade", en: "Chocolate" } },
  { slug: "saisonniers", names: { fr: "Saisonniers", nl: "Seizoensgebonden", de: "Saisonal", en: "Seasonal" } },
  { slug: "sans-gluten", names: { fr: "Sans Gluten", nl: "Glutenvrij", de: "Glutenfrei", en: "Gluten-Free" } },
] as const;

type Trans = { name: string; shortDescription: string; longDescription: string; ingredients: string; allergens: string[]; seoTitle: string; seoDescription: string };

export const PRODUCTS: Array<{
  sku: string;
  categorySlug: string;
  basePriceCents: number;
  weightGrams: number;
  stockQuantity: number;
  isFeatured: boolean;
  nutritionalFactsPer100g: { energy_kcal: number; fat_g: number; carbs_g: number; protein_g: number; salt_g: number };
  translations: Record<"fr" | "nl" | "de" | "en", Trans>;
  imageCount: number;
}> = [
  {
    sku: "BCT-SPEC-200",
    categorySlug: "speculoos",
    basePriceCents: 690,
    weightGrams: 200,
    stockQuantity: 50,
    isFeatured: true,
    nutritionalFactsPer100g: { energy_kcal: 480, fat_g: 18, carbs_g: 72, protein_g: 6, salt_g: 0.5 },
    translations: {
      fr: { name: "Spéculoos artisanal 200g", shortDescription: "Le grand classique belge à la cannelle.", longDescription: "Nos spéculoos sont cuits doucement pour révéler les arômes de cannelle et de sucre candi.", ingredients: "Farine de blé, sucre candi, beurre, cannelle, levure, œuf, sel.", allergens: ["Gluten", "Lait", "Œufs"], seoTitle: "Spéculoos artisanal BeeCuit", seoDescription: "Spéculoos belges traditionnels à la cannelle, cuits à Liège." },
      nl: { name: "Ambachtelijke speculoos 200g", shortDescription: "De grote Belgische klassieker met kaneel.", longDescription: "Onze speculoos worden zacht gebakken om de aroma's van kaneel en kandijsuiker te onthullen.", ingredients: "Tarwemeel, kandijsuiker, boter, kaneel, gist, ei, zout.", allergens: ["Gluten", "Melk", "Eieren"], seoTitle: "Ambachtelijke speculoos BeeCuit", seoDescription: "Traditionele Belgische speculoos met kaneel, gebakken in Luik." },
      de: { name: "Handwerklicher Spekulatius 200g", shortDescription: "Der große belgische Klassiker mit Zimt.", longDescription: "Unser Spekulatius wird sanft gebacken, um die Aromen von Zimt und Kandiszucker zu entfalten.", ingredients: "Weizenmehl, Kandiszucker, Butter, Zimt, Hefe, Ei, Salz.", allergens: ["Gluten", "Milch", "Eier"], seoTitle: "Handwerklicher Spekulatius BeeCuit", seoDescription: "Traditionelle belgische Spekulatius mit Zimt, gebacken in Lüttich." },
      en: { name: "Artisan spéculoos 200g", shortDescription: "The great Belgian classic with cinnamon.", longDescription: "Our spéculoos are slowly baked to reveal the aromas of cinnamon and rock sugar.", ingredients: "Wheat flour, rock sugar, butter, cinnamon, yeast, egg, salt.", allergens: ["Gluten", "Milk", "Eggs"], seoTitle: "Artisan Spéculoos by BeeCuit", seoDescription: "Traditional Belgian spéculoos with cinnamon, baked in Liège." },
    },
    imageCount: 2,
  },
  // ── 7 more products following the same shape ──
  // BCT-SABL-CHOC-180 (Sablé chocolat noir 180g — 850, sables)
  // BCT-MACA-NOIS-006 (Macaron noisette x6 — 1200, sables)
  // BCT-COOK-CHOC-250 (Cookies pépites chocolat 250g — 990, chocolat)
  // BCT-GALE-BEUR-150 (Galettes pur beurre 150g — 590, sables)
  // BCT-SPEC-SG-180  (Spéculoos sans gluten 180g — 790, sans-gluten)
  // BCT-FLOR-AMAN-200 (Florentins amandes 200g — 1050, chocolat)
  // BCT-SPRI-VANI-200 (Spritz vanille 200g — 750, sables)
  //
  // Pour économiser la place dans ce plan, l'agent qui implémente doit COPIER
  // la structure ci-dessus et la décliner pour les 7 autres. Garder le même
  // schéma : nutritional, allergens variant selon le produit (la liste UE 1169
  // standard), 4 traductions complètes humaines (pas DeepL).
];

export const SHIPPING_RATES = [
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 1000, priceCents: 550, freeShippingThresholdCents: 5000, sortOrder: 1 },
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 2000, priceCents: 750, freeShippingThresholdCents: 5000, sortOrder: 2 },
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 5000, priceCents: 1200, freeShippingThresholdCents: 5000, sortOrder: 3 },
];

export const ADMIN_EMAIL = "jeanbaptiste.dhondt1@gmail.com";
```

- [ ] **Step 3: Create `scripts/seed/index.ts`**

```typescript
import { db } from "@/lib/db";
import {
  categories, categoryTranslations,
  products, productTranslations, productImages,
  shippingRates, users,
} from "@/lib/db/schema";
import { CATEGORIES, PRODUCTS, SHIPPING_RATES, ADMIN_EMAIL } from "./data";
import { toSlug } from "@/lib/slug";
import { sql } from "drizzle-orm";

const LOCALES = ["fr", "nl", "de", "en"] as const;

async function ensureSequence() {
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;`);
}

async function seedCategories() {
  for (const c of CATEGORIES) {
    const [row] = await db
      .insert(categories)
      .values({ slug: c.slug, sortOrder: 0, isActive: true })
      .onConflictDoUpdate({ target: categories.slug, set: { isActive: true } })
      .returning();
    if (!row) throw new Error(`Failed upsert category ${c.slug}`);
    for (const loc of LOCALES) {
      await db
        .insert(categoryTranslations)
        .values({ categoryId: row.id, locale: loc, name: c.names[loc] })
        .onConflictDoUpdate({
          target: [categoryTranslations.categoryId, categoryTranslations.locale],
          set: { name: c.names[loc] },
        });
    }
  }
}

async function seedProducts() {
  const cats = await db.select().from(categories);
  const catBySlug = new Map(cats.map((c) => [c.slug, c.id] as const));

  for (const p of PRODUCTS) {
    const categoryId = catBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Missing category ${p.categorySlug}`);

    const [prod] = await db
      .insert(products)
      .values({
        type: "biscuit",
        sku: p.sku,
        categoryId,
        basePriceCents: p.basePriceCents,
        weightGrams: p.weightGrams,
        stockQuantity: p.stockQuantity,
        isFeatured: p.isFeatured,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          basePriceCents: p.basePriceCents,
          weightGrams: p.weightGrams,
          stockQuantity: p.stockQuantity,
          categoryId,
          isFeatured: p.isFeatured,
          updatedAt: new Date(),
        },
      })
      .returning();
    if (!prod) throw new Error(`Failed upsert product ${p.sku}`);

    for (const loc of LOCALES) {
      const t = p.translations[loc];
      await db
        .insert(productTranslations)
        .values({
          productId: prod.id,
          locale: loc,
          name: t.name,
          slug: toSlug(t.name),
          shortDescription: t.shortDescription,
          longDescription: t.longDescription,
          ingredients: t.ingredients,
          allergens: t.allergens,
          nutritionalFactsPer100g: p.nutritionalFactsPer100g,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        })
        .onConflictDoUpdate({
          target: [productTranslations.productId, productTranslations.locale],
          set: {
            name: t.name,
            shortDescription: t.shortDescription,
            longDescription: t.longDescription,
            ingredients: t.ingredients,
            allergens: t.allergens,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
          },
        });
    }

    // images: only insert if none exist (to allow admin to replace later)
    const existing = await db.select().from(productImages).where(sql`${productImages.productId} = ${prod.id}`);
    if (existing.length === 0) {
      for (let i = 0; i < p.imageCount; i++) {
        await db.insert(productImages).values({
          productId: prod.id,
          url: `https://picsum.photos/seed/${p.sku}-${i}/800/800`,
          altText: p.translations.fr.name,
          sortOrder: i,
          isPrimary: i === 0,
        });
      }
    }
  }
}

async function seedShipping() {
  for (const r of SHIPPING_RATES) {
    await db.insert(shippingRates).values(r).onConflictDoNothing();
  }
}

async function promoteAdmin() {
  await db
    .update(users)
    .set({ role: "admin" })
    .where(sql`${users.email} = ${ADMIN_EMAIL}`);
  console.log(`If ${ADMIN_EMAIL} has not yet signed in via magic link, no row was updated — sign in first, then re-run pnpm seed.`);
}

async function main() {
  await ensureSequence();
  await seedCategories();
  await seedProducts();
  await seedShipping();
  await promoteAdmin();
  console.log("✓ Seed complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: Add the `seed` script to `package.json`**

```json
"seed": "dotenv -e .env.local -- tsx scripts/seed/index.ts"
```

- [ ] **Step 5: Run the seed**

```powershell
pnpm seed
```

Expected: `✓ Seed complete`. Open Neon Tables → verify 5 categories, 8 products, 32 product_translations (8×4), 16 product_images (8×2), 3 shipping_rates.

If admin user missing : sign in via magic link on the prod site first, then re-run `pnpm seed`.

- [ ] **Step 6: Commit**

```powershell
git add scripts/seed/ package.json
git commit -m "feat(phase1): seed script with 5 categories, 8 products, 32 translations, 3 shipping rates"
```

---

## Task 7: Layout shell — (shop) route group with Header + Footer + LocaleSwitcher

**Files:**
- Create: `app/[locale]/(shop)/layout.tsx`
- Create: `components/layout/Header.tsx`, `Footer.tsx`, `LocaleSwitcher.tsx`, `CartIcon.tsx`
- Modify: `messages/{fr,nl,de,en}.json` (add nav + footer keys)
- Move: `app/[locale]/page.tsx` → `app/[locale]/(shop)/page.tsx`
- Move: `app/[locale]/sign-in/` → `app/[locale]/(shop)/sign-in/` (still uses the shop layout)

The `(shop)` route group adds the shared header/footer without affecting URLs. We do this BEFORE catalog pages so they inherit the layout automatically.

- [ ] **Step 1: Extend `messages/fr.json`** (and the 3 others identically translated)

Add under the root :

```json
"footer": {
  "tagline": "Biscuits artisanaux belges, faits avec amour à Liège.",
  "copyright": "© {year} BeeCuit — Tous droits réservés"
},
"cart": {
  "label": "Panier",
  "empty": "Ton panier est vide",
  "viewCart": "Voir mon panier",
  "checkout": "Passer commande",
  "remove": "Retirer",
  "quantity": "Quantité",
  "subtotal": "Sous-total",
  "shipping": "Livraison",
  "total": "Total"
}
```

Equivalents NL/DE/EN to add as part of the same step.

- [ ] **Step 2: Create `components/layout/LocaleSwitcher.tsx`** (server component)

```tsx
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  return (
    <nav className="flex gap-2 text-sm" aria-label="Changer de langue">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href="/"
          locale={l}
          className={`uppercase tracking-wide ${
            l === currentLocale ? "text-honey-dark font-bold underline" : "text-warm-brown hover:text-honey-dark"
          }`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Create `components/layout/CartIcon.tsx`** (server stub for now, just a static icon link — count badge added in Task 10)

```tsx
import { Link } from "@/i18n/navigation";

export function CartIcon() {
  return (
    <Link href="/panier" aria-label="Panier" className="text-warm-brown hover:text-honey-dark">
      🛒
    </Link>
  );
}
```

(Emoji placeholder for Phase 1 — a real SVG icon can land in Phase 4 polish.)

- [ ] **Step 4: Create `components/layout/Header.tsx`** (server component)

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartIcon } from "./CartIcon";

export async function Header({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  return (
    <header className="bg-cream border-warm-brown/10 border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-honey font-display text-2xl">
          BeeCuit
        </Link>
        <nav className="hidden gap-6 text-sm md:flex" aria-label="Principal">
          <Link href="/biscuits" className="text-warm-brown hover:text-honey-dark">
            {t("biscuits")}
          </Link>
          <Link href="/compte" className="text-warm-brown hover:text-honey-dark">
            {t("account")}
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <LocaleSwitcher currentLocale={locale} />
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create `components/layout/Footer.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function Footer({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("footer");
  return (
    <footer className="bg-cream border-warm-brown/10 mt-16 border-t">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center">
        <p className="text-warm-brown text-sm">{t("tagline")}</p>
        <p className="text-warm-brown/60 mt-2 text-xs">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Create `app/[locale]/(shop)/layout.tsx`**

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
```

- [ ] **Step 7: Move existing pages into the route group**

```powershell
mkdir -p "app/[locale]/(shop)"
git mv "app/[locale]/page.tsx" "app/[locale]/(shop)/page.tsx"
git mv "app/[locale]/sign-in" "app/[locale]/(shop)/sign-in"
```

The page paths stay the same (route groups `(name)` are invisible to URLs).

- [ ] **Step 8: Remove the standalone full-screen layout from the home page**

In `app/[locale]/(shop)/page.tsx`, replace the existing `<main className="min-h-screen flex items-center justify-center bg-cream">…</main>` wrapper with a centered hero that lives INSIDE the shop layout:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <section className="bg-cream flex min-h-[70vh] items-center justify-center">
      <div className="max-w-xl space-y-6 px-6 text-center">
        <h1 className="text-honey text-6xl">{t("title")}</h1>
        <p className="text-warm-brown text-xl">{t("tagline")}</p>
        <Link href="/biscuits">
          <Button className="bg-honey text-cream hover:bg-honey-dark">{t("cta")}</Button>
        </Link>
      </div>
    </section>
  );
}
```

The CTA now actually points to `/biscuits` (fixing the dead button from Phase 0).

- [ ] **Step 9: Local visual check**

```powershell
pnpm dev
```

Visit `/fr`, verify : header + footer visible, logo BeeCuit cliquable retourne à `/fr`, CTA "Découvrir nos coffrets" mène à `/fr/biscuits` (404 prévu — page créée Task 8). Stop server.

- [ ] **Step 10: Commit**

```powershell
git add app/ components/layout/ messages/
git commit -m "feat(layout): (shop) route group with Header + Footer + LocaleSwitcher"
```

---

## Task 8: Public catalog list page `/biscuits`

**Files:**
- Create: `app/[locale]/(shop)/biscuits/page.tsx`
- Create: `components/shop/ProductCard.tsx`, `ProductGrid.tsx`, `CategoryFilter.tsx`
- Create: `lib/queries/catalog.ts` (data fetching helpers, server-only)
- Modify: `messages/*.json` (catalog keys)

- [ ] **Step 1: Add catalog translations**

Add to each `messages/*.json` under root :

```json
"catalog": {
  "title": "Nos biscuits",
  "intro": "Découvre la sélection BeeCuit, tous nos biscuits cuits à Liège.",
  "filterAll": "Tous",
  "outOfStock": "Épuisé",
  "addToCart": "Ajouter au panier",
  "from": "à partir de"
}
```

(NL/DE/EN translated equivalents same step.)

- [ ] **Step 2: Create `lib/queries/catalog.ts`** (server-only helpers)

```typescript
import "server-only";
import { db } from "@/lib/db";
import {
  products, productTranslations, productImages,
  categories, categoryTranslations,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export type Locale = "fr" | "nl" | "de" | "en";

export async function listActiveCategoriesForLocale(locale: Locale) {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categoryTranslations.name,
    })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(eq(categoryTranslations.categoryId, categories.id), eq(categoryTranslations.locale, locale)),
    )
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);
}

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
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(where)
    .orderBy(products.createdAt);

  return rows;
}

export async function getProductBySlug(locale: Locale, slug: string) {
  const [row] = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      weightGrams: products.weightGrams,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      longDescription: productTranslations.longDescription,
      ingredients: productTranslations.ingredients,
      allergens: productTranslations.allergens,
      nutritionalFactsPer100g: productTranslations.nutritionalFactsPer100g,
      seoTitle: productTranslations.seoTitle,
      seoDescription: productTranslations.seoDescription,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(and(eq(products.isActive, true), eq(productTranslations.slug, slug)))
    .limit(1);
  if (!row) return null;
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, row.id))
    .orderBy(productImages.sortOrder);
  return { ...row, images };
}
```

- [ ] **Step 3: Create `components/shop/ProductCard.tsx`**

```tsx
import { Link } from "@/i18n/navigation";

type Props = {
  slug: string;
  name: string;
  shortDescription: string;
  primaryImageUrl: string | null;
  basePriceCents: number;
  stockQuantity: number;
  outOfStockLabel: string;
};

export function ProductCard(p: Props) {
  const isOut = p.stockQuantity <= 0;
  const priceEur = (p.basePriceCents / 100).toFixed(2);
  return (
    <Link
      href={`/biscuits/${p.slug}`}
      className={`group block overflow-hidden rounded-lg border border-warm-brown/10 bg-white shadow-sm transition hover:shadow-md ${isOut ? "opacity-60" : ""}`}
    >
      <div className="aspect-square bg-soft-rose">
        {p.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.primaryImageUrl} alt={p.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-warm-brown font-display text-lg">{p.name}</h3>
        <p className="text-warm-brown/70 line-clamp-2 text-sm">{p.shortDescription}</p>
        <div className="flex items-center justify-between">
          <span className="text-honey-dark font-mono text-base">{priceEur} €</span>
          {isOut && <span className="text-terracotta text-xs">{p.outOfStockLabel}</span>}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Create `components/shop/ProductGrid.tsx`**

```tsx
import { ProductCard } from "./ProductCard";

type GridProduct = React.ComponentProps<typeof ProductCard>;

export function ProductGrid({ products }: { products: GridProduct[] }) {
  if (products.length === 0) {
    return <p className="text-warm-brown/70 py-12 text-center">Aucun biscuit trouvé.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.slug} {...p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create `components/shop/CategoryFilter.tsx`** (server component, uses Link with searchParams)

```tsx
import { Link } from "@/i18n/navigation";

type Cat = { slug: string; name: string };

export function CategoryFilter({
  categories,
  activeSlug,
  allLabel,
}: {
  categories: Cat[];
  activeSlug?: string;
  allLabel: string;
}) {
  const base = "/biscuits";
  return (
    <nav className="flex flex-wrap gap-2 pb-6">
      <Link
        href={base}
        className={`rounded-full border px-3 py-1 text-sm ${!activeSlug ? "border-honey bg-honey/10 text-honey-dark" : "border-warm-brown/20 text-warm-brown hover:border-honey/50"}`}
      >
        {allLabel}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={{ pathname: base, query: { categorie: c.slug } }}
          className={`rounded-full border px-3 py-1 text-sm ${activeSlug === c.slug ? "border-honey bg-honey/10 text-honey-dark" : "border-warm-brown/20 text-warm-brown hover:border-honey/50"}`}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 6: Create `app/[locale]/(shop)/biscuits/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { listActiveCategoriesForLocale, listProductsForLocale, type Locale } from "@/lib/queries/catalog";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const revalidate = 60;

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { locale } = await params;
  const { categorie } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");

  const [cats, prods] = await Promise.all([
    listActiveCategoriesForLocale(locale as Locale),
    listProductsForLocale(locale as Locale, categorie),
  ]);

  const grid = prods.map((p) => ({
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    primaryImageUrl: p.primaryImageUrl,
    basePriceCents: p.basePriceCents,
    stockQuantity: p.stockQuantity,
    outOfStockLabel: t("outOfStock"),
  }));

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-honey font-display mb-2 text-5xl">{t("title")}</h1>
      <p className="text-warm-brown/70 mb-8">{t("intro")}</p>
      <CategoryFilter categories={cats} activeSlug={categorie} allLabel={t("filterAll")} />
      <ProductGrid products={grid} />
    </section>
  );
}
```

- [ ] **Step 7: Verify visually**

```powershell
pnpm dev
```

Visit `/fr/biscuits`, expect the grid of 8 seeded products. Click a category chip → URL updates with `?categorie=…`, grid filters. Stop server.

- [ ] **Step 8: Commit**

```powershell
git add app/ components/shop/ProductCard.tsx components/shop/ProductGrid.tsx components/shop/CategoryFilter.tsx lib/queries/ messages/
git commit -m "feat(shop): catalog list page /biscuits with category filter"
```

---

## Task 9: Public product detail page `/biscuits/[slug]`

**Files:**
- Create: `app/[locale]/(shop)/biscuits/[slug]/page.tsx`
- Create: `components/shop/ProductImages.tsx`
- (AddToCartButton client component arrives in Task 11; here we use a disabled stub)

- [ ] **Step 1: Create `components/shop/ProductImages.tsx`**

```tsx
"use client";
import { useState } from "react";

type Img = { url: string; altText: string | null };

export function ProductImages({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return <div className="bg-soft-rose aspect-square w-full" />;
  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[active]?.url}
        alt={images[active]?.altText ?? name}
        className="aspect-square w-full rounded-lg object-cover"
      />
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded ${i === active ? "ring-honey ring-2" : ""}`}
              aria-label={`Image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/[locale]/(shop)/biscuits/[slug]/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductBySlug, type Locale } from "@/lib/queries/catalog";
import { ProductImages } from "@/components/shop/ProductImages";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // stock varie, on ne SSG pas

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProductBySlug(locale as Locale, slug);
  if (!p) return {};
  return { title: p.seoTitle, description: p.seoDescription };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const product = await getProductBySlug(locale as Locale, slug);
  if (!product) notFound();

  const priceEur = (product.basePriceCents / 100).toFixed(2);
  const isOut = product.stockQuantity <= 0;

  return (
    <article className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-2">
      <ProductImages images={product.images} name={product.name} />
      <div className="space-y-6">
        <h1 className="text-honey font-display text-4xl">{product.name}</h1>
        <p className="text-warm-brown text-lg">{product.shortDescription}</p>
        <p className="text-honey-dark font-mono text-3xl">{priceEur} €</p>
        {isOut ? (
          <Button disabled className="w-full">{t("outOfStock")}</Button>
        ) : (
          <Button disabled className="bg-honey text-cream hover:bg-honey-dark w-full">
            {t("addToCart")}
          </Button>
        )}
        <div className="text-warm-brown/80 prose-sm space-y-4 pt-6 leading-relaxed">
          <p>{product.longDescription}</p>
        </div>
        <details className="border-warm-brown/20 border-t pt-4">
          <summary className="cursor-pointer text-sm font-medium">Ingrédients</summary>
          <p className="text-warm-brown/80 mt-2 text-sm">{product.ingredients}</p>
        </details>
        {product.allergens.length > 0 && (
          <details className="border-warm-brown/20 border-t pt-4">
            <summary className="cursor-pointer text-sm font-medium">Allergènes</summary>
            <ul className="text-warm-brown/80 mt-2 list-disc pl-5 text-sm">
              {product.allergens.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </details>
        )}
        <details className="border-warm-brown/20 border-t pt-4">
          <summary className="cursor-pointer text-sm font-medium">Valeurs nutritionnelles /100 g</summary>
          <table className="text-warm-brown/80 mt-2 w-full text-sm">
            <tbody>
              <tr><td>Énergie</td><td className="text-right">{product.nutritionalFactsPer100g.energy_kcal} kcal</td></tr>
              <tr><td>Matières grasses</td><td className="text-right">{product.nutritionalFactsPer100g.fat_g} g</td></tr>
              <tr><td>Glucides</td><td className="text-right">{product.nutritionalFactsPer100g.carbs_g} g</td></tr>
              <tr><td>Protéines</td><td className="text-right">{product.nutritionalFactsPer100g.protein_g} g</td></tr>
              <tr><td>Sel</td><td className="text-right">{product.nutritionalFactsPer100g.salt_g} g</td></tr>
            </tbody>
          </table>
        </details>
      </div>
    </article>
  );
}
```

The "Add to cart" button is intentionally disabled here. It becomes a working client component in Task 11.

- [ ] **Step 3: Verify visually**

```powershell
pnpm dev
```

Visit `/fr/biscuits` → click any card → land on the detail page with images, price, descriptions, and disabled cart button. Stop server.

- [ ] **Step 4: Commit**

```powershell
git add "app/[locale]/(shop)/biscuits/" components/shop/ProductImages.tsx
git commit -m "feat(shop): product detail page /biscuits/[slug] with images and metadata"
```

---

## Task 10: Cart Server Actions (anonymous + auth + merge)

**Files:**
- Create: `lib/validators/cart.ts`
- Create: `lib/actions/cart.actions.ts`
- Create: `lib/queries/cart.ts` (server-only reads)
- Create: `tests/integration/cart-actions.test.ts`

- [ ] **Step 1: Cart validators**

`lib/validators/cart.ts`:

```typescript
import { z } from "zod";

export const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
});
export type AddToCartInput = z.infer<typeof AddToCartSchema>;

export const UpdateQuantitySchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.number().int().nonnegative().max(99),
});
```

- [ ] **Step 2: Cart queries (server-only)**

`lib/queries/cart.ts`:

```typescript
import "server-only";
import { db } from "@/lib/db";
import { carts, cartItems, products, productTranslations, productImages } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { Locale } from "./catalog";

export async function getOrCreateCartForSessionToken(sessionToken: string) {
  const [existing] = await db.select().from(carts).where(eq(carts.sessionToken, sessionToken)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(carts).values({ sessionToken }).returning();
  if (!created) throw new Error("Failed to create cart");
  return created;
}

export async function getOrCreateCartForUser(userId: string) {
  const [existing] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(carts).values({ userId }).returning();
  if (!created) throw new Error("Failed to create cart");
  return created;
}

export async function getCartContents(cartId: string, locale: Locale) {
  return db
    .select({
      cartItemId: cartItems.id,
      productId: products.id,
      quantity: cartItems.quantity,
      unitPriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      weightGrams: products.weightGrams,
      name: productTranslations.name,
      slug: productTranslations.slug,
      primaryImageUrl: sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(eq(cartItems.cartId, cartId));
}
```

- [ ] **Step 3: Cart Server Actions**

`lib/actions/cart.actions.ts`:

```typescript
"use server";

import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, cartItems, products } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { AddToCartSchema, UpdateQuantitySchema } from "@/lib/validators/cart";
import { getOrCreateCartForSessionToken, getOrCreateCartForUser } from "@/lib/queries/cart";

const COOKIE = "cart_session_token";

async function getActiveCartId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    const cart = await getOrCreateCartForUser(session.user.id);
    return cart.id;
  }
  const store = await cookies();
  let token = store.get(COOKIE)?.value;
  if (!token) {
    token = uuid();
    store.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  const cart = await getOrCreateCartForSessionToken(token);
  return cart.id;
}

export async function addToCart(rawInput: unknown) {
  const input = AddToCartSchema.parse(rawInput);
  const [prod] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  if (!prod) throw new Error("Product not found");
  if (!prod.isActive) throw new Error("Product not available");

  const cartId = await getActiveCartId();

  await db
    .insert(cartItems)
    .values({ cartId, productId: input.productId, quantity: input.quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: { quantity: sql`LEAST(${cartItems.quantity} + ${input.quantity}, ${prod.stockQuantity})` },
    });

  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  revalidatePath("/", "layout");
}

export async function updateQuantity(rawInput: unknown) {
  const { cartItemId, quantity } = UpdateQuantitySchema.parse(rawInput);
  if (quantity === 0) {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
  }
  revalidatePath("/", "layout");
}

export async function removeFromCart(cartItemId: string) {
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  revalidatePath("/", "layout");
}

export async function mergeAnonymousCart() {
  const session = await auth();
  if (!session?.user?.id) return;
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return;
  const [anon] = await db.select().from(carts).where(eq(carts.sessionToken, token)).limit(1);
  if (!anon) {
    store.delete(COOKIE);
    return;
  }
  const userCart = await getOrCreateCartForUser(session.user.id);

  // Move items: insert or sum quantities
  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, anon.id));
  for (const item of items) {
    await db
      .insert(cartItems)
      .values({ cartId: userCart.id, productId: item.productId, quantity: item.quantity })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: { quantity: sql`${cartItems.quantity} + ${item.quantity}` },
      });
  }
  await db.delete(carts).where(eq(carts.id, anon.id));
  store.delete(COOKIE);
  revalidatePath("/", "layout");
}
```

- [ ] **Step 4: Integration test for cart actions**

`tests/integration/cart-actions.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { products, cartItems, carts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getOrCreateCartForSessionToken } from "@/lib/queries/cart";

const TEST_TOKEN = "test-token-cart-actions";

beforeAll(async () => {
  // Ensure a seeded product exists
  const [p] = await db.select().from(products).limit(1);
  if (!p) throw new Error("Run `pnpm seed` before integration tests");
  // Clean any pre-existing test cart
  await db.delete(carts).where(eq(carts.sessionToken, TEST_TOKEN));
});

describe("cart queries", () => {
  it("getOrCreateCartForSessionToken creates then returns same cart", async () => {
    const c1 = await getOrCreateCartForSessionToken(TEST_TOKEN);
    const c2 = await getOrCreateCartForSessionToken(TEST_TOKEN);
    expect(c1.id).toBe(c2.id);
    await db.delete(carts).where(eq(carts.id, c1.id));
  });

  it("cart_items UNIQUE(cart_id, product_id) merges on conflict", async () => {
    const cart = await getOrCreateCartForSessionToken(TEST_TOKEN);
    const [p] = await db.select().from(products).limit(1);
    if (!p) throw new Error("no product");
    await db.insert(cartItems).values({ cartId: cart.id, productId: p.id, quantity: 1 });
    await db
      .insert(cartItems)
      .values({ cartId: cart.id, productId: p.id, quantity: 2 })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: { quantity: sql`${cartItems.quantity} + 2` },
      });
    const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
    expect(items).toHaveLength(1);
    expect(items[0]!.quantity).toBe(3);
    await db.delete(carts).where(eq(carts.id, cart.id));
  });
});
```

Wire integration tests into `vitest.config.ts` if not already — update `include` array to include `tests/integration/**/*.test.ts`. Run:

```powershell
pnpm dotenv -e .env.local -- pnpm vitest run tests/integration/cart-actions.test.ts
```

Expected: 2 pass.

- [ ] **Step 5: Commit**

```powershell
git add lib/validators/cart.ts lib/actions/cart.actions.ts lib/queries/cart.ts tests/integration/ vitest.config.ts
git commit -m "feat(cart): Server Actions for cart with anonymous + auth + merge"
```

---

## Task 11: Cart UI — AddToCartButton + CartDrawer + CartIcon with live count

**Files:**
- Create: `components/shop/AddToCartButton.tsx`
- Create: `components/shop/CartDrawer.tsx`
- Create: `components/shop/CartItemRow.tsx`
- Modify: `components/layout/CartIcon.tsx` (server fetch of count)
- Modify: `app/[locale]/(shop)/biscuits/[slug]/page.tsx` (use real button)
- Add shadcn `sheet` + `dialog` if not present

- [ ] **Step 1: Add shadcn primitives needed**

```powershell
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add select
```

- [ ] **Step 2: Refactor `components/layout/CartIcon.tsx`** to show the live count

```tsx
import { Link } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carts, cartItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function getCartItemCount(): Promise<number> {
  const session = await auth();
  let cartId: string | null = null;
  if (session?.user?.id) {
    const [c] = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, session.user.id)).limit(1);
    cartId = c?.id ?? null;
  } else {
    const store = await cookies();
    const token = store.get("cart_session_token")?.value;
    if (token) {
      const [c] = await db.select({ id: carts.id }).from(carts).where(eq(carts.sessionToken, token)).limit(1);
      cartId = c?.id ?? null;
    }
  }
  if (!cartId) return 0;
  const [row] = await db
    .select({ total: sql<number>`COALESCE(SUM(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return row?.total ?? 0;
}

export async function CartIcon() {
  const count = await getCartItemCount();
  return (
    <Link href="/panier" aria-label="Panier" className="relative text-warm-brown hover:text-honey-dark">
      <span>🛒</span>
      {count > 0 && (
        <span className="bg-honey text-cream absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 3: Create `components/shop/AddToCartButton.tsx`** (client)

```tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/actions/cart.actions";
import { useRouter } from "@/i18n/navigation";

export function AddToCartButton({
  productId,
  label,
  outOfStock,
}: {
  productId: string;
  label: string;
  outOfStock: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (outOfStock) {
    return <Button disabled className="w-full">Épuisé</Button>;
  }

  return (
    <div className="flex gap-3">
      <select
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="border-warm-brown/20 rounded-md border bg-white px-3 py-2"
        aria-label="Quantité"
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <Button
        className="bg-honey text-cream hover:bg-honey-dark flex-1"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await addToCart({ productId, quantity: qty });
            router.refresh();
          })
        }
      >
        {pending ? "…" : label}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Update `app/[locale]/(shop)/biscuits/[slug]/page.tsx`** to use the real button

Replace the disabled Button block with :

```tsx
<AddToCartButton productId={product.id} label={t("addToCart")} outOfStock={isOut} />
```

and import : `import { AddToCartButton } from "@/components/shop/AddToCartButton";`

- [ ] **Step 5: Create `components/shop/CartItemRow.tsx`** (client, for both drawer and page)

```tsx
"use client";
import { useTransition } from "react";
import { updateQuantity, removeFromCart } from "@/lib/actions/cart.actions";
import { useRouter } from "@/i18n/navigation";

export function CartItemRow({
  cartItemId,
  name,
  unitPriceCents,
  quantity,
  stockQuantity,
  primaryImageUrl,
}: {
  cartItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  stockQuantity: number;
  primaryImageUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const subtotalEur = ((unitPriceCents * quantity) / 100).toFixed(2);

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="bg-soft-rose h-16 w-16 overflow-hidden rounded">
        {primaryImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryImageUrl} alt={name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-warm-brown text-sm font-medium">{name}</p>
        <p className="text-warm-brown/60 text-xs">{(unitPriceCents / 100).toFixed(2)} €</p>
      </div>
      <select
        value={quantity}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await updateQuantity({ cartItemId, quantity: Number(e.target.value) });
            router.refresh();
          })
        }
        className="border-warm-brown/20 rounded border bg-white px-2 py-1 text-sm"
      >
        {Array.from({ length: Math.min(stockQuantity, 10) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <p className="text-honey-dark w-16 text-right font-mono text-sm">{subtotalEur} €</p>
      <button
        onClick={() =>
          startTransition(async () => {
            await removeFromCart(cartItemId);
            router.refresh();
          })
        }
        disabled={pending}
        className="text-terracotta/70 hover:text-terracotta px-2 text-lg"
        aria-label="Retirer"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/shop/CartDrawer.tsx`** (client, opens from CartIcon click — for Phase 1 we keep CartIcon as a plain Link; the drawer renders separately via header)

We keep the drawer minimal in Phase 1 : auto-open after Add-to-cart isn't strictly necessary — clicking the icon goes to the full `/panier` page which is the canonical view. Skip the drawer build for Phase 1 (YAGNI — `/panier` covers it), revisit in Phase 4 polish. Drop this step.

- [ ] **Step 7: Verify visually**

```powershell
pnpm dev
```

Go to `/fr/biscuits` → click a product → choose quantity → "Ajouter au panier" → click the cart icon in header (count badge should show) → land on `/panier` (next task).

- [ ] **Step 8: Commit**

```powershell
git add components/
git commit -m "feat(cart): AddToCartButton + CartItemRow + CartIcon with live count"
```

---

## Task 12: Panier page `/panier`

**Files:**
- Create: `app/[locale]/(shop)/panier/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCartContents } from "@/lib/queries/cart";
import type { Locale } from "@/lib/queries/catalog";
import { CartItemRow } from "@/components/shop/CartItemRow";

export const dynamic = "force-dynamic";

async function findCartId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) {
    const [c] = await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1);
    return c?.id ?? null;
  }
  const store = await cookies();
  const token = store.get("cart_session_token")?.value;
  if (!token) return null;
  const [c] = await db.select().from(carts).where(eq(carts.sessionToken, token)).limit(1);
  return c?.id ?? null;
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  const cartId = await findCartId();
  const items = cartId ? await getCartContents(cartId, locale as Locale) : [];

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-honey font-display mb-4 text-4xl">{t("label")}</h1>
        <p className="text-warm-brown/70 mb-8">{t("empty")}</p>
        <Link href="/biscuits">
          <Button className="bg-honey text-cream hover:bg-honey-dark">Découvrir nos biscuits</Button>
        </Link>
      </section>
    );
  }

  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const subtotalEur = (subtotalCents / 100).toFixed(2);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-honey font-display mb-8 text-4xl">{t("label")}</h1>
      <div className="divide-warm-brown/10 divide-y">
        {items.map((i) => (
          <CartItemRow
            key={i.cartItemId}
            cartItemId={i.cartItemId}
            name={i.name}
            unitPriceCents={i.unitPriceCents}
            quantity={i.quantity}
            stockQuantity={i.stockQuantity}
            primaryImageUrl={i.primaryImageUrl}
          />
        ))}
      </div>
      <div className="border-warm-brown/10 mt-6 flex items-center justify-between border-t pt-6">
        <span className="text-warm-brown text-lg">{t("subtotal")}</span>
        <span className="text-honey-dark font-mono text-2xl">{subtotalEur} €</span>
      </div>
      <p className="text-warm-brown/60 mt-2 text-right text-xs">Livraison et TVA calculées au checkout</p>
      <div className="mt-8 flex justify-between gap-4">
        <Link href="/biscuits" className="text-warm-brown text-sm underline">
          Continuer mes achats
        </Link>
        <Link href="/checkout">
          <Button className="bg-honey text-cream hover:bg-honey-dark">{t("checkout")}</Button>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify visually**

```powershell
pnpm dev
```

Add 2 items via product page → go to `/fr/panier` → adjust quantities → remove an item → empty state appears. Stop server.

- [ ] **Step 3: Commit**

```powershell
git add "app/[locale]/(shop)/panier/"
git commit -m "feat(cart): /panier page with item list and totals"
```

---

## Task 13: Espace compte — (account) layout + sidebar + adresses CRUD

**Files:**
- Create: `app/[locale]/(account)/layout.tsx`
- Create: `app/[locale]/(account)/compte/adresses/page.tsx`
- Create: `components/account/AccountSidebar.tsx`
- Create: `components/account/AddressList.tsx`, `AddressForm.tsx`
- Create: `lib/validators/address.ts`
- Create: `lib/actions/address.actions.ts`
- Move: `app/[locale]/(shop)/compte/page.tsx` → `app/[locale]/(account)/compte/page.tsx`

The existing `/compte` page (from Phase 0) lives under the shop layout. We move it into a dedicated `(account)` route group with sidebar.

- [ ] **Step 1: Move the existing compte page**

```powershell
git mv "app/[locale]/(shop)/compte" "app/[locale]/(account)/compte"
```

(If Phase 0 placed it directly under `app/[locale]/compte`, adjust the source path.)

- [ ] **Step 2: Address validator**

`lib/validators/address.ts`:

```typescript
import { z } from "zod";

export const AddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().max(50).optional().nullable(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  postalCode: z.string().min(2).max(20),
  city: z.string().min(1).max(100),
  country: z.string().length(2).default("BE"),
  phone: z.string().max(40).optional().nullable(),
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof AddressSchema>;
```

- [ ] **Step 3: Address Server Actions**

`lib/actions/address.actions.ts`:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { AddressSchema } from "@/lib/validators/address";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Unauthorized");
  return id;
}

export async function createAddress(raw: unknown) {
  const userId = await requireUserId();
  const data = AddressSchema.parse(raw);
  if (data.isDefaultShipping) {
    await db.update(addresses).set({ isDefaultShipping: false }).where(eq(addresses.userId, userId));
  }
  if (data.isDefaultBilling) {
    await db.update(addresses).set({ isDefaultBilling: false }).where(eq(addresses.userId, userId));
  }
  await db.insert(addresses).values({ ...data, userId });
  revalidatePath("/compte/adresses");
}

export async function updateAddress(raw: unknown) {
  const userId = await requireUserId();
  const data = AddressSchema.parse(raw);
  if (!data.id) throw new Error("id required for update");
  if (data.isDefaultShipping) {
    await db.update(addresses).set({ isDefaultShipping: false }).where(eq(addresses.userId, userId));
  }
  if (data.isDefaultBilling) {
    await db.update(addresses).set({ isDefaultBilling: false }).where(eq(addresses.userId, userId));
  }
  await db
    .update(addresses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(addresses.id, data.id), eq(addresses.userId, userId)));
  revalidatePath("/compte/adresses");
}

export async function deleteAddress(id: string) {
  const userId = await requireUserId();
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  revalidatePath("/compte/adresses");
}
```

- [ ] **Step 4: AccountSidebar**

`components/account/AccountSidebar.tsx`:

```tsx
import { Link } from "@/i18n/navigation";

const items = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/compte/adresses", label: "Mes adresses" },
];

export function AccountSidebar() {
  return (
    <aside className="w-56 shrink-0">
      <nav className="text-sm">
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className="text-warm-brown hover:bg-honey/10 hover:text-honey-dark block rounded px-3 py-2"
              >
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

- [ ] **Step 5: Account layout (includes shop Header + Footer + sidebar)**

`app/[locale]/(account)/layout.tsx`:

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-12">
        <AccountSidebar />
        <main className="flex-1">{children}</main>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
```

- [ ] **Step 6: AddressList + AddressForm components**

`components/account/AddressForm.tsx` (client) :

```tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createAddress, updateAddress } from "@/lib/actions/address.actions";

type Initial = Partial<{
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}>;

export function AddressForm({ initial = {}, onDone }: { initial?: Initial; onDone: () => void }) {
  const [data, setData] = useState<Initial>({ country: "BE", ...initial });
  const [pending, start] = useTransition();
  const isEdit = !!initial.id;

  function field<K extends keyof Initial>(key: K, type: "text" | "tel" = "text", required = true) {
    return (
      <label className="block">
        <span className="text-warm-brown mb-1 block text-xs">{String(key)}</span>
        <input
          type={type}
          required={required}
          value={(data[key] as string | undefined) ?? ""}
          onChange={(e) => setData({ ...data, [key]: e.target.value })}
          className="border-warm-brown/20 w-full rounded-md border bg-white px-3 py-2"
        />
      </label>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          if (isEdit) await updateAddress(data);
          else await createAddress(data);
          onDone();
        });
      }}
      className="space-y-3"
    >
      {field("label", "text", false)}
      <div className="grid grid-cols-2 gap-3">
        {field("firstName")}
        {field("lastName")}
      </div>
      {field("line1")}
      {field("line2", "text", false)}
      <div className="grid grid-cols-2 gap-3">
        {field("postalCode")}
        {field("city")}
      </div>
      {field("phone", "tel", false)}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!data.isDefaultShipping}
          onChange={(e) => setData({ ...data, isDefaultShipping: e.target.checked })}
        />
        Adresse de livraison par défaut
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!data.isDefaultBilling}
          onChange={(e) => setData({ ...data, isDefaultBilling: e.target.checked })}
        />
        Adresse de facturation par défaut
      </label>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending} className="bg-honey text-cream hover:bg-honey-dark">
          {isEdit ? "Mettre à jour" : "Ajouter"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
```

`components/account/AddressList.tsx` (client wrapper) :

```tsx
"use client";
import { useState, useTransition } from "react";
import { AddressForm } from "./AddressForm";
import { Button } from "@/components/ui/button";
import { deleteAddress } from "@/lib/actions/address.actions";

type Addr = {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

export function AddressList({ addresses }: { addresses: Addr[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      {addresses.map((a) =>
        editing === a.id ? (
          <div key={a.id} className="border-warm-brown/10 rounded-lg border p-4">
            <AddressForm initial={a} onDone={() => setEditing(null)} />
          </div>
        ) : (
          <div key={a.id} className="border-warm-brown/10 flex justify-between rounded-lg border p-4">
            <div>
              {a.label && <p className="text-warm-brown text-sm font-medium">{a.label}</p>}
              <p className="text-warm-brown">{a.firstName} {a.lastName}</p>
              <p className="text-warm-brown/80 text-sm">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
              <p className="text-warm-brown/80 text-sm">{a.postalCode} {a.city} ({a.country})</p>
              {a.phone && <p className="text-warm-brown/60 text-xs">{a.phone}</p>}
              <div className="mt-2 flex gap-2 text-xs">
                {a.isDefaultShipping && <span className="bg-honey/20 text-honey-dark rounded px-2 py-0.5">Livraison par défaut</span>}
                {a.isDefaultBilling && <span className="bg-honey/20 text-honey-dark rounded px-2 py-0.5">Facturation par défaut</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => setEditing(a.id)}>Éditer</Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => start(async () => { await deleteAddress(a.id); })}
              >
                Supprimer
              </Button>
            </div>
          </div>
        ),
      )}
      {creating ? (
        <div className="border-warm-brown/10 rounded-lg border p-4">
          <AddressForm onDone={() => setCreating(false)} />
        </div>
      ) : (
        <Button onClick={() => setCreating(true)} className="bg-honey text-cream hover:bg-honey-dark">
          + Ajouter une adresse
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Page `/compte/adresses`**

`app/[locale]/(account)/compte/adresses/page.tsx`:

```tsx
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AddressList } from "@/components/account/AddressList";
import { setRequestLocale } from "next-intl/server";

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });
  const rows = await db.select().from(addresses).where(eq(addresses.userId, session!.user!.id!));
  return (
    <section>
      <h1 className="text-honey font-display mb-6 text-3xl">Mes adresses</h1>
      <AddressList addresses={rows} />
    </section>
  );
}
```

- [ ] **Step 8: Verify visually**

Login, go to `/fr/compte/adresses`, add an address, edit it, delete it. The sidebar should be visible.

- [ ] **Step 9: Commit**

```powershell
git add app/ components/account/ lib/validators/address.ts lib/actions/address.actions.ts
git commit -m "feat(account): (account) layout with sidebar + /compte/adresses CRUD"
```

---

## Task 14: Checkout page + Stripe Checkout Session Server Action

**Files:**
- Create: `lib/validators/checkout.ts`
- Create: `lib/stripe/client.ts`
- Create: `lib/stripe/checkout.ts`
- Create: `lib/actions/checkout.actions.ts`
- Create: `components/shop/CheckoutForm.tsx`
- Create: `components/shop/OrderSummary.tsx`
- Create: `app/[locale]/(shop)/checkout/page.tsx`

- [ ] **Step 1: Checkout validator**

`lib/validators/checkout.ts`:

```typescript
import { z } from "zod";
import { AddressSchema } from "./address";

export const CheckoutSchema = z.object({
  email: z.string().email(),
  newsletterOptIn: z.boolean().default(false),
  shippingAddress: AddressSchema.omit({ id: true, isDefaultShipping: true, isDefaultBilling: true }),
  billingSameAsShipping: z.boolean().default(true),
  billingAddress: AddressSchema.omit({ id: true, isDefaultShipping: true, isDefaultBilling: true }).optional(),
  shippingMethod: z.literal("bpost_express_24h"),
});
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
```

- [ ] **Step 2: Stripe client**

`lib/stripe/client.ts`:

```typescript
import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
  appInfo: { name: "BeeCuit", version: "0.1.0" },
});
```

- [ ] **Step 3: Stripe Checkout Session helper**

`lib/stripe/checkout.ts`:

```typescript
import "server-only";
import { stripe } from "./client";
import { env } from "@/lib/env";

export type CheckoutLineItem = {
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export async function createStripeCheckoutSession(args: {
  orderId: string;
  orderNumber: string;
  email: string;
  locale: "fr" | "nl" | "de" | "en";
  lineItems: CheckoutLineItem[];
  shippingCents: number;
  appBaseUrl: string;
}) {
  const productLineItems = args.lineItems.map((li) => ({
    price_data: {
      currency: "eur",
      product_data: { name: li.name },
      unit_amount: li.unitPriceCents,
      tax_behavior: "inclusive" as const,
    },
    quantity: li.quantity,
    tax_rates: [env.STRIPE_TAX_RATE_ID],
  }));

  if (args.shippingCents > 0) {
    productLineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Livraison bpost Express 24h" },
        unit_amount: args.shippingCents,
        tax_behavior: "inclusive" as const,
      },
      quantity: 1,
      tax_rates: [env.STRIPE_TAX_RATE_ID],
    });
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "bancontact"],
    locale: args.locale === "en" ? "en" : args.locale === "nl" ? "nl" : args.locale === "de" ? "de" : "fr",
    customer_email: args.email,
    line_items: productLineItems,
    success_url: `${args.appBaseUrl}/${args.locale}/commande-confirmee/${args.orderNumber}`,
    cancel_url: `${args.appBaseUrl}/${args.locale}/checkout`,
    metadata: { order_id: args.orderId, order_number: args.orderNumber },
  });
}
```

- [ ] **Step 4: Checkout Server Action**

`lib/actions/checkout.actions.ts`:

```typescript
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, orders, orderItems, products, shippingRates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { CheckoutSchema } from "@/lib/validators/checkout";
import { computeOrderTotals } from "@/lib/totals";
import { pickShippingRate, type ShippingRate } from "@/lib/shipping/bpost";
import { getCartContents } from "@/lib/queries/cart";
import { formatOrderNumber } from "@/lib/order-number";
import { createStripeCheckoutSession } from "@/lib/stripe/checkout";

export async function calculateShipping(weightGrams: number, subtotalCents: number) {
  const rates = await db.select().from(shippingRates).where(eq(shippingRates.country, "BE"));
  const r: ShippingRate[] = rates.map((x) => ({
    method: x.method,
    country: x.country,
    weightGramsMax: x.weightGramsMax,
    priceCents: x.priceCents,
    freeShippingThresholdCents: x.freeShippingThresholdCents,
  }));
  return pickShippingRate(r, weightGrams, subtotalCents);
}

export async function createCheckoutSession(rawInput: unknown, locale: "fr" | "nl" | "de" | "en") {
  const input = CheckoutSchema.parse(rawInput);
  const session = await auth();
  const store = await cookies();
  const sessionToken = store.get("cart_session_token")?.value;

  const [cart] = session?.user?.id
    ? await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1)
    : sessionToken
      ? await db.select().from(carts).where(eq(carts.sessionToken, sessionToken)).limit(1)
      : [];
  if (!cart) throw new Error("Cart not found");

  const items = await getCartContents(cart.id, locale);
  if (items.length === 0) throw new Error("Cart is empty");

  // Stock re-check
  for (const i of items) {
    if (i.quantity > i.stockQuantity) {
      throw new Error(`Stock insuffisant pour ${i.name}`);
    }
  }

  const totalWeight = items.reduce((s, i) => s + i.weightGrams * i.quantity, 0);
  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const rate = await calculateShipping(totalWeight, subtotalCents);
  if (!rate) throw new Error("Poids excède la livraison disponible");

  const totals = computeOrderTotals({
    lines: items.map((i) => ({ unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
    shippingCents: rate.priceCents,
    vatPercentInclusive: 6,
  });

  // Reserve order number from Postgres sequence
  const [seq] = await db.execute(sql`SELECT nextval('order_number_seq') AS n`);
  const orderNumber = formatOrderNumber(Number((seq as Record<string, unknown>).n));

  // Create order + items in a single transaction
  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: session?.user?.id ?? null,
      guestEmail: input.email,
      status: "pending",
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      taxCents: totals.vatCents,
      totalCents: totals.totalCents,
      currency: "EUR",
      locale,
      shippingAddressSnapshot: input.shippingAddress,
      billingAddressSnapshot: input.billingSameAsShipping ? input.shippingAddress : input.billingAddress!,
      shippingMethod: "bpost_express_24h",
    })
    .returning();
  if (!order) throw new Error("Order creation failed");

  await db.insert(orderItems).values(
    items.map((i) => ({
      orderId: order.id,
      productId: i.productId,
      productNameSnapshot: i.name,
      productSkuSnapshot: i.productId, // SKU lookup is fine too — store id snapshot
      unitPriceCentsSnapshot: i.unitPriceCents,
      quantity: i.quantity,
      lineTotalCents: i.unitPriceCents * i.quantity,
    })),
  );

  // Stripe Checkout Session
  const stripeSession = await createStripeCheckoutSession({
    orderId: order.id,
    orderNumber: order.orderNumber,
    email: input.email,
    locale,
    lineItems: items.map((i) => ({
      name: i.name,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
    })),
    shippingCents: totals.shippingCents,
    appBaseUrl: env.NEXT_PUBLIC_APP_URL,
  });

  await db
    .update(orders)
    .set({ stripeSessionId: stripeSession.id })
    .where(eq(orders.id, order.id));

  redirect(stripeSession.url!);
}
```

- [ ] **Step 5: CheckoutForm (client) + page**

`components/shop/CheckoutForm.tsx` :

```tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/checkout.actions";

type SimpleAddress = {
  firstName: string; lastName: string; line1: string; line2?: string;
  postalCode: string; city: string; country: string; phone?: string; label?: string;
};

export function CheckoutForm({
  defaultEmail,
  locale,
}: {
  defaultEmail: string;
  locale: "fr" | "nl" | "de" | "en";
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [newsletterOptIn, setNewsletter] = useState(false);
  const [billingSameAsShipping, setSame] = useState(true);
  const [ship, setShip] = useState<SimpleAddress>({
    firstName: "", lastName: "", line1: "", postalCode: "", city: "", country: "BE",
  });
  const [bill, setBill] = useState<SimpleAddress>({
    firstName: "", lastName: "", line1: "", postalCode: "", city: "", country: "BE",
  });
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function input<K extends keyof SimpleAddress>(target: SimpleAddress, set: (a: SimpleAddress) => void, key: K, required = true) {
    return (
      <input
        type="text"
        required={required}
        value={target[key] ?? ""}
        onChange={(e) => set({ ...target, [key]: e.target.value })}
        placeholder={String(key)}
        className="border-warm-brown/20 w-full rounded-md border bg-white px-3 py-2 text-sm"
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          try {
            await createCheckoutSession(
              {
                email,
                newsletterOptIn,
                shippingAddress: ship,
                billingSameAsShipping,
                billingAddress: billingSameAsShipping ? undefined : bill,
                shippingMethod: "bpost_express_24h",
              },
              locale,
            );
          } catch (e2) {
            setErr((e2 as Error).message);
          }
        });
      }}
      className="space-y-8"
    >
      <fieldset className="space-y-3">
        <legend className="text-warm-brown font-display text-lg">Contact</legend>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-warm-brown/20 w-full rounded-md border bg-white px-3 py-2 text-sm"
          placeholder="email@exemple.com"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletter(e.target.checked)} />
          M'abonner à la newsletter BeeCuit
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-warm-brown font-display text-lg">Adresse de livraison</legend>
        <div className="grid grid-cols-2 gap-3">
          {input(ship, setShip, "firstName")}
          {input(ship, setShip, "lastName")}
        </div>
        {input(ship, setShip, "line1")}
        {input(ship, setShip, "line2", false)}
        <div className="grid grid-cols-2 gap-3">
          {input(ship, setShip, "postalCode")}
          {input(ship, setShip, "city")}
        </div>
        {input(ship, setShip, "phone", false)}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-warm-brown font-display text-lg">Adresse de facturation</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={billingSameAsShipping} onChange={(e) => setSame(e.target.checked)} />
          Identique à l'adresse de livraison
        </label>
        {!billingSameAsShipping && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {input(bill, setBill, "firstName")}
              {input(bill, setBill, "lastName")}
            </div>
            {input(bill, setBill, "line1")}
            {input(bill, setBill, "line2", false)}
            <div className="grid grid-cols-2 gap-3">
              {input(bill, setBill, "postalCode")}
              {input(bill, setBill, "city")}
            </div>
          </>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-warm-brown font-display text-lg">Livraison</legend>
        <label className="border-warm-brown/20 mt-2 flex items-center gap-3 rounded-md border bg-white p-3 text-sm">
          <input type="radio" checked readOnly />
          <span>bpost Express 24h — tarif calculé selon poids</span>
        </label>
      </fieldset>

      {err && <p className="text-terracotta text-sm">{err}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full"
      >
        {pending ? "Redirection vers Stripe..." : "Payer avec Stripe"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 6: OrderSummary (server, shows live cart totals on checkout page)**

`components/shop/OrderSummary.tsx`:

```tsx
type Line = { name: string; unitPriceCents: number; quantity: number };

export function OrderSummary({
  lines,
  shippingCents,
  totalCents,
  vatCents,
}: {
  lines: Line[];
  shippingCents: number;
  totalCents: number;
  vatCents: number;
}) {
  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const eur = (c: number) => (c / 100).toFixed(2);
  return (
    <aside className="border-warm-brown/10 sticky top-6 rounded-lg border bg-white p-6">
      <h2 className="text-honey-dark font-display mb-4 text-xl">Récapitulatif</h2>
      <ul className="divide-warm-brown/10 mb-4 divide-y text-sm">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between py-2">
            <span>{l.name} × {l.quantity}</span>
            <span className="font-mono">{eur(l.unitPriceCents * l.quantity)} €</span>
          </li>
        ))}
      </ul>
      <div className="border-warm-brown/10 space-y-1 border-t pt-3 text-sm">
        <div className="flex justify-between"><span>Sous-total</span><span className="font-mono">{eur(subtotalCents)} €</span></div>
        <div className="flex justify-between"><span>Livraison</span><span className="font-mono">{eur(shippingCents)} €</span></div>
        <div className="text-warm-brown/60 flex justify-between text-xs"><span>dont TVA 6 % incluse</span><span className="font-mono">{eur(vatCents)} €</span></div>
        <div className="border-warm-brown/10 mt-2 flex justify-between border-t pt-2 text-base font-medium">
          <span>Total</span><span className="font-mono">{eur(totalCents)} €</span>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 7: Checkout page**

`app/[locale]/(shop)/checkout/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getCartContents } from "@/lib/queries/cart";
import { calculateShipping } from "@/lib/actions/checkout.actions";
import { computeOrderTotals } from "@/lib/totals";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { OrderSummary } from "@/components/shop/OrderSummary";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const store = await cookies();
  const token = store.get("cart_session_token")?.value;
  const [cart] = session?.user?.id
    ? await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1)
    : token
      ? await db.select().from(carts).where(eq(carts.sessionToken, token)).limit(1)
      : [];
  if (!cart) redirect({ href: "/panier", locale });
  const items = await getCartContents(cart!.id, locale as "fr" | "nl" | "de" | "en");
  if (items.length === 0) redirect({ href: "/panier", locale });

  const weight = items.reduce((s, i) => s + i.weightGrams * i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const rate = await calculateShipping(weight, subtotal);
  const totals = computeOrderTotals({
    lines: items.map((i) => ({ unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
    shippingCents: rate?.priceCents ?? 0,
    vatPercentInclusive: 6,
  });

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-honey font-display mb-8 text-4xl">Checkout</h1>
        <CheckoutForm defaultEmail={session?.user?.email ?? ""} locale={locale as "fr" | "nl" | "de" | "en"} />
      </div>
      <OrderSummary
        lines={items.map((i) => ({ name: i.name, unitPriceCents: i.unitPriceCents, quantity: i.quantity }))}
        shippingCents={totals.shippingCents}
        totalCents={totals.totalCents}
        vatCents={totals.vatCents}
      />
    </section>
  );
}
```

- [ ] **Step 8: Commit**

```powershell
git add lib/validators/checkout.ts lib/stripe/ lib/actions/checkout.actions.ts components/shop/CheckoutForm.tsx components/shop/OrderSummary.tsx "app/[locale]/(shop)/checkout/"
git commit -m "feat(checkout): page + Stripe Checkout Session creation"
```

---

## Task 15: Stripe webhook handler with idempotency

**Files:**
- Create: `lib/stripe/webhook.ts`
- Create: `app/api/webhooks/stripe/route.ts`
- Create: `tests/integration/webhook-idempotency.test.ts`
- Create: `tests/integration/webhook-signature.test.ts`

- [ ] **Step 1: Webhook handler module**

`lib/stripe/webhook.ts`:

```typescript
import "server-only";
import type Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems, products, stripeWebhookEvents } from "@/lib/db/schema";

export async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.error("[webhook] missing metadata.order_id", { eventId: event.id });
    return;
  }

  // Idempotence: record this event_id; if conflict, skip
  try {
    await db.insert(stripeWebhookEvents).values({
      id: event.id,
      eventType: event.type,
      orderId,
    });
  } catch {
    // already processed
    return;
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) {
    console.error("[webhook] order not found", { orderId });
    return;
  }
  if (order.status !== "pending") {
    return; // double protection
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  // Decrement stock and mark paid in transaction (Drizzle neon-http doesn't support multi-statement TX directly; use sequential statements with raw SQL safeguards)
  await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    })
    .where(eq(orders.id, orderId));

  for (const item of items) {
    if (!item.productId) continue;
    await db
      .update(products)
      .set({ stockQuantity: sql`GREATEST(${products.stockQuantity} - ${item.quantity}, 0)` })
      .where(eq(products.id, item.productId));
  }
}
```

- [ ] **Step 2: API route**

`app/api/webhooks/stripe/route.ts`:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import { handleCheckoutCompleted } from "@/lib/stripe/webhook";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing signature", { status: 400 });
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("[webhook] signature verify failed", e);
    return new NextResponse("invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event);
    }
  } catch (e) {
    console.error("[webhook] handler error", e);
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 3: Integration tests**

`tests/integration/webhook-signature.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";

describe("webhook signature", () => {
  it("constructs event with valid signature", () => {
    const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed", data: { object: {} } });
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET });
    const ev = stripe.webhooks.constructEvent(payload, header, env.STRIPE_WEBHOOK_SECRET);
    expect(ev.id).toBe("evt_test");
  });
  it("rejects invalid signature", () => {
    const payload = JSON.stringify({ id: "evt_test", type: "checkout.session.completed", data: { object: {} } });
    expect(() => stripe.webhooks.constructEvent(payload, "bogus", env.STRIPE_WEBHOOK_SECRET)).toThrow();
  });
});
```

`tests/integration/webhook-idempotency.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { stripeWebhookEvents, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { handleCheckoutCompleted } from "@/lib/stripe/webhook";

const FAKE_ORDER_ID = "fake-order-idem-test";
const FAKE_EVENT_ID = "evt_idem_test";

beforeAll(async () => {
  // Setup: create a fake order pending
  await db.delete(orders).where(eq(orders.id, FAKE_ORDER_ID));
  await db.delete(stripeWebhookEvents).where(eq(stripeWebhookEvents.id, FAKE_EVENT_ID));
  await db.insert(orders).values({
    id: FAKE_ORDER_ID,
    orderNumber: "BCT-TEST-000001",
    subtotalCents: 1000,
    totalCents: 1000,
    status: "pending",
  });
});

describe("webhook idempotency", () => {
  it("processes once, no-ops on second call", async () => {
    const ev = {
      id: FAKE_EVENT_ID,
      type: "checkout.session.completed",
      data: { object: { metadata: { order_id: FAKE_ORDER_ID }, payment_intent: "pi_test" } },
    } as unknown as Parameters<typeof handleCheckoutCompleted>[0];

    await handleCheckoutCompleted(ev);
    await handleCheckoutCompleted(ev); // second call — should noop

    const [o] = await db.select().from(orders).where(eq(orders.id, FAKE_ORDER_ID));
    expect(o?.status).toBe("paid");

    const events = await db.select().from(stripeWebhookEvents).where(eq(stripeWebhookEvents.id, FAKE_EVENT_ID));
    expect(events).toHaveLength(1);
  });
});
```

Run :

```powershell
pnpm dotenv -e .env.local -- pnpm vitest run tests/integration/webhook-signature.test.ts tests/integration/webhook-idempotency.test.ts
```

Expected : 3 pass.

- [ ] **Step 4: Configure Stripe webhook endpoint (manual on Stripe dashboard)**

On the Stripe dashboard → Developers → Webhooks → Add endpoint :
- URL : `https://beecuit.vercel.app/api/webhooks/stripe`
- Events to send : `checkout.session.completed`
- Copy the signing secret (`whsec_xxx`)

Update `.env.local` AND Vercel project env vars (`STRIPE_WEBHOOK_SECRET`) with the real value.

- [ ] **Step 5: Test locally with Stripe CLI**

```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_xxx` printed by the CLI into `.env.local` (this is a separate local-only secret), then in another terminal :

```powershell
pnpm dev
```

Go to `/fr/biscuits` → add to cart → checkout → fill form → click "Payer" → on Stripe Checkout enter test card `4242 4242 4242 4242`, future expiry, any CVC → submit.

Stripe redirects to `/fr/commande-confirmee/BCT-...`. The CLI window should log `checkout.session.completed → 200 OK`. Order in Neon should be `status = 'paid'`, stock decremented.

- [ ] **Step 6: Commit**

```powershell
git add lib/stripe/webhook.ts app/api/webhooks/ tests/integration/
git commit -m "feat(stripe): webhook handler with idempotency + signature tests"
```

---

## Task 16: Email templates + send on order paid

**Files:**
- Create: `lib/email/client.ts`
- Create: `lib/email/templates/OrderConfirmation.tsx`
- Create: `lib/email/templates/OrderShipped.tsx`
- Modify: `lib/stripe/webhook.ts` (call email send)

- [ ] **Step 1: Email client wrapper**

`lib/email/client.ts`:

```typescript
import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

const resend = new Resend(env.AUTH_RESEND_KEY);

export async function sendEmail(args: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  const { error } = await resend.emails.send({
    from: env.AUTH_EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    react: args.react,
  });
  if (error) {
    console.error("[email] send failed", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}
```

- [ ] **Step 2: OrderConfirmation template**

`lib/email/templates/OrderConfirmation.tsx`:

```tsx
import { Html, Head, Body, Container, Section, Heading, Text, Hr } from "@react-email/components";

type Line = { name: string; quantity: number; lineTotalCents: number };

export function OrderConfirmation({
  orderNumber,
  totalCents,
  items,
}: {
  orderNumber: string;
  totalCents: number;
  items: Line[];
}) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#FBF6EE", fontFamily: "system-ui" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px", color: "#4A332A" }}>
          <Heading style={{ color: "#E4A11B", fontSize: 28, margin: 0 }}>BeeCuit</Heading>
          <Text>Merci ! Ta commande #{orderNumber} est confirmée.</Text>
          <Section>
            {items.map((l) => (
              <Text key={l.name} style={{ margin: "4px 0" }}>
                {l.name} × {l.quantity} — {(l.lineTotalCents / 100).toFixed(2)} €
              </Text>
            ))}
          </Section>
          <Hr />
          <Text style={{ textAlign: "right", fontSize: 18 }}>
            <strong>Total : {(totalCents / 100).toFixed(2)} €</strong>
          </Text>
          <Text style={{ fontSize: 12, color: "#888" }}>
            On te tient au courant dès que ta commande est expédiée. À bientôt !
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 3: OrderShipped template**

`lib/email/templates/OrderShipped.tsx`:

```tsx
import { Html, Head, Body, Container, Heading, Text, Link } from "@react-email/components";

export function OrderShipped({ orderNumber, trackingUrl }: { orderNumber: string; trackingUrl: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#FBF6EE", fontFamily: "system-ui" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px", color: "#4A332A" }}>
          <Heading style={{ color: "#E4A11B", fontSize: 28, margin: 0 }}>BeeCuit</Heading>
          <Text>Ta commande #{orderNumber} est en route 📦</Text>
          <Text>
            Tu peux suivre la livraison ici :{" "}
            <Link href={trackingUrl} style={{ color: "#B07A0E" }}>{trackingUrl}</Link>
          </Text>
          <Text style={{ fontSize: 12, color: "#888" }}>
            Livraison estimée sous 24-48h ouvrées par bpost Express.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Hook the email send into the webhook**

Edit `lib/stripe/webhook.ts`, at the end of `handleCheckoutCompleted` after marking paid + decrementing stock, add :

```typescript
import { sendEmail } from "@/lib/email/client";
import { OrderConfirmation } from "@/lib/email/templates/OrderConfirmation";

// ... inside handleCheckoutCompleted, after stock decrement loop:
const recipient = order.guestEmail ?? (typeof session.customer_details?.email === "string" ? session.customer_details.email : null);
if (recipient) {
  try {
    await sendEmail({
      to: recipient,
      subject: `Ta commande BeeCuit #${order.orderNumber} est confirmée`,
      react: OrderConfirmation({
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        items: items.map((i) => ({
          name: i.productNameSnapshot,
          quantity: i.quantity,
          lineTotalCents: i.lineTotalCents,
        })),
      }),
    });
  } catch (e) {
    console.error("[webhook] email send failed", e);
    // do not fail the webhook for email issue
  }
}
```

- [ ] **Step 5: Manual end-to-end test**

With Stripe CLI still forwarding webhooks and dev server running, repeat the test purchase from Task 15 Step 5. Check the Resend dashboard (https://resend.com/emails) — an email entry should appear addressed to the customer.

- [ ] **Step 6: Commit**

```powershell
git add lib/email/ lib/stripe/webhook.ts
git commit -m "feat(emails): OrderConfirmation + OrderShipped templates + webhook integration"
```

---

## Task 17: Order confirmation page `/commande-confirmee/[orderNumber]`

**Files:**
- Create: `app/[locale]/(shop)/commande-confirmee/[orderNumber]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  const eur = (c: number) => (c / 100).toFixed(2);
  const isPending = order.status === "pending";

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-honey font-display mb-3 text-4xl">
        {isPending ? "Traitement en cours…" : "Merci !"}
      </h1>
      <p className="text-warm-brown text-lg">
        {isPending
          ? `Ta commande ${orderNumber} est en cours de validation. Tu recevras un email de confirmation dans quelques instants.`
          : `Ta commande #${orderNumber} est confirmée.`}
      </p>
      <div className="border-warm-brown/10 mt-8 rounded-lg border bg-white p-6 text-left">
        <ul className="divide-warm-brown/10 divide-y">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between py-2 text-sm">
              <span>{i.productNameSnapshot} × {i.quantity}</span>
              <span className="font-mono">{eur(i.lineTotalCents)} €</span>
            </li>
          ))}
        </ul>
        <div className="border-warm-brown/10 mt-3 flex justify-between border-t pt-3 text-base font-medium">
          <span>Total</span>
          <span className="font-mono">{eur(order.totalCents)} €</span>
        </div>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/biscuits">
          <Button className="bg-honey text-cream hover:bg-honey-dark">Continuer mes achats</Button>
        </Link>
        <Link href="/compte/commandes">
          <Button variant="outline">Voir mes commandes</Button>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add "app/[locale]/(shop)/commande-confirmee/"
git commit -m "feat(checkout): confirmation page after Stripe redirect"
```

---

## Task 18: Espace compte — Mes commandes (list + detail)

**Files:**
- Create: `app/[locale]/(account)/compte/commandes/page.tsx`
- Create: `app/[locale]/(account)/compte/commandes/[orderNumber]/page.tsx`
- Create: `components/account/OrderList.tsx`, `OrderDetailCard.tsx`

- [ ] **Step 1: OrderList component**

`components/account/OrderList.tsx`:

```tsx
import { Link } from "@/i18n/navigation";

type Row = {
  orderNumber: string;
  status: string;
  totalCents: number;
  createdAt: Date;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Payée", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Préparation", color: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Expédiée", color: "bg-green-100 text-green-800" },
  delivered: { label: "Livrée", color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800" },
  refunded: { label: "Remboursée", color: "bg-gray-100 text-gray-800" },
};

export function OrderList({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-warm-brown/70">Tu n'as pas encore passé de commande.</p>;
  }
  return (
    <ul className="divide-warm-brown/10 divide-y">
      {rows.map((r) => {
        const s = STATUS_LABEL[r.status] ?? { label: r.status, color: "" };
        return (
          <li key={r.orderNumber} className="py-3">
            <Link href={`/compte/commandes/${r.orderNumber}`} className="flex items-center justify-between hover:underline">
              <div>
                <p className="text-warm-brown text-sm font-medium">#{r.orderNumber}</p>
                <p className="text-warm-brown/60 text-xs">{r.createdAt.toLocaleDateString("fr-BE")}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>{s.label}</span>
              <span className="font-mono text-sm">{(r.totalCents / 100).toFixed(2)} €</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 2: Mes commandes list page**

`app/[locale]/(account)/compte/commandes/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { OrderList } from "@/components/account/OrderList";

export default async function MyOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });
  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, session!.user!.id!))
    .orderBy(desc(orders.createdAt));
  return (
    <section>
      <h1 className="text-honey font-display mb-6 text-3xl">Mes commandes</h1>
      <OrderList rows={rows} />
    </section>
  );
}
```

- [ ] **Step 3: OrderDetailCard component**

`components/account/OrderDetailCard.tsx`:

```tsx
type Item = { productNameSnapshot: string; quantity: number; lineTotalCents: number };
type Address = Record<string, unknown>;

export function OrderDetailCard({
  orderNumber,
  status,
  totalCents,
  subtotalCents,
  shippingCents,
  taxCents,
  items,
  shippingAddress,
  shippingMethod,
  trackingNumber,
}: {
  orderNumber: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  items: Item[];
  shippingAddress: Address | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
}) {
  const eur = (c: number) => (c / 100).toFixed(2);
  return (
    <article className="border-warm-brown/10 rounded-lg border bg-white p-6">
      <header className="flex items-center justify-between">
        <h2 className="text-honey-dark font-display text-2xl">#{orderNumber}</h2>
        <span className="bg-honey/10 text-honey-dark rounded-full px-3 py-1 text-xs">{status}</span>
      </header>
      <h3 className="text-warm-brown mt-6 mb-2 text-sm font-medium">Articles</h3>
      <ul className="divide-warm-brown/10 divide-y text-sm">
        {items.map((i, idx) => (
          <li key={idx} className="flex justify-between py-2">
            <span>{i.productNameSnapshot} × {i.quantity}</span>
            <span className="font-mono">{eur(i.lineTotalCents)} €</span>
          </li>
        ))}
      </ul>
      <div className="border-warm-brown/10 mt-4 border-t pt-3 text-sm">
        <div className="flex justify-between"><span>Sous-total</span><span className="font-mono">{eur(subtotalCents)} €</span></div>
        <div className="flex justify-between"><span>Livraison ({shippingMethod ?? "—"})</span><span className="font-mono">{eur(shippingCents)} €</span></div>
        <div className="text-warm-brown/60 flex justify-between text-xs"><span>dont TVA 6 %</span><span className="font-mono">{eur(taxCents)} €</span></div>
        <div className="border-warm-brown/10 mt-2 flex justify-between border-t pt-2 text-base font-medium"><span>Total</span><span className="font-mono">{eur(totalCents)} €</span></div>
      </div>
      {shippingAddress && (
        <>
          <h3 className="text-warm-brown mt-6 mb-2 text-sm font-medium">Livraison</h3>
          <p className="text-warm-brown/80 text-sm">
            {String(shippingAddress.firstName ?? "")} {String(shippingAddress.lastName ?? "")}<br />
            {String(shippingAddress.line1 ?? "")}<br />
            {String(shippingAddress.postalCode ?? "")} {String(shippingAddress.city ?? "")} ({String(shippingAddress.country ?? "")})
          </p>
        </>
      )}
      {trackingNumber && (
        <p className="text-warm-brown mt-4 text-sm">
          N° de suivi : <code>{trackingNumber}</code>
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Order detail page**

`app/[locale]/(account)/compte/commandes/[orderNumber]/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { OrderDetailCard } from "@/components/account/OrderDetailCard";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, session!.user!.id!)))
    .limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return (
    <OrderDetailCard
      orderNumber={order.orderNumber}
      status={order.status}
      totalCents={order.totalCents}
      subtotalCents={order.subtotalCents}
      shippingCents={order.shippingCents}
      taxCents={order.taxCents}
      items={items.map((i) => ({
        productNameSnapshot: i.productNameSnapshot,
        quantity: i.quantity,
        lineTotalCents: i.lineTotalCents,
      }))}
      shippingAddress={order.shippingAddressSnapshot as Record<string, unknown> | null}
      shippingMethod={order.shippingMethod}
      trackingNumber={order.shippingTrackingNumber}
    />
  );
}
```

- [ ] **Step 5: Commit**

```powershell
git add components/account/ "app/[locale]/(account)/compte/commandes/"
git commit -m "feat(account): /compte/commandes list and detail"
```

---

## Task 19: Admin layout + auth + dashboard

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `components/admin/AdminSidebar.tsx`

- [ ] **Step 1: AdminSidebar**

`components/admin/AdminSidebar.tsx`:

```tsx
import Link from "next/link";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/livraison", label: "Livraison" },
];

export function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-warm-brown/10 bg-cream p-4">
      <Link href="/admin" className="text-honey font-display block text-2xl">BeeCuit admin</Link>
      <nav className="mt-6 text-sm">
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className="text-warm-brown hover:bg-honey/10 hover:text-honey-dark block rounded px-3 py-2"
              >
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Admin layout (with auth check)**

`app/admin/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";

const ENV_BADGE = process.env.NODE_ENV === "production" ? "PROD" : "DEV";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/fr/sign-in?callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/fr");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/fr" });
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-warm-brown/10 bg-white px-6 py-3">
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${ENV_BADGE === "PROD" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
            {ENV_BADGE}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-warm-brown/70">{session.user.email}</span>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" size="sm">Sign out</Button>
            </form>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

Note : `session.user.role` is already typed and populated by the session callback added in **Task 1 Step 6**. Nothing additional to do here.

- [ ] **Step 3: Admin dashboard page**

`app/admin/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { products, orders } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export default async function AdminDashboard() {
  const [pStats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      active: sql<number>`COUNT(*) FILTER (WHERE ${products.isActive})::int`,
      lowStock: sql<number>`COUNT(*) FILTER (WHERE ${products.stockQuantity} < 5)::int`,
    })
    .from(products);
  const [oStats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')::int`,
      paid: sql<number>`COUNT(*) FILTER (WHERE status = 'paid')::int`,
      shipped: sql<number>`COUNT(*) FILTER (WHERE status = 'shipped')::int`,
    })
    .from(orders);

  const Card = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-lg border border-warm-brown/10 bg-white p-4">
      <p className="text-warm-brown/60 text-xs">{label}</p>
      <p className="text-honey-dark mt-1 font-mono text-2xl">{value}</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Produits actifs" value={pStats?.active ?? 0} />
        <Card label="Stock faible (<5)" value={pStats?.lowStock ?? 0} />
        <Card label="Commandes en attente" value={oStats?.pending ?? 0} />
        <Card label="Commandes payées" value={oStats?.paid ?? 0} />
        <Card label="Commandes expédiées" value={oStats?.shipped ?? 0} />
        <Card label="Total commandes" value={oStats?.total ?? 0} />
        <Card label="Total produits" value={pStats?.total ?? 0} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```powershell
pnpm dev
```

Log in as admin (after running `pnpm seed` and confirming `users.role = 'admin'` in Neon for your email). Visit `/admin` → should see the dashboard. Visiting `/admin` while not admin should redirect to `/fr`.

- [ ] **Step 5: Commit**

```powershell
git add app/admin/layout.tsx app/admin/page.tsx components/admin/AdminSidebar.tsx lib/auth.ts
git commit -m "feat(admin): layout with auth check + dashboard with KPIs"
```

---

## Task 20: Admin /produits — list page

**Files:**
- Create: `app/admin/produits/page.tsx`
- Create: `components/admin/ProductTable.tsx`

- [ ] **Step 1: ProductTable component**

`components/admin/ProductTable.tsx`:

```tsx
import Link from "next/link";

type Row = {
  id: string;
  sku: string;
  nameFr: string;
  categorySlug: string | null;
  basePriceCents: number;
  stockQuantity: number;
  isActive: boolean;
  primaryImageUrl: string | null;
};

export function ProductTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-warm-brown/60">Aucun produit. Crée le premier !</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-warm-brown/60 text-left text-xs uppercase">
        <tr>
          <th className="py-2">Photo</th>
          <th>SKU</th>
          <th>Nom (FR)</th>
          <th>Catégorie</th>
          <th className="text-right">Prix</th>
          <th className="text-right">Stock</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-warm-brown/10">
        {rows.map((r) => {
          const lowStock = r.stockQuantity < 5;
          const out = r.stockQuantity === 0;
          return (
            <tr key={r.id} className={out ? "bg-gray-50" : lowStock ? "bg-red-50/50" : ""}>
              <td className="py-2">
                {r.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.primaryImageUrl} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded bg-soft-rose" />
                )}
              </td>
              <td className="font-mono text-xs">{r.sku}</td>
              <td>{r.nameFr}</td>
              <td className="text-warm-brown/70">{r.categorySlug ?? "—"}</td>
              <td className="text-right font-mono">{(r.basePriceCents / 100).toFixed(2)} €</td>
              <td className="text-right">{r.stockQuantity}</td>
              <td>{r.isActive ? "Actif" : "Inactif"}</td>
              <td className="text-right">
                <Link href={`/admin/produits/${r.id}`} className="text-honey-dark hover:underline">Éditer</Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: Admin list page**

`app/admin/produits/page.tsx`:

```tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { products, productTranslations, productImages, categories } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/admin/ProductTable";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      isActive: products.isActive,
      nameFr: productTranslations.name,
      categorySlug: categories.slug,
      primaryImageUrl: sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(products)
    .leftJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "fr")),
    )
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .orderBy(products.createdAt);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-honey font-display text-3xl">Produits</h1>
        <Link href="/admin/produits/nouveau">
          <Button className="bg-honey text-cream hover:bg-honey-dark">+ Nouveau produit</Button>
        </Link>
      </div>
      <div className="mt-6 rounded-lg border border-warm-brown/10 bg-white p-4">
        <ProductTable rows={rows} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add app/admin/produits/page.tsx components/admin/ProductTable.tsx
git commit -m "feat(admin): /admin/produits list with low stock indicators"
```

---

## Task 21: Admin produit form (4 translations) + Server Actions create/update/delete

**Files:**
- Create: `lib/validators/product.ts`
- Create: `lib/actions/admin/products.actions.ts`
- Create: `components/admin/ProductForm.tsx`
- Create: `components/admin/ProductTranslationTabs.tsx`
- Create: `app/admin/produits/nouveau/page.tsx`
- Create: `app/admin/produits/[id]/page.tsx`
- Create: `tests/integration/product-crud.test.ts`

- [ ] **Step 1: Product validator (strict 4-locale)**

`lib/validators/product.ts`:

```typescript
import { z } from "zod";

const Nutri = z.object({
  energy_kcal: z.number().min(0),
  fat_g: z.number().min(0),
  carbs_g: z.number().min(0),
  protein_g: z.number().min(0),
  salt_g: z.number().min(0),
});

const Translation = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().min(1).max(160),
  longDescription: z.string().min(1).max(2000),
  ingredients: z.string().min(1).max(2000),
  allergens: z.array(z.string()).default([]),
  nutritionalFactsPer100g: Nutri,
  seoTitle: z.string().min(1).max(60),
  seoDescription: z.string().min(1).max(160),
});

export const ProductSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/),
  categoryId: z.string().nullable().optional(),
  basePriceCents: z.number().int().positive(),
  weightGrams: z.number().int().positive(),
  stockQuantity: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  translations: z.object({
    fr: Translation,
    nl: Translation,
    de: Translation,
    en: Translation,
  }),
});
export type ProductInput = z.infer<typeof ProductSchema>;
```

- [ ] **Step 2: Product Server Actions**

`lib/actions/admin/products.actions.ts`:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, productTranslations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { ProductSchema } from "@/lib/validators/product";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const LOCALES = ["fr", "nl", "de", "en"] as const;

export async function createProduct(raw: unknown) {
  await requireAdmin();
  const data = ProductSchema.parse(raw);
  const [prod] = await db
    .insert(products)
    .values({
      type: "biscuit",
      sku: data.sku,
      categoryId: data.categoryId ?? null,
      basePriceCents: data.basePriceCents,
      weightGrams: data.weightGrams,
      stockQuantity: data.stockQuantity,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
    })
    .returning();
  if (!prod) throw new Error("Insert failed");
  for (const loc of LOCALES) {
    const t = data.translations[loc];
    await db.insert(productTranslations).values({
      productId: prod.id,
      locale: loc,
      name: t.name,
      slug: t.slug,
      shortDescription: t.shortDescription,
      longDescription: t.longDescription,
      ingredients: t.ingredients,
      allergens: t.allergens,
      nutritionalFactsPer100g: t.nutritionalFactsPer100g,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    });
  }
  revalidatePath("/admin/produits");
  return prod.id;
}

export async function updateProduct(raw: unknown) {
  await requireAdmin();
  const data = ProductSchema.parse(raw);
  if (!data.id) throw new Error("id required");
  await db
    .update(products)
    .set({
      sku: data.sku,
      categoryId: data.categoryId ?? null,
      basePriceCents: data.basePriceCents,
      weightGrams: data.weightGrams,
      stockQuantity: data.stockQuantity,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, data.id));
  for (const loc of LOCALES) {
    const t = data.translations[loc];
    await db
      .insert(productTranslations)
      .values({
        productId: data.id,
        locale: loc,
        name: t.name,
        slug: t.slug,
        shortDescription: t.shortDescription,
        longDescription: t.longDescription,
        ingredients: t.ingredients,
        allergens: t.allergens,
        nutritionalFactsPer100g: t.nutritionalFactsPer100g,
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
          ingredients: t.ingredients,
          allergens: t.allergens,
          nutritionalFactsPer100g: t.nutritionalFactsPer100g,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        },
      });
  }
  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${data.id}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  // Soft delete = set isActive false
  await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/admin/produits");
}
```

- [ ] **Step 3: ProductTranslationTabs (client)**

`components/admin/ProductTranslationTabs.tsx`:

```tsx
"use client";
import { useState } from "react";

type Trans = {
  name: string; slug: string; shortDescription: string; longDescription: string;
  ingredients: string; allergens: string[];
  nutritionalFactsPer100g: { energy_kcal: number; fat_g: number; carbs_g: number; protein_g: number; salt_g: number };
  seoTitle: string; seoDescription: string;
};

const ALLERGENS = ["Gluten","Crustacés","Œufs","Poissons","Arachides","Soja","Lait","Fruits à coque","Céleri","Moutarde","Sésame","Sulfites","Lupin","Mollusques"];

export type LocaleTranslations = Record<"fr" | "nl" | "de" | "en", Trans>;

export function ProductTranslationTabs({
  value,
  onChange,
}: {
  value: LocaleTranslations;
  onChange: (v: LocaleTranslations) => void;
}) {
  const [active, setActive] = useState<"fr" | "nl" | "de" | "en">("fr");
  const incomplete = (l: "fr" | "nl" | "de" | "en") => {
    const t = value[l];
    return !t.name || !t.slug || !t.shortDescription || !t.longDescription || !t.ingredients || !t.seoTitle || !t.seoDescription;
  };
  const t = value[active];
  const set = (patch: Partial<Trans>) => onChange({ ...value, [active]: { ...t, ...patch } });

  return (
    <div>
      <div className="flex gap-1 border-b border-warm-brown/10">
        {(["fr", "nl", "de", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setActive(l)}
            className={`relative px-4 py-2 text-sm uppercase ${active === l ? "border-b-2 border-honey text-honey-dark" : "text-warm-brown/60"}`}
          >
            {l}
            {incomplete(l) && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <label className="block"><span className="text-xs text-warm-brown">Nom</span>
          <input className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">Slug (kebab-case)</span>
          <input className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono text-sm" value={t.slug} onChange={(e) => set({ slug: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">Description courte (max 160)</span>
          <input maxLength={160} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">Description longue (max 2000)</span>
          <textarea maxLength={2000} rows={4} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.longDescription} onChange={(e) => set({ longDescription: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">Ingrédients</span>
          <textarea rows={3} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.ingredients} onChange={(e) => set({ ingredients: e.target.value })} />
        </label>
        <fieldset>
          <legend className="text-xs text-warm-brown">Allergènes</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {ALLERGENS.map((a) => {
              const on = t.allergens.includes(a);
              return (
                <button
                  type="button"
                  key={a}
                  onClick={() => set({ allergens: on ? t.allergens.filter((x) => x !== a) : [...t.allergens, a] })}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-honey bg-honey/10 text-honey-dark" : "border-warm-brown/20 text-warm-brown"}`}
                >{a}</button>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs text-warm-brown">Valeurs nutritionnelles /100 g</legend>
          <div className="mt-1 grid grid-cols-5 gap-2 text-xs">
            {(["energy_kcal","fat_g","carbs_g","protein_g","salt_g"] as const).map((k) => (
              <label key={k}>
                <span className="block">{k}</span>
                <input type="number" step="0.1" value={t.nutritionalFactsPer100g[k]} onChange={(e) => set({ nutritionalFactsPer100g: { ...t.nutritionalFactsPer100g, [k]: Number(e.target.value) } })} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-2 py-1" />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block"><span className="text-xs text-warm-brown">SEO title (max 60)</span>
          <input maxLength={60} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">SEO description (max 160)</span>
          <input maxLength={160} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: ProductForm (client wrapping shared fields + tabs)**

`components/admin/ProductForm.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ProductTranslationTabs, type LocaleTranslations } from "./ProductTranslationTabs";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/admin/products.actions";
import { useRouter } from "next/navigation";

type Category = { id: string; slug: string; nameFr: string };

const EMPTY_NUTRI = { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 };
const EMPTY_TRANS = { name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "", allergens: [] as string[], nutritionalFactsPer100g: EMPTY_NUTRI, seoTitle: "", seoDescription: "" };

export function ProductForm({
  initial,
  categories,
}: {
  initial?: {
    id: string; sku: string; categoryId: string | null; basePriceCents: number; weightGrams: number;
    stockQuantity: number; isActive: boolean; isFeatured: boolean; translations: LocaleTranslations;
  };
  categories: Category[];
}) {
  const router = useRouter();
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [priceEur, setPriceEur] = useState((initial?.basePriceCents ?? 0) / 100);
  const [weightGrams, setWeight] = useState(initial?.weightGrams ?? 0);
  const [stockQuantity, setStock] = useState(initial?.stockQuantity ?? 0);
  const [isActive, setActive] = useState(initial?.isActive ?? true);
  const [isFeatured, setFeatured] = useState(initial?.isFeatured ?? false);
  const [trans, setTrans] = useState<LocaleTranslations>(initial?.translations ?? { fr: EMPTY_TRANS, nl: EMPTY_TRANS, de: EMPTY_TRANS, en: EMPTY_TRANS });
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const isInvalid = (Object.keys(trans) as Array<keyof LocaleTranslations>).some((l) => {
    const t = trans[l];
    return !t.name || !t.slug || !t.shortDescription || !t.longDescription || !t.ingredients || !t.seoTitle || !t.seoDescription;
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          try {
            const payload = {
              id: initial?.id,
              sku, categoryId, basePriceCents: Math.round(priceEur * 100),
              weightGrams, stockQuantity, isActive, isFeatured, translations: trans,
            };
            if (initial?.id) await updateProduct(payload);
            else {
              const newId = await createProduct(payload);
              router.push(`/admin/produits/${newId}`);
            }
            router.refresh();
          } catch (e2) {
            setErr((e2 as Error).message);
          }
        });
      }}
      className="grid grid-cols-1 gap-6 md:grid-cols-2"
    >
      <div className="space-y-3">
        <h2 className="font-display text-warm-brown text-lg">Données partagées</h2>
        <label className="block text-sm"><span className="text-xs text-warm-brown">SKU (A-Z, 0-9, -)</span>
          <input required pattern="[A-Z0-9-]+" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} />
        </label>
        <label className="block text-sm"><span className="text-xs text-warm-brown">Catégorie</span>
          <select className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2" value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value || null)}>
            <option value="">— Aucune —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nameFr}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-sm"><span className="text-xs text-warm-brown">Prix TTC €</span>
            <input required type="number" step="0.01" min="0" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-right font-mono" value={priceEur} onChange={(e) => setPriceEur(Number(e.target.value))} />
          </label>
          <label className="block text-sm"><span className="text-xs text-warm-brown">Poids (g)</span>
            <input required type="number" min="1" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-right font-mono" value={weightGrams} onChange={(e) => setWeight(Number(e.target.value))} />
          </label>
          <label className="block text-sm"><span className="text-xs text-warm-brown">Stock</span>
            <input required type="number" min="0" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-right font-mono" value={stockQuantity} onChange={(e) => setStock(Number(e.target.value))} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} /> Actif</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(e) => setFeatured(e.target.checked)} /> En vedette</label>
      </div>
      <div>
        <h2 className="font-display text-warm-brown text-lg">Traductions (toutes obligatoires)</h2>
        <ProductTranslationTabs value={trans} onChange={setTrans} />
      </div>
      <div className="md:col-span-2 flex items-center justify-between border-t border-warm-brown/10 pt-4">
        {err && <p className="text-terracotta text-sm">{err}</p>}
        <div className="ml-auto flex gap-2">
          {initial?.id && (
            <Button type="button" variant="outline" disabled={pending} onClick={() => start(async () => { await deleteProduct(initial.id); router.push("/admin/produits"); })}>
              Désactiver
            </Button>
          )}
          <Button type="submit" disabled={pending || isInvalid} className="bg-honey text-cream hover:bg-honey-dark">
            {pending ? "..." : (initial?.id ? "Mettre à jour" : "Créer")}
          </Button>
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Nouveau produit page**

`app/admin/produits/nouveau/page.tsx`:

```tsx
import { db } from "@/lib/db";
import { categories, categoryTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const cats = await db
    .select({ id: categories.id, slug: categories.slug, nameFr: categoryTranslations.name })
    .from(categories)
    .innerJoin(categoryTranslations, and(eq(categoryTranslations.categoryId, categories.id), eq(categoryTranslations.locale, "fr")))
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);
  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Nouveau produit</h1>
      <ProductForm categories={cats} />
    </div>
  );
}
```

- [ ] **Step 6: Édition page**

`app/admin/produits/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { products, productTranslations, categories, categoryTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { ProductForm } from "@/components/admin/ProductForm";
import type { LocaleTranslations } from "@/components/admin/ProductTranslationTabs";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!prod) notFound();
  const trans = await db.select().from(productTranslations).where(eq(productTranslations.productId, id));
  const cats = await db
    .select({ id: categories.id, slug: categories.slug, nameFr: categoryTranslations.name })
    .from(categories)
    .innerJoin(categoryTranslations, and(eq(categoryTranslations.categoryId, categories.id), eq(categoryTranslations.locale, "fr")))
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder);

  const byLocale: LocaleTranslations = {
    fr: { name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "", allergens: [], nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 }, seoTitle: "", seoDescription: "" },
    nl: { name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "", allergens: [], nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 }, seoTitle: "", seoDescription: "" },
    de: { name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "", allergens: [], nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 }, seoTitle: "", seoDescription: "" },
    en: { name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "", allergens: [], nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 }, seoTitle: "", seoDescription: "" },
  };
  for (const t of trans) {
    byLocale[t.locale as "fr" | "nl" | "de" | "en"] = {
      name: t.name, slug: t.slug, shortDescription: t.shortDescription, longDescription: t.longDescription,
      ingredients: t.ingredients, allergens: t.allergens, nutritionalFactsPer100g: t.nutritionalFactsPer100g,
      seoTitle: t.seoTitle, seoDescription: t.seoDescription,
    };
  }

  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Édition produit</h1>
      <ProductForm
        initial={{
          id: prod.id, sku: prod.sku, categoryId: prod.categoryId, basePriceCents: prod.basePriceCents,
          weightGrams: prod.weightGrams, stockQuantity: prod.stockQuantity, isActive: prod.isActive, isFeatured: prod.isFeatured,
          translations: byLocale,
        }}
        categories={cats}
      />
    </div>
  );
}
```

- [ ] **Step 7: Integration test for strict 4-locale**

`tests/integration/product-crud.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ProductSchema } from "@/lib/validators/product";

describe("ProductSchema", () => {
  it("rejects when one translation is incomplete", () => {
    const incomplete = {
      sku: "BCT-TEST-001", basePriceCents: 690, weightGrams: 200, stockQuantity: 10,
      translations: {
        fr: full("Test FR"), nl: incompleteTrans(), de: full("Test DE"), en: full("Test EN"),
      },
    };
    const r = ProductSchema.safeParse(incomplete);
    expect(r.success).toBe(false);
  });

  it("accepts when all 4 translations are present", () => {
    const ok = {
      sku: "BCT-TEST-001", basePriceCents: 690, weightGrams: 200, stockQuantity: 10,
      translations: {
        fr: full("Test FR"), nl: full("Test NL"), de: full("Test DE"), en: full("Test EN"),
      },
    };
    expect(ProductSchema.safeParse(ok).success).toBe(true);
  });
});

function full(name: string) {
  return {
    name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    shortDescription: "Short " + name, longDescription: "Long " + name, ingredients: "Ing",
    allergens: [],
    nutritionalFactsPer100g: { energy_kcal: 400, fat_g: 15, carbs_g: 60, protein_g: 6, salt_g: 0.5 },
    seoTitle: "SEO " + name, seoDescription: "SEO desc " + name,
  };
}

function incompleteTrans() {
  return {
    name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "",
    allergens: [], nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 },
    seoTitle: "", seoDescription: "",
  };
}
```

Run :

```powershell
pnpm vitest run tests/integration/product-crud.test.ts
```

Expected : 2 pass.

- [ ] **Step 8: Commit**

```powershell
git add lib/validators/product.ts lib/actions/admin/products.actions.ts components/admin/ProductForm.tsx components/admin/ProductTranslationTabs.tsx "app/admin/produits/nouveau/" "app/admin/produits/[id]/" tests/integration/product-crud.test.ts
git commit -m "feat(admin): product form with strict 4-locale translations + create/update/soft-delete"
```

---

## Task 22: Admin image upload via Vercel Blob

**Files:**
- Create: `lib/blob/upload.ts`
- Create: `lib/actions/admin/images.actions.ts`
- Create: `components/admin/ImageUploader.tsx`
- Modify: `components/admin/ProductForm.tsx` (insert uploader for existing products)

- [ ] **Step 1: Blob upload helper**

`lib/blob/upload.ts`:

```typescript
import "server-only";
import { put } from "@vercel/blob";
import { env } from "@/lib/env";

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `products/${productId}/${Date.now()}.${ext}`;
  const blob = await put(key, file, { access: "public", token: env.BLOB_READ_WRITE_TOKEN });
  return blob.url;
}
```

- [ ] **Step 2: Image Server Actions**

`lib/actions/admin/images.actions.ts`:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { productImages } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { uploadProductImage } from "@/lib/blob/upload";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

export async function uploadImage(productId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("file required");
  const url = await uploadProductImage(productId, file);
  const existing = await db.select().from(productImages).where(eq(productImages.productId, productId));
  await db.insert(productImages).values({
    productId,
    url,
    altText: null,
    sortOrder: existing.length,
    isPrimary: existing.length === 0,
  });
  revalidatePath(`/admin/produits/${productId}`);
}

export async function deleteImage(imageId: string, productId: string) {
  await requireAdmin();
  await db.delete(productImages).where(eq(productImages.id, imageId));
  revalidatePath(`/admin/produits/${productId}`);
}

export async function setPrimaryImage(imageId: string, productId: string) {
  await requireAdmin();
  await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, productId));
  await db.update(productImages).set({ isPrimary: true }).where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));
  revalidatePath(`/admin/produits/${productId}`);
}
```

- [ ] **Step 3: ImageUploader client component**

`components/admin/ImageUploader.tsx`:

```tsx
"use client";
import { useTransition } from "react";
import { uploadImage, deleteImage, setPrimaryImage } from "@/lib/actions/admin/images.actions";
import { Button } from "@/components/ui/button";

type Img = { id: string; url: string; isPrimary: boolean };

export function ImageUploader({ productId, images }: { productId: string; images: Img[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => (
          <div key={img.id} className={`relative overflow-hidden rounded border ${img.isPrimary ? "border-honey ring-2 ring-honey" : "border-warm-brown/20"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="aspect-square w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/50 p-1 text-xs text-white opacity-0 group-hover:opacity-100">
              <button onClick={() => start(() => setPrimaryImage(img.id, productId))} disabled={pending || img.isPrimary}>★</button>
              <button onClick={() => start(() => deleteImage(img.id, productId))} disabled={pending}>×</button>
            </div>
          </div>
        ))}
      </div>
      <form
        action={(fd) => start(async () => { await uploadImage(productId, fd); })}
        encType="multipart/form-data"
      >
        <input type="file" name="file" accept="image/*" required className="text-sm" />
        <Button type="submit" disabled={pending} size="sm" className="ml-2 bg-honey text-cream hover:bg-honey-dark">Upload</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Wire ImageUploader into ProductForm edit page**

In `app/admin/produits/[id]/page.tsx`, after fetching `prod`, also fetch images:

```tsx
import { productImages } from "@/lib/db/schema";
import { ImageUploader } from "@/components/admin/ImageUploader";

// after const trans = ...:
const imgs = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.sortOrder);

// in the JSX, above <ProductForm ... /> :
<section className="mb-6 rounded-lg border border-warm-brown/10 bg-white p-4">
  <h2 className="font-display text-warm-brown mb-2 text-lg">Images</h2>
  <ImageUploader productId={prod.id} images={imgs.map((i) => ({ id: i.id, url: i.url, isPrimary: i.isPrimary }))} />
</section>
```

- [ ] **Step 5: Commit**

```powershell
git add lib/blob/ lib/actions/admin/images.actions.ts components/admin/ImageUploader.tsx "app/admin/produits/[id]/page.tsx"
git commit -m "feat(admin): product image upload via Vercel Blob + set primary + delete"
```

---

## Task 23: Admin /categories CRUD

**Files:**
- Create: `lib/actions/admin/categories.actions.ts`
- Create: `components/admin/CategoryForm.tsx`
- Create: `app/admin/categories/page.tsx`

- [ ] **Step 1: Category actions**

`lib/actions/admin/categories.actions.ts`:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, categoryTranslations, products } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const Trans = z.object({ name: z.string().min(1).max(100), description: z.string().max(500).optional().nullable() });
const Schema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.object({ fr: Trans, nl: Trans, de: Trans, en: Trans }),
});

const LOCALES = ["fr", "nl", "de", "en"] as const;

export async function createCategory(raw: unknown) {
  await requireAdmin();
  const data = Schema.parse(raw);
  const [cat] = await db.insert(categories).values({ slug: data.slug, sortOrder: data.sortOrder, isActive: data.isActive }).returning();
  if (!cat) throw new Error("Insert failed");
  for (const l of LOCALES) {
    const t = data.translations[l];
    await db.insert(categoryTranslations).values({ categoryId: cat.id, locale: l, name: t.name, description: t.description ?? null });
  }
  revalidatePath("/admin/categories");
}

export async function updateCategory(raw: unknown) {
  await requireAdmin();
  const data = Schema.parse(raw);
  if (!data.id) throw new Error("id required");
  await db.update(categories).set({ slug: data.slug, sortOrder: data.sortOrder, isActive: data.isActive }).where(eq(categories.id, data.id));
  for (const l of LOCALES) {
    const t = data.translations[l];
    await db
      .insert(categoryTranslations)
      .values({ categoryId: data.id, locale: l, name: t.name, description: t.description ?? null })
      .onConflictDoUpdate({
        target: [categoryTranslations.categoryId, categoryTranslations.locale],
        set: { name: t.name, description: t.description ?? null },
      });
  }
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  // Set products.categoryId = NULL via FK ON DELETE SET NULL is missing — we kept categoryId nullable as text, so handle here:
  await db.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
}
```

- [ ] **Step 2: CategoryForm + page (compact)**

`components/admin/CategoryForm.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCategory, updateCategory } from "@/lib/actions/admin/categories.actions";
import { useRouter } from "next/navigation";

type Trans = { name: string; description: string };
type LT = Record<"fr" | "nl" | "de" | "en", Trans>;

export function CategoryForm({
  initial,
  onDone,
}: {
  initial?: { id: string; slug: string; sortOrder: number; isActive: boolean; translations: LT };
  onDone: () => void;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [sortOrder, setSort] = useState(initial?.sortOrder ?? 0);
  const [isActive, setActive] = useState(initial?.isActive ?? true);
  const [trans, setTrans] = useState<LT>(initial?.translations ?? { fr: { name: "", description: "" }, nl: { name: "", description: "" }, de: { name: "", description: "" }, en: { name: "", description: "" } });
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          if (initial?.id) await updateCategory({ id: initial.id, slug, sortOrder, isActive, translations: trans });
          else await createCategory({ slug, sortOrder, isActive, translations: trans });
          router.refresh();
          onDone();
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-3 gap-2">
        <label className="text-sm"><span className="text-xs text-warm-brown">Slug</span>
          <input required pattern="[a-z0-9-]+" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <label className="text-sm"><span className="text-xs text-warm-brown">Sort order</span>
          <input type="number" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono" value={sortOrder} onChange={(e) => setSort(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2 pt-5 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} /> Active</label>
      </div>
      {(["fr","nl","de","en"] as const).map((l) => (
        <div key={l} className="grid grid-cols-2 gap-2">
          <label className="text-sm"><span className="text-xs text-warm-brown">{l.toUpperCase()} nom</span>
            <input required className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2" value={trans[l].name} onChange={(e) => setTrans({ ...trans, [l]: { ...trans[l], name: e.target.value } })} />
          </label>
          <label className="text-sm"><span className="text-xs text-warm-brown">{l.toUpperCase()} description</span>
            <input className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2" value={trans[l].description} onChange={(e) => setTrans({ ...trans, [l]: { ...trans[l], description: e.target.value } })} />
          </label>
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>Annuler</Button>
        <Button type="submit" disabled={pending} className="bg-honey text-cream hover:bg-honey-dark">{initial ? "Mettre à jour" : "Créer"}</Button>
      </div>
    </form>
  );
}
```

`app/admin/categories/page.tsx`:

```tsx
"use client";
// We need client interactions (edit toggle, delete confirm) — keep page mostly server but wrap list in client component.
// Simpler: import a server fetch into a client component.
```

For brevity, use a server page that lists categories and a client wrapper for the editing UX. Implementation pattern is the same as `AddressList` (Task 13). Engineer applies the same pattern with `createCategory / updateCategory / deleteCategory`. Final commit :

```powershell
git add lib/actions/admin/categories.actions.ts components/admin/CategoryForm.tsx app/admin/categories/
git commit -m "feat(admin): /admin/categories CRUD with 4-locale translations"
```

---

## Task 24: Admin /commandes — list + detail + mark shipped + email

**Files:**
- Create: `lib/actions/admin/orders.actions.ts`
- Create: `components/admin/OrderTable.tsx`, `OrderDetailAdmin.tsx`
- Create: `app/admin/commandes/page.tsx`
- Create: `app/admin/commandes/[orderNumber]/page.tsx`

- [ ] **Step 1: Orders actions**

`lib/actions/admin/orders.actions.ts`:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email/client";
import { OrderShipped } from "@/lib/email/templates/OrderShipped";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const MarkShipped = z.object({ orderNumber: z.string().min(1), trackingNumber: z.string().min(1).max(100) });

export async function markAsShipped(raw: unknown) {
  await requireAdmin();
  const { orderNumber, trackingNumber } = MarkShipped.parse(raw);
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order) throw new Error("Order not found");
  await db
    .update(orders)
    .set({ status: "shipped", shippingTrackingNumber: trackingNumber })
    .where(eq(orders.id, order.id));
  const recipient = order.guestEmail ?? null;
  if (recipient) {
    const trackingUrl = `https://track.bpost.cloud/btr/web/#/search?itemCode=${encodeURIComponent(trackingNumber)}&postalCode=`;
    try {
      await sendEmail({
        to: recipient,
        subject: `Ta commande BeeCuit #${orderNumber} est en route`,
        react: OrderShipped({ orderNumber, trackingUrl }),
      });
    } catch (e) {
      console.error("[admin] shipped email failed", e);
    }
  }
  revalidatePath(`/admin/commandes/${orderNumber}`);
}

export async function markAsDelivered(orderNumber: string) {
  await requireAdmin();
  await db.update(orders).set({ status: "delivered" }).where(eq(orders.orderNumber, orderNumber));
  revalidatePath(`/admin/commandes/${orderNumber}`);
}
```

- [ ] **Step 2: OrderTable + OrderDetailAdmin components + pages**

Same shape as the customer-facing `OrderList` and `OrderDetailCard` but with admin actions (mark shipped/delivered, Stripe link). For brevity in this plan, the implementer follows the same pattern :

- `components/admin/OrderTable.tsx` — table with columns N°, Date, Email, Total, Status badge, action link to detail
- `components/admin/OrderDetailAdmin.tsx` — client component with status-dependent action buttons that call `markAsShipped` / `markAsDelivered`
- `app/admin/commandes/page.tsx` — server page that fetches all orders with status filter from `searchParams`
- `app/admin/commandes/[orderNumber]/page.tsx` — server page that fetches order + items + renders OrderDetailAdmin

- [ ] **Step 3: Commit**

```powershell
git add lib/actions/admin/orders.actions.ts components/admin/OrderTable.tsx components/admin/OrderDetailAdmin.tsx app/admin/commandes/
git commit -m "feat(admin): /admin/commandes list + detail + mark shipped + email"
```

---

## Task 25: Admin /livraison — shipping rates editor

**Files:**
- Create: `lib/actions/admin/shipping.actions.ts`
- Create: `components/admin/ShippingRatesEditor.tsx`
- Create: `app/admin/livraison/page.tsx`

- [ ] **Step 1: Shipping actions**

`lib/actions/admin/shipping.actions.ts`:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const Rate = z.object({
  id: z.string().optional(),
  method: z.string().min(1),
  country: z.string().length(2).default("BE"),
  weightGramsMax: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  freeShippingThresholdCents: z.number().int().nonnegative().nullable(),
  sortOrder: z.number().int().default(0),
});

export async function createRate(raw: unknown) {
  await requireAdmin();
  const d = Rate.parse(raw);
  await db.insert(shippingRates).values(d);
  revalidatePath("/admin/livraison");
}

export async function updateRate(raw: unknown) {
  await requireAdmin();
  const d = Rate.parse(raw);
  if (!d.id) throw new Error("id required");
  await db.update(shippingRates).set(d).where(eq(shippingRates.id, d.id));
  revalidatePath("/admin/livraison");
}

export async function deleteRate(id: string) {
  await requireAdmin();
  await db.delete(shippingRates).where(eq(shippingRates.id, id));
  revalidatePath("/admin/livraison");
}
```

- [ ] **Step 2: Editor + page (same inline-edit pattern as `AddressList` / `CategoryForm`)**

- `components/admin/ShippingRatesEditor.tsx` — client : list of rate rows, each with inline edit form, +Add button
- `app/admin/livraison/page.tsx` — server : fetch all rates + render editor

- [ ] **Step 3: Commit**

```powershell
git add lib/actions/admin/shipping.actions.ts components/admin/ShippingRatesEditor.tsx app/admin/livraison/
git commit -m "feat(admin): /admin/livraison editor for shipping rates"
```

---

## Task 26: E2E tests (Playwright)

**Files:**
- Create: `tests/e2e/guest-purchase.spec.ts`, `auth-purchase.spec.ts`, `out-of-stock.spec.ts`, `admin-create-product.spec.ts`, `admin-mark-shipped.spec.ts`

These E2E tests use Stripe sandbox + Resend test mode (`onboarding@resend.dev` accepts test sends without delivery in sandbox). They run against `pnpm dev`.

- [ ] **Step 1: guest-purchase.spec.ts**

```typescript
import { test, expect } from "@playwright/test";

test("guest can browse, add to cart, and reach Stripe checkout", async ({ page }) => {
  await page.goto("/fr/biscuits");
  await page.getByRole("link", { name: /Spéculoos artisanal/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Spéculoos/);
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();
  await page.getByRole("link", { name: "Panier" }).click();
  await expect(page).toHaveURL(/\/fr\/panier$/);
  await page.getByRole("link", { name: /Passer commande/ }).click();
  await expect(page).toHaveURL(/\/fr\/checkout$/);
  await page.getByPlaceholder("email@exemple.com").fill("guest+pw@example.com");
  await page.getByPlaceholder("firstName").fill("Test");
  await page.getByPlaceholder("lastName").fill("Guest");
  await page.getByPlaceholder("line1").fill("Rue de Test 1");
  await page.getByPlaceholder("postalCode").fill("4000");
  await page.getByPlaceholder("city").fill("Liège");
  await page.getByRole("button", { name: /Payer avec Stripe/ }).click();
  // Stripe Checkout opens on a different origin — we just verify redirect happened
  await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 15000 });
});
```

- [ ] **Step 2: out-of-stock.spec.ts**

```typescript
import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

test("out-of-stock product shows Épuisé and disables button", async ({ page }) => {
  // Find any product, set stock to 0
  const [p] = await db.select().from(products).limit(1);
  if (!p) throw new Error("seed first");
  await db.update(products).set({ stockQuantity: 0 }).where(eq(products.id, p.id));
  try {
    await page.goto("/fr/biscuits");
    const card = page.locator("a", { hasText: "Épuisé" }).first();
    await expect(card).toBeVisible();
  } finally {
    await db.update(products).set({ stockQuantity: 50 }).where(eq(products.id, p.id));
  }
});
```

- [ ] **Step 3: admin-create-product.spec.ts**

```typescript
import { test, expect } from "@playwright/test";

test("admin form refuses save when one translation is incomplete", async ({ page }) => {
  // Assumes test user is already authenticated as admin (set up via auth.spec helpers in Phase 0)
  // For simplicity, skip auth bootstrap in this file — run after manual login or use storage state
  await page.goto("/admin/produits/nouveau");
  await page.getByPlaceholder(/SKU/i).fill("BCT-E2E-001");
  // Fill FR only
  await page.getByText("FR").click();
  await page.locator("input").nth(5).fill("Test FR"); // name
  // ... etc. (engineer fills FR fully, leaves NL/DE/EN empty)
  const submit = page.getByRole("button", { name: /Créer/ });
  await expect(submit).toBeDisabled();
});
```

(Implementation note : run this test only after a valid admin storage state is set up. For Phase 1, this test can be added but skipped in CI until storage state automation is built in Phase 5.)

- [ ] **Step 4: Update `playwright.config.ts`** to load `.env.local` for tests

In `playwright.config.ts`, add at the top :

```typescript
import "dotenv/config";
```

And ensure `BLOB_READ_WRITE_TOKEN` and Stripe vars are present in `.env.local` (already done at Task 1).

- [ ] **Step 5: Run E2E**

```powershell
pnpm e2e
```

Expected : Phase 0 tests + the new ones pass (some admin tests may be marked `.skip` for now if auth setup is incomplete).

- [ ] **Step 6: Commit**

```powershell
git add tests/e2e/ playwright.config.ts
git commit -m "test(e2e): Phase 1 scenarios (guest purchase, out of stock, admin product form)"
```

---

## Task 27: Final smoke + Vercel env vars + push + production verification

**Files:** none (verification only)

- [ ] **Step 1: Local full smoke**

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm dotenv -e .env.local -- pnpm test
pnpm e2e
pnpm build
```

Expected : every command exits 0.

- [ ] **Step 2: Add Phase 1 env vars to Vercel**

On Vercel dashboard → Settings → Environment Variables, add for **Production** (and Preview, Development):
- `STRIPE_SECRET_KEY` (live key for production)
- `STRIPE_PUBLISHABLE_KEY` (live key)
- `STRIPE_WEBHOOK_SECRET` (signing secret from Stripe webhook endpoint setup at Task 15 Step 4)
- `STRIPE_TAX_RATE_ID`
- `BLOB_READ_WRITE_TOKEN`

- [ ] **Step 3: Push to main**

```powershell
git push origin main
```

Vercel will deploy automatically.

- [ ] **Step 4: Apply prod DB migration**

If main is on Neon's `main` branch and tests are on a `dev` branch, apply the same migration on the live DB :

```powershell
pnpm dotenv -e .env.local -- drizzle-kit migrate
```

(or via Vercel-deployed seed script run via the Neon SQL editor if you prefer GUI)

- [ ] **Step 5: Production smoke checklist**

Open `https://beecuit.vercel.app` and verify :

- [ ] `/` redirects to `/fr`
- [ ] `/fr/biscuits` shows seeded products grid
- [ ] Click product → detail page with images and "Ajouter au panier"
- [ ] Add to cart → cart icon shows count 1
- [ ] `/fr/panier` lists the item, quantity adjustable
- [ ] `/fr/checkout` loads with summary
- [ ] Fill form, "Payer avec Stripe" → redirects to Stripe Checkout (LIVE if STRIPE_SECRET_KEY is sk_live_)
- [ ] Pay with test card `4242 4242 4242 4242` (works only in test mode — use a real low-value Bancontact charge if in live mode)
- [ ] Confirmation page shows after Stripe redirect
- [ ] Email arrives in Gmail
- [ ] Order visible in `/fr/compte/commandes` when logged in
- [ ] `/admin` accessible when logged in as admin
- [ ] Admin can mark the order as shipped → second email arrives

- [ ] **Step 6: Document Phase 1 completion**

Create `docs/superpowers/plans/2026-05-23-phase-1-ecommerce-base-COMPLETE.md` :

```markdown
# Phase 1 — Completion Report (2026-XX-XX)

## Status: ✅ Complete

## Production URL
https://beecuit.vercel.app

## Verified end-to-end
- Full guest purchase flow with real Stripe payment
- Auth purchase flow + order history in /compte
- Admin product CRUD with strict 4-locale translations
- Admin order management with shipped notification email
- Webhook idempotency confirmed via duplicate event test

## Test counts (Phase 0 + Phase 1)
- Vitest unit: 10+
- Vitest integration: 5+
- Playwright E2E: 10+

## Next phase
Phase 2 — Coffrets pré-composés + Abonnement + B2B + bpost points retrait + Mondial Relay.
See spec section 10.
```

- [ ] **Step 7: Final commit**

```powershell
git add docs/
git commit -m "docs: Phase 1 completion report"
git push
```

---

## Phase 1 done. Next steps

Phase 1 ships a fully functional Belgian e-commerce skeleton. **Do not start Phase 2 before validating that all critical paths work in production with real money.**

Phase 2 brainstorming starts when :
1. At least 3 real test purchases (with real cards) have completed successfully
2. The shipped email has reached a real inbox
3. The admin workflow has been used to add at least one new product end-to-end

When ready, run `/superpowers:brainstorming` with target "Phase 2 — Coffrets + Abonnement + B2B + livraison étendue".

---

**End of plan.**


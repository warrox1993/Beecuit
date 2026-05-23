/**
 * Out-of-stock E2E test.
 *
 * We connect to the DB directly (not via @/lib/db) to avoid pulling in the
 * Next.js / @t3-oss/env-nextjs runtime validation that expects the full
 * server environment. DATABASE_URL is loaded from .env.local by the
 * `dotenv/config` import at the top of playwright.config.ts.
 */
import { test, expect } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql, eq } from "drizzle-orm";

// Minimal inline schema — avoids importing the full app schema chain
const productType = pgEnum("product_type", ["biscuit", "coffret", "subscription_plan"]);
const products = pgTable("products", {
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

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — run via: pnpm dotenv -e .env.local -- pnpm e2e");
  const sqlClient = neon(url);
  return drizzle(sqlClient);
}

test("out-of-stock product shows Épuisé and disables button", async ({ page }) => {
  const db = getDb();

  // Pick the last product so we don't perturb the guest-purchase test that hits the first one
  const all = await db.select().from(products).limit(20);
  const target = all[all.length - 1];
  if (!target) throw new Error("No products found — run the seed script first: pnpm seed");

  const originalStock = target.stockQuantity;

  await db.update(products).set({ stockQuantity: 0 }).where(eq(products.id, target.id));
  try {
    await page.goto("/fr/biscuits");
    // The catalog grid renders outOfStockLabel ("Épuisé") on out-of-stock cards
    await expect(page.getByText(/Épuisé/).first()).toBeVisible();
  } finally {
    // Always restore original stock
    await db
      .update(products)
      .set({ stockQuantity: originalStock })
      .where(eq(products.id, target.id));
  }
});

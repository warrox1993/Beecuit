import { pgTable, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const productType = pgEnum("product_type", [
  "biscuit",
  "coffret",
  "subscription_plan",
  "gift_card",
]);

export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  type: productType("type").notNull(),
  sku: text("sku").notNull().unique(),
  categoryId: text("category_id"),
  basePriceCents: integer("base_price_cents").notNull(),
  weightGrams: integer("weight_grams").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  discountPercent: integer("discount_percent"), // NULL for biscuits, 0-99 for coffrets (CHECK in SQL)
  model3dUrl: text("model_3d_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

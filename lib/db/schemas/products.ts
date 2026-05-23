import { pgTable, text, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const productType = pgEnum("product_type", ["biscuit", "coffret", "subscription_plan"]);

export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  type: productType("type").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").notNull().unique(),
  basePriceCents: integer("base_price_cents").notNull(),
  weightGrams: integer("weight_grams").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  stockQuantity: integer("stock_quantity"),
  thumbnailUrl: text("thumbnail_url"),
  model3dUrl: text("model_3d_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

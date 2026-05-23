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

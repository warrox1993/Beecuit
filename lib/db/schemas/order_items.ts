import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orders } from "./orders";
import { products } from "./products";

export const orderItems = pgTable("order_items", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  productSkuSnapshot: text("product_sku_snapshot").notNull(),
  unitPriceCentsSnapshot: integer("unit_price_cents_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
});

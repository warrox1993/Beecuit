import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const shippingRates = pgTable("shipping_rates", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  method: text("method").notNull(),
  country: text("country").notNull().default("BE"),
  weightGramsMax: integer("weight_grams_max").notNull(),
  priceCents: integer("price_cents").notNull(),
  freeShippingThresholdCents: integer("free_shipping_threshold_cents"),
  sortOrder: integer("sort_order").notNull().default(0),
});

import { pgTable, text, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./products";

export const coffretContents = pgTable(
  "coffret_contents",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
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

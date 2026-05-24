import { pgTable, text, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { subscriptionBoxes } from "./subscription_boxes";
import { products } from "./products";

export const subscriptionBoxItems = pgTable(
  "subscription_box_items",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    boxId: text("box_id")
      .notNull()
      .references(() => subscriptionBoxes.id, { onDelete: "cascade" }),
    biscuitId: text("biscuit_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
  },
  (t) => ({
    uniqueBoxBiscuit: uniqueIndex("uniq_box_biscuit").on(t.boxId, t.biscuitId),
  }),
);

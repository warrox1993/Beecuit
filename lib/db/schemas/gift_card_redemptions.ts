import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { giftCards } from "./gift_cards";
import { orders } from "./orders";

export const giftCardRedemptions = pgTable("gift_card_redemptions", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  giftCardId: text("gift_card_id")
    .notNull()
    .references(() => giftCards.id, { onDelete: "restrict" }),
  orderId: text("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "restrict" }),
  amountCents: integer("amount_cents").notNull(),
  stripeCouponId: text("stripe_coupon_id"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

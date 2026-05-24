import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { orders } from "./orders";

export const giftCards = pgTable("gift_cards", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  initialAmountCents: integer("initial_amount_cents").notNull(),
  remainingAmountCents: integer("remaining_amount_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  purchaserUserId: text("purchaser_user_id").references(() => users.id, { onDelete: "set null" }),
  purchaserEmail: text("purchaser_email").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  message: text("message"),
  deliveryAt: timestamp("delivery_at", { mode: "date" }).notNull(),
  deliveredAt: timestamp("delivered_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  purchaseOrderId: text("purchase_order_id").references(() => orders.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

import { pgTable, text, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  guestEmail: text("guest_email"),
  status: orderStatus("status").notNull().default("pending"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  locale: text("locale").notNull().default("fr"),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot").$type<Record<string, unknown>>(),
  billingAddressSnapshot: jsonb("billing_address_snapshot").$type<Record<string, unknown>>(),
  shippingMethod: text("shipping_method"),
  shippingTrackingNumber: text("shipping_tracking_number"),
  stripeSessionId: text("stripe_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  giftCardRedemptionId: text("gift_card_redemption_id"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
});

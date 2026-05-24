import { pgTable, text, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const subscriptionFormat = pgEnum("subscription_format", ["mini", "classique", "famille"]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "paused",
  "cancelled",
  "expired",
  "past_due",
]);

export const subscriptions = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  format: subscriptionFormat("format").notNull(),
  engagementMonths: integer("engagement_months").notNull(),
  status: subscriptionStatus("status").notNull().default("trialing"),
  startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
  engagementEndsAt: timestamp("engagement_ends_at", { mode: "date" }),
  pausedAt: timestamp("paused_at", { mode: "date" }),
  cancelledAt: timestamp("cancelled_at", { mode: "date" }),
  shippingAddressSnapshot: jsonb("shipping_address_snapshot")
    .$type<Record<string, unknown>>()
    .notNull(),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

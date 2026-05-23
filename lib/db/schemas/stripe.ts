import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { mode: "date" }).notNull().defaultNow(),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
});

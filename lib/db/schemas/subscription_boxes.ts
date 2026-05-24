import { pgTable, text, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { subscriptions } from "./subscriptions";
import { orders } from "./orders";

export const subscriptionBoxStatus = pgEnum("subscription_box_status", [
  "composing",
  "locked",
  "shipped",
  "skipped",
]);

export const subscriptionBoxes = pgTable(
  "subscription_boxes",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    cycleYearMonth: text("cycle_year_month").notNull(),
    status: subscriptionBoxStatus("status").notNull().default("composing"),
    compositionDeadline: timestamp("composition_deadline", { mode: "date" }).notNull(),
    shippingOrderId: text("shipping_order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    composedBy: text("composed_by"),
    composingEmailSentAt: timestamp("composing_email_sent_at", { mode: "date" }),
    reminderEmailSentAt: timestamp("reminder_email_sent_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueSubMonth: uniqueIndex("uniq_subscription_box_month").on(t.subscriptionId, t.cycleYearMonth),
  }),
);

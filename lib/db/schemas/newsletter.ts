import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { locale } from "./auth";

export const newsletterStatus = pgEnum("newsletter_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  locale: locale("locale").notNull(),
  status: newsletterStatus("status").notNull().default("pending"),
  journalOptIn: boolean("journal_opt_in").notNull().default(false),
  confirmToken: text("confirm_token").notNull().unique(),
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  source: text("source"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at", { mode: "date", withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { mode: "date", withTimezone: true }),
});

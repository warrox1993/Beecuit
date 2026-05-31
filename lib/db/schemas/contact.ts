import { pgTable, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const contactReason = pgEnum("contact_reason", ["order", "b2b", "press", "delivery", "other"]);
export const contactStatus = pgEnum("contact_status", ["new", "read", "archived"]);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").notNull(),
    reason: contactReason("reason").notNull(),
    message: text("message").notNull(),
    locale: text("locale").notNull().default("fr"),
    status: contactStatus("status").notNull().default("new"),
    sourceIp: text("source_ip"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
  },
  (t) => ({
    statusCreatedIdx: index("contact_messages_status_created_idx").on(t.status, t.createdAt),
    sourceIpIdx: index("contact_messages_source_ip_idx").on(t.sourceIp),
  }),
);

export type ContactMessage = typeof contactMessages.$inferSelect;
export type ContactReason = (typeof contactReason.enumValues)[number];
export type ContactStatus = (typeof contactStatus.enumValues)[number];

import { pgTable, text, integer, timestamp, pgEnum, jsonb, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const b2bQuoteStatus = pgEnum("b2b_quote_status", [
  "pending",
  "quoted",
  "paid",
  "rejected",
  "expired",
]);

export const b2bQuoteRequests = pgTable("b2b_quote_requests", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  vatNumber: text("vat_number"),
  requestedProducts: text("requested_products").notNull(),
  targetQuantity: integer("target_quantity"),
  targetDeliveryDate: date("target_delivery_date", { mode: "string" }),
  budgetRange: text("budget_range"),
  message: text("message"),
  locale: text("locale").notNull().default("fr"),

  status: b2bQuoteStatus("status").notNull().default("pending"),
  quotedAmountCents: integer("quoted_amount_cents"),
  quoteDescription: text("quote_description"),
  shippingAddress: jsonb("shipping_address").$type<Record<string, unknown>>(),
  adminNotes: text("admin_notes"),

  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  stripePaymentLinkId: text("stripe_payment_link_id"),
  stripePaymentLinkUrl: text("stripe_payment_link_url"),

  rejectedReason: text("rejected_reason"),

  sourceIp: text("source_ip"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  quotedAt: timestamp("quoted_at", { mode: "date" }),
  quotedBy: text("quoted_by").references(() => users.id, { onDelete: "set null" }),
  quoteExpiresAt: timestamp("quote_expires_at", { mode: "date" }),
  paidAt: timestamp("paid_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type B2BQuoteRequest = typeof b2bQuoteRequests.$inferSelect;
export type NewB2BQuoteRequest = typeof b2bQuoteRequests.$inferInsert;

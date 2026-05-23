import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const addresses = pgTable("addresses", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull().default("BE"),
  phone: text("phone"),
  isDefaultShipping: boolean("is_default_shipping").notNull().default(false),
  isDefaultBilling: boolean("is_default_billing").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

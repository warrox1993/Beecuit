import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { products } from "./products";

export const carts = pgTable("carts", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type CartItemMetadata =
  | {
      type?: "coffret";
      giftMessage?: string | null;
      packagingTier?: "standard" | "premium";
    }
  | {
      type: "gift_card";
      recipientEmail: string;
      recipientName: string | null;
      message: string | null;
      deliveryAt: string; // ISO timestamp
    };

export const cartItems = pgTable("cart_items", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  metadata: jsonb("metadata").$type<CartItemMetadata>(),
  addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
});

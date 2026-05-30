import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * One-shot tokens for the forgot-password flow.
 *
 * `token` stores sha256(rawToken) — the raw value lives only in the email URL.
 * Rows are deleted on use; expired rows are pruned opportunistically.
 */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    token: text("token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
  }),
);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

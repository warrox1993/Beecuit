import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const twoFactorRecoveryCodes = pgTable(
  "two_factor_recovery_codes",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    usedAt: timestamp("used_at", { mode: "date" }),
  },
  (table) => ({
    userIdIdx: index("recovery_codes_user_id_idx").on(table.userId),
  }),
);

export type TwoFactorRecoveryCode = typeof twoFactorRecoveryCodes.$inferSelect;

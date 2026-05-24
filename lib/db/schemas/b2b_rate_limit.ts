import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

/**
 * DB-backed rate limit hits for B2B quote requests.
 * Survives Vercel serverless cold starts (unlike an in-memory Map).
 *
 * Each call to checkRateLimit() inserts a row; old rows are opportunistically pruned.
 */
export const b2bRateLimitHits = pgTable(
  "b2b_rate_limit_hits",
  {
    ip: text("ip").notNull(),
    hitAt: timestamp("hit_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    ipHitAtIdx: index("b2b_rate_limit_hits_ip_hit_at_idx").on(table.ip, table.hitAt),
  }),
);

export type B2BRateLimitHit = typeof b2bRateLimitHits.$inferSelect;
export type NewB2BRateLimitHit = typeof b2bRateLimitHits.$inferInsert;

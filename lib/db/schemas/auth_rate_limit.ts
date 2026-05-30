import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

/**
 * DB-backed rate limit hits for the sign-in / magic-link form.
 * Mirrors b2bRateLimitHits but tracks both the email identifier and the IP
 * so we can enforce a per-email and per-IP window without leaking which
 * address triggered the limit.
 */
export const authRateLimitHits = pgTable(
  "auth_rate_limit_hits",
  {
    identifier: text("identifier"),
    ip: text("ip"),
    hitAt: timestamp("hit_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    identifierHitAtIdx: index("auth_rate_limit_hits_identifier_hit_at_idx").on(
      table.identifier,
      table.hitAt,
    ),
    ipHitAtIdx: index("auth_rate_limit_hits_ip_hit_at_idx").on(table.ip, table.hitAt),
  }),
);

export type AuthRateLimitHit = typeof authRateLimitHits.$inferSelect;
export type NewAuthRateLimitHit = typeof authRateLimitHits.$inferInsert;

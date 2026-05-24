-- DB-backed rate limit for B2B quote requests (replaces in-memory Map that was reset on every cold start).
-- Each checkRateLimit() call inserts a row; window-count queries use the (ip, hit_at) index;
-- old rows pruned opportunistically by the application.

CREATE TABLE IF NOT EXISTS "b2b_rate_limit_hits" (
  "ip" text NOT NULL,
  "hit_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "b2b_rate_limit_hits_ip_hit_at_idx"
  ON "b2b_rate_limit_hits" ("ip", "hit_at");

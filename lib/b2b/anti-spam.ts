import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { b2bRateLimitHits } from "@/lib/db/schemas/b2b_rate_limit";

const MAX_PER_WINDOW = 3;

/**
 * DB-backed rate limit for B2B quote requests.
 *
 * Why DB-backed: serverless cold starts wipe in-memory state, so an attacker could
 * just wait for the instance to recycle to reset the counter. The DB persists across
 * invocations on every region/instance.
 *
 * Window: 15 minutes. Max: 3 requests per IP.
 * Cleanup is opportunistic (~10% of calls) to avoid an unbounded rows table.
 */
export async function checkRateLimit(ip: string | null | undefined): Promise<boolean> {
  if (!ip) return true;

  // Window count using indexed (ip, hit_at).
  const countRows = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count
    FROM b2b_rate_limit_hits
    WHERE ip = ${ip}
      AND hit_at > NOW() - INTERVAL '15 minutes'
  `);
  // neon-http returns { rows: [...] } typed loosely — normalize defensively.
  const rows = (countRows as unknown as { rows?: { count: string }[] }).rows ?? [];
  const countStr = rows[0]?.count ?? "0";
  const count = Number(countStr);

  if (count >= MAX_PER_WINDOW) {
    return false;
  }

  await db.insert(b2bRateLimitHits).values({ ip });

  // Opportunistic cleanup of rows older than 1h on ~10% of calls.
  if (Math.random() < 0.1) {
    await db.execute(sql`
      DELETE FROM b2b_rate_limit_hits
      WHERE hit_at < NOW() - INTERVAL '1 hour'
    `);
  }

  return true;
}

export function getClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    return first ? first.trim() : null;
  }
  return headers.get("x-real-ip");
}

/**
 * Test helper: wipes the rate-limit table. Used by integration tests with a real DB.
 * Safe no-op semantics: if DB access fails we just swallow — unit tests should mock instead.
 */
export async function _resetRateLimitForTests(): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM b2b_rate_limit_hits`);
  } catch {
    // ignore — tests that can't reach the DB should use mocks
  }
}

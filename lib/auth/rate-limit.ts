import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authRateLimitHits } from "@/lib/db/schemas/auth_rate_limit";

const WINDOW_INTERVAL = "15 minutes";
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 10;

export type SignInRateLimitResult =
  | { ok: true }
  | { ok: false; reason: "email" | "ip" };

/**
 * Per-email + per-IP window check for the sign-in form.
 *
 * Both dimensions are evaluated against the same 15-minute rolling window:
 *  - per email: caps how many magic links can be requested for one address
 *  - per IP: caps a single sender (incl. shared IPs)
 *
 * The caller logs a hit only after a successful check, to avoid letting
 * blocked attempts grow the table further.
 */
export async function checkSignInRateLimit(
  email: string | null | undefined,
  ip: string | null | undefined,
): Promise<SignInRateLimitResult> {
  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  const normalizedIp = ip?.trim() || null;

  if (normalizedEmail) {
    const rows = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM auth_rate_limit_hits
      WHERE identifier = ${normalizedEmail}
        AND hit_at > NOW() - (${WINDOW_INTERVAL})::interval
    `);
    const list = (rows as unknown as { rows?: { count: string }[] }).rows ?? [];
    if (Number(list[0]?.count ?? "0") >= MAX_PER_EMAIL) {
      return { ok: false, reason: "email" };
    }
  }

  if (normalizedIp) {
    const rows = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM auth_rate_limit_hits
      WHERE ip = ${normalizedIp}
        AND hit_at > NOW() - (${WINDOW_INTERVAL})::interval
    `);
    const list = (rows as unknown as { rows?: { count: string }[] }).rows ?? [];
    if (Number(list[0]?.count ?? "0") >= MAX_PER_IP) {
      return { ok: false, reason: "ip" };
    }
  }

  await db.insert(authRateLimitHits).values({
    identifier: normalizedEmail,
    ip: normalizedIp,
  });

  // Opportunistic cleanup of rows older than 1h on ~10% of calls.
  if (Math.random() < 0.1) {
    await db.execute(sql`
      DELETE FROM auth_rate_limit_hits
      WHERE hit_at < NOW() - INTERVAL '1 hour'
    `);
  }

  return { ok: true };
}

export function getClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0];
    return first ? first.trim() : null;
  }
  return headers.get("x-real-ip");
}

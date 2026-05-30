import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authRateLimitHits } from "@/lib/db/schemas/auth_rate_limit";

export type AuthAction = "sign-in" | "register" | "forgot" | "reset" | "change-password";

const LIMITS: Record<AuthAction, { email: number; ip: number }> = {
  "sign-in": { email: 3, ip: 10 },
  register: { email: 3, ip: 5 },
  forgot: { email: 3, ip: 5 },
  reset: { email: Number.POSITIVE_INFINITY, ip: 5 },
  "change-password": { email: 5, ip: Number.POSITIVE_INFINITY },
};

const WINDOW_INTERVAL = "15 minutes";

export type AuthRateLimitResult = { ok: true } | { ok: false; reason: "email" | "ip" };

export async function checkAuthRateLimit(opts: {
  action: AuthAction;
  email?: string | null;
  ip?: string | null;
}): Promise<AuthRateLimitResult> {
  const limits = LIMITS[opts.action];
  const normalizedEmail = opts.email?.trim().toLowerCase() ?? null;
  const normalizedIp = opts.ip?.trim() || null;
  const prefixedEmail = normalizedEmail ? `${opts.action}:${normalizedEmail}` : null;
  const prefixedIp = normalizedIp ? `${opts.action}:${normalizedIp}` : null;

  if (prefixedEmail && Number.isFinite(limits.email)) {
    const rows = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM auth_rate_limit_hits
      WHERE identifier = ${prefixedEmail}
        AND hit_at > NOW() - (${WINDOW_INTERVAL})::interval
    `);
    const list = (rows as unknown as { rows?: { count: string }[] }).rows ?? [];
    if (Number(list[0]?.count ?? "0") >= limits.email) return { ok: false, reason: "email" };
  }

  if (prefixedIp && Number.isFinite(limits.ip)) {
    const rows = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM auth_rate_limit_hits
      WHERE ip = ${prefixedIp}
        AND hit_at > NOW() - (${WINDOW_INTERVAL})::interval
    `);
    const list = (rows as unknown as { rows?: { count: string }[] }).rows ?? [];
    if (Number(list[0]?.count ?? "0") >= limits.ip) return { ok: false, reason: "ip" };
  }

  await db.insert(authRateLimitHits).values({
    identifier: prefixedEmail,
    ip: prefixedIp,
  });

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

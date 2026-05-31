import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Constant-time check of the `Authorization: Bearer <CRON_SECRET>` header for
 * Vercel cron routes. Uses timingSafeEqual to avoid leaking the secret through
 * response-time differences (consistent with the project's HMAC comparisons).
 */
export function isCronAuthorized(request: Request): boolean {
  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

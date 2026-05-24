const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_PER_WINDOW = 3;

const hits = new Map<string, number[]>();

export function checkRateLimit(ip: string | null | undefined): boolean {
  if (!ip) return true;
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return false;
  }
  arr.push(now);
  hits.set(ip, arr);
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

export function _resetRateLimitForTests(): void {
  hits.clear();
}

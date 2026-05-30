import { routing } from "@/i18n/routing";

const LOCALES = routing.locales as readonly string[];

/**
 * Return a safe in-app URL for use as `callbackUrl` after sign-in.
 * - Falls back to `/{locale}/compte` on null/invalid input.
 * - Refuses anything that isn't a same-origin app path.
 * - Preserves already locale-prefixed paths and the non-localized /admin tree.
 */
export function safeCallbackUrl(raw: string | null | undefined, locale: string): string {
  const fallback = `/${locale}/compte`;
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.startsWith("/api")) return fallback;
  if (raw === "/admin" || raw.startsWith("/admin/")) return raw;

  const firstSegment = raw.slice(1).split("/")[0] ?? "";
  if (LOCALES.includes(firstSegment)) return raw;

  return `/${locale}${raw}`;
}

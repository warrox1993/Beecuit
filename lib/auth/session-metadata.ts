import "server-only";
import { getClientIp } from "@/lib/auth/rate-limit";

export type SessionMetadata = {
  userAgent: string | null;
  ip: string | null;
  city: string | null;
  country: string | null;
};

export function parseUserAgentLabel(ua: string | null): string {
  if (!ua) return "Appareil inconnu";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navigateur";
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "appareil";
  return `${browser} · ${os}`;
}

export function captureMetadata(headers: Headers): SessionMetadata {
  const rawCity = headers.get("x-vercel-ip-city");
  return {
    userAgent: headers.get("user-agent"),
    ip: getClientIp(headers),
    city: rawCity ? decodeURIComponent(rawCity) : null,
    country: headers.get("x-vercel-ip-country"),
  };
}

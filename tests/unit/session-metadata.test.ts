import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import { parseUserAgentLabel, captureMetadata } from "@/lib/auth/session-metadata";

describe("parseUserAgentLabel", () => {
  it("falls back for empty UA", () => {
    expect(parseUserAgentLabel(null)).toBe("Appareil inconnu");
  });
  it("labels Chrome on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
    expect(parseUserAgentLabel(ua)).toBe("Chrome · Windows");
  });
  it("labels Safari on iPhone", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(parseUserAgentLabel(ua)).toBe("Safari · iPhone");
  });
});

describe("captureMetadata", () => {
  it("reads UA, IP and Vercel geo headers", () => {
    const h = new Headers({
      "user-agent": "UA",
      "x-forwarded-for": "81.246.1.2, 10.0.0.1",
      "x-vercel-ip-city": "Bruxelles",
      "x-vercel-ip-country": "BE",
    });
    expect(captureMetadata(h)).toEqual({
      userAgent: "UA",
      ip: "81.246.1.2",
      city: "Bruxelles",
      country: "BE",
    });
  });
});

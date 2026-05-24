import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, _resetRateLimitForTests } from "@/lib/b2b/anti-spam";

describe("B2B anti-spam rate limit", () => {
  beforeEach(() => {
    _resetRateLimitForTests();
  });

  it("allows up to 3 requests per IP in the window", () => {
    expect(checkRateLimit("1.2.3.4")).toBe(true);
    expect(checkRateLimit("1.2.3.4")).toBe(true);
    expect(checkRateLimit("1.2.3.4")).toBe(true);
  });

  it("blocks the 4th request from the same IP", () => {
    checkRateLimit("9.9.9.9");
    checkRateLimit("9.9.9.9");
    checkRateLimit("9.9.9.9");
    expect(checkRateLimit("9.9.9.9")).toBe(false);
  });

  it("isolates per IP", () => {
    checkRateLimit("1.1.1.1");
    checkRateLimit("1.1.1.1");
    checkRateLimit("1.1.1.1");
    expect(checkRateLimit("1.1.1.1")).toBe(false);
    expect(checkRateLimit("2.2.2.2")).toBe(true);
  });

  it("handles missing/unknown ip by accepting (don't lock out legit traffic when IP detect fails)", () => {
    expect(checkRateLimit(null)).toBe(true);
    expect(checkRateLimit("")).toBe(true);
  });
});

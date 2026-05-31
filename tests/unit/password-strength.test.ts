import { describe, expect, it } from "vitest";
import { scorePassword } from "@/lib/auth/password-strength";

describe("scorePassword", () => {
  it("scores an empty / very short password 0", () => {
    expect(scorePassword("").score).toBe(0);
    expect(scorePassword("abc").score).toBe(0);
  });

  it("scores a long mixed password highly", () => {
    expect(scorePassword("Tr0ub4dour!-XK29z").score).toBeGreaterThanOrEqual(3);
  });

  it("penalises a forbidden brand word", () => {
    expect(scorePassword("aufildessaveurs123").score).toBeLessThanOrEqual(1);
  });

  it("penalises the email local-part", () => {
    expect(scorePassword("Jean12345678", { email: "jean@example.com" }).score).toBeLessThanOrEqual(1);
  });
});

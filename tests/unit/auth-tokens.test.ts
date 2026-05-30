import { describe, expect, it } from "vitest";
import { generateRawToken, hashToken } from "@/lib/auth/tokens";

describe("token helpers", () => {
  it("generates a 43-char base64url token (32 bytes)", () => {
    const t = generateRawToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("generates a different token each call", () => {
    expect(generateRawToken()).not.toBe(generateRawToken());
  });

  it("hashes a token to 64-char hex (sha256)", () => {
    const h = hashToken("anything");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashes deterministically", () => {
    expect(hashToken("anything")).toBe(hashToken("anything"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});

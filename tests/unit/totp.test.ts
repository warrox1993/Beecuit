import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { AUTH_SECRET: "x".repeat(40) } }));

import {
  generateSecret,
  buildOtpauthUrl,
  verifyTotp,
  encryptSecret,
  decryptSecret,
} from "@/lib/auth/totp";
import { authenticator } from "otplib";

describe("totp", () => {
  it("encrypt → decrypt round-trips the secret", () => {
    const secret = generateSecret();
    const enc = encryptSecret(secret);
    expect(enc).not.toBe(secret);
    expect(enc.split(":")).toHaveLength(3);
    expect(decryptSecret(enc)).toBe(secret);
  });

  it("verifyTotp accepts a freshly generated code and rejects garbage", () => {
    const secret = generateSecret();
    const code = authenticator.generate(secret);
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("buildOtpauthUrl embeds issuer + account", () => {
    const url = buildOtpauthUrl("test@example.com", generateSecret());
    expect(url).toMatch(/^otpauth:\/\/totp\//);
    expect(url).toContain("Au%20Fil%20des%20Saveurs");
  });
});

import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("hashes a password to a non-empty argon2 string", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash.length).toBeGreaterThan(50);
  });

  it("produces a different hash each call (random salt)", async () => {
    const h1 = await hashPassword("hunter2hunter2");
    const h2 = await hashPassword("hunter2hunter2");
    expect(h1).not.toBe(h2);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("wrong password 1234", hash)).toBe(false);
  });

  it("returns false on a malformed hash instead of throwing", async () => {
    expect(await verifyPassword("anything", "not-an-argon2-string")).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";

const codeRows: { codeHash: string; usedAt: Date | null }[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(codeRows.map((r) => ({ ...r, id: "r", userId: "u" }))),
      }),
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  },
}));

import { generateRecoveryCodes, hashRecoveryCode } from "@/lib/auth/recovery-codes";

describe("recovery codes", () => {
  it("generates 10 unique formatted codes + matching hashes", () => {
    const { plain, hashes } = generateRecoveryCodes();
    expect(plain).toHaveLength(10);
    expect(hashes).toHaveLength(10);
    expect(new Set(plain).size).toBe(10);
    plain.forEach((c) => expect(c).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/));
    expect(hashes[0]).toBe(hashRecoveryCode(plain[0]!));
  });
});

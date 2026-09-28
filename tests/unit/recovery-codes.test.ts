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

  // Alerte CodeQL js/biased-cryptographic-random : `octet % 36` sur-représentait « a » à « d »
  // (8/256 au lieu de 7/256, soit 12,5 % des caractères au lieu de 11,1 %). Sur 160 000
  // caractères, un tirage uniforme donne 17 778 ± 126 « a » à « d » ; l'ancien code en donnait
  // ≈ 20 000. Le seuil (moyenne + 6 écarts-types) ne peut échouer par hasard qu'avec une
  // probabilité de l'ordre de 1e-9.
  it("draws characters uniformly (no modulo bias toward a-d)", () => {
    const counts = new Map<string, number>();
    let total = 0;
    for (let i = 0; i < 2000; i++) {
      for (const code of generateRecoveryCodes().plain) {
        for (const ch of code.replace("-", "")) {
          counts.set(ch, (counts.get(ch) ?? 0) + 1);
          total++;
        }
      }
    }
    expect(total).toBe(160_000);
    const aToD = ["a", "b", "c", "d"].reduce((n, ch) => n + (counts.get(ch) ?? 0), 0);
    const p = 4 / 36;
    const mean = total * p;
    const sd = Math.sqrt(total * p * (1 - p));
    expect(aToD).toBeLessThan(mean + 6 * sd);
    expect(aToD).toBeGreaterThan(mean - 6 * sd);
    expect(counts.size).toBe(36);
  });
});

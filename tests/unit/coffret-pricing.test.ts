import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeCoffretPrice } from "@/lib/coffret/pricing";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

const mockContentsThenDiscount = (
  contents: Array<{ biscuitId: string; name: string; quantity: number; unitPriceCents: number }>,
  discountPercent: number | null,
) => {
  // 1st call: contents query
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      innerJoin: () => ({
        innerJoin: () => ({
          where: () => Promise.resolve(contents),
        }),
      }),
    }),
  });
  // 2nd call: coffret discount lookup
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([{ discountPercent }]),
      }),
    }),
  });
};

describe("computeCoffretPrice", () => {
  beforeEach(() => vi.resetAllMocks());

  it("calcule subtotal + discount + total avec arrondi ceil au cent", async () => {
    mockContentsThenDiscount(
      [
        { biscuitId: "a", name: "Spéculoos", quantity: 2, unitPriceCents: 690 },
        { biscuitId: "b", name: "Cookies", quantity: 2, unitPriceCents: 990 },
      ],
      15,
    );
    const r = await computeCoffretPrice("coffret-id", "fr");
    expect(r.subtotalCents).toBe(3360);
    expect(r.discountPercent).toBe(15);
    expect(r.discountCents).toBe(504); // ceil(3360 * 0.15) = 504
    expect(r.totalCents).toBe(2856);
    expect(r.breakdown).toHaveLength(2);
    expect(r.breakdown[0]).toMatchObject({ biscuitId: "a", quantity: 2, lineCents: 1380 });
  });

  it("retourne discount 0 si percent null/0", async () => {
    mockContentsThenDiscount(
      [{ biscuitId: "a", name: "X", quantity: 1, unitPriceCents: 1000 }],
      null,
    );
    const r = await computeCoffretPrice("coffret-id", "fr");
    expect(r.discountCents).toBe(0);
    expect(r.totalCents).toBe(1000);
  });

  it("throws si coffret vide (pas de biscuits)", async () => {
    // Only the first mock (empty contents) is consumed; we throw before reaching the discount lookup.
    (db.select as any).mockReturnValueOnce({
      from: () => ({
        innerJoin: () => ({
          innerJoin: () => ({
            where: () => Promise.resolve([]),
          }),
        }),
      }),
    });
    await expect(computeCoffretPrice("empty", "fr")).rejects.toThrow(/empty/i);
  });

  it("ceil arrondi: 333c * 10% = 34c (not floor 33)", async () => {
    // 333 × 10 / 100 = 33.3 → ceil = 34. Distinguishes ceil from floor.
    mockContentsThenDiscount(
      [{ biscuitId: "a", name: "X", quantity: 1, unitPriceCents: 333 }],
      10,
    );
    const r = await computeCoffretPrice("c", "fr");
    expect(r.discountCents).toBe(34);
    expect(r.totalCents).toBe(299);
  });
});

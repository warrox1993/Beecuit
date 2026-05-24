import { describe, it, expect, vi, beforeEach } from "vitest";
import { isCoffretAvailable } from "@/lib/coffret/availability";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }));

const mockQuery = (
  rows: Array<{
    biscuitId: string;
    name: string;
    needed: number;
    stockQuantity: number;
    isActive: boolean;
  }>,
) => {
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      innerJoin: () => ({
        innerJoin: () => ({
          where: () => Promise.resolve(rows),
        }),
      }),
    }),
  });
};

describe("isCoffretAvailable", () => {
  beforeEach(() => vi.resetAllMocks());

  it("available + maxOrderable quand tous les biscuits ont du stock", async () => {
    mockQuery([
      { biscuitId: "a", name: "Spec", needed: 2, stockQuantity: 20, isActive: true },
      { biscuitId: "b", name: "Cookies", needed: 2, stockQuantity: 4, isActive: true },
    ]);
    const r = await isCoffretAvailable("coffret-id", 1);
    expect(r.available).toBe(true);
    if (r.available) expect(r.maxOrderable).toBe(2);
  });

  it("not available + blockingBiscuit si rupture sur 1 biscuit", async () => {
    mockQuery([
      { biscuitId: "a", name: "Spec", needed: 2, stockQuantity: 20, isActive: true },
      { biscuitId: "b", name: "Cookies", needed: 2, stockQuantity: 1, isActive: true },
    ]);
    const r = await isCoffretAvailable("coffret-id", 1);
    expect(r.available).toBe(false);
    if (!r.available) {
      expect(r.blockingBiscuit.id).toBe("b");
      expect(r.blockingBiscuit.needed).toBe(2);
      expect(r.blockingBiscuit.inStock).toBe(1);
    }
  });

  it("not available si biscuit isActive=false", async () => {
    mockQuery([
      { biscuitId: "a", name: "Spec", needed: 2, stockQuantity: 20, isActive: false },
    ]);
    const r = await isCoffretAvailable("coffret-id", 1);
    expect(r.available).toBe(false);
  });

  it("not available si requestedQty > maxOrderable", async () => {
    mockQuery([
      { biscuitId: "a", name: "Spec", needed: 2, stockQuantity: 4, isActive: true },
    ]);
    const r = await isCoffretAvailable("coffret-id", 5);
    expect(r.available).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateGiftCardCode } from "@/lib/gift-cards/validation";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }));

const mockSelectOne = (row: Record<string, unknown> | null) => {
  (db.select as any).mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(row ? [row] : []),
      }),
    }),
  });
};

const now = new Date("2026-06-01T12:00:00Z");
const future = new Date("2027-06-01T12:00:00Z");
const past = new Date("2025-01-01T12:00:00Z");

describe("validateGiftCardCode", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns valid + amountAvailable when card is active, delivered, not expired, has balance", async () => {
    mockSelectOne({
      id: "gc1",
      isActive: true,
      deliveredAt: past,
      expiresAt: future,
      remainingAmountCents: 5000,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.cardId).toBe("gc1");
      expect(r.amountAvailableCents).toBe(5000);
    }
  });

  it("returns invalid when code not found", async () => {
    mockSelectOne(null);
    const r = await validateGiftCardCode("BC-XXXX-XXXX-XXXX", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/inconnu/i);
  });

  it("returns invalid when card not yet delivered", async () => {
    mockSelectOne({
      id: "gc1",
      isActive: true,
      deliveredAt: null,
      expiresAt: future,
      remainingAmountCents: 5000,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/pas encore/i);
  });

  it("returns invalid when expired", async () => {
    mockSelectOne({
      id: "gc1",
      isActive: true,
      deliveredAt: past,
      expiresAt: past,
      remainingAmountCents: 5000,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/expir/i);
  });

  it("returns invalid when fully used", async () => {
    mockSelectOne({
      id: "gc1",
      isActive: true,
      deliveredAt: past,
      expiresAt: future,
      remainingAmountCents: 0,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/utilis/i);
  });

  it("returns invalid when disabled", async () => {
    mockSelectOne({
      id: "gc1",
      isActive: false,
      deliveredAt: past,
      expiresAt: future,
      remainingAmountCents: 5000,
    });
    const r = await validateGiftCardCode("BC-AAAA-BBBB-CCCC", now);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error).toMatch(/d.sactiv/i);
  });
});

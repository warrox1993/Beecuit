import { describe, it, expect } from "vitest";
import { extractVatInclusive, computeOrderTotals } from "@/lib/totals";

describe("extractVatInclusive", () => {
  it("extracts 6 % VAT from a TTC amount", () => {
    // 1060 cents TTC at 6 % → HT = 1000, VAT = 60
    expect(extractVatInclusive(1060, 6)).toEqual({ ht: 1000, vat: 60 });
  });
  it("rounds to nearest cent", () => {
    const r = extractVatInclusive(690, 6);
    expect(r.ht + r.vat).toBe(690);
  });
});

describe("computeOrderTotals", () => {
  it("sums lines + shipping with VAT inclusive 6 %", () => {
    const t = computeOrderTotals({
      lines: [{ unitPriceCents: 690, quantity: 2 }, { unitPriceCents: 850, quantity: 1 }],
      shippingCents: 550,
      vatPercentInclusive: 6,
    });
    expect(t.subtotalCents).toBe(690 * 2 + 850);
    expect(t.shippingCents).toBe(550);
    expect(t.totalCents).toBe(2230 + 550);
    expect(t.htCents + t.vatCents).toBe(t.totalCents);
  });
});

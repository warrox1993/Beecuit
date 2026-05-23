import { describe, it, expect } from "vitest";
import { formatOrderNumber } from "@/lib/order-number";

describe("formatOrderNumber", () => {
  it("formats with BCT-YYYY-NNNNNN prefix", () => {
    expect(formatOrderNumber(1, new Date("2026-05-23"))).toBe("BCT-2026-000001");
  });
  it("pads to 6 digits", () => {
    expect(formatOrderNumber(42, new Date("2026-01-01"))).toBe("BCT-2026-000042");
  });
  it("handles large numbers", () => {
    expect(formatOrderNumber(999999, new Date("2026-12-31"))).toBe("BCT-2026-999999");
  });
});

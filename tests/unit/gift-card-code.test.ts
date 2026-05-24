import { describe, it, expect } from "vitest";
import { generateGiftCardCode } from "@/lib/gift-cards/code";

describe("generateGiftCardCode", () => {
  it("matches the BC-XXXX-XXXX-XXXX format", () => {
    const code = generateGiftCardCode();
    expect(code).toMatch(/^BC-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it("generates 10000 unique codes (no obvious collisions)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 10000; i++) set.add(generateGiftCardCode());
    expect(set.size).toBe(10000);
  });
});

import { describe, it, expect } from "vitest";
import { toSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("kebab-cases ASCII", () => {
    expect(toSlug("Spéculoos Artisanal 200g")).toBe("speculoos-artisanal-200g");
  });
  it("strips diacritics", () => {
    expect(toSlug("Crème brûlée")).toBe("creme-brulee");
  });
  it("collapses spaces and punctuation", () => {
    expect(toSlug("Box  Découverte!! (Premium)")).toBe("box-decouverte-premium");
  });
  it("trims leading/trailing dashes", () => {
    expect(toSlug("  -test-  ")).toBe("test");
  });
});

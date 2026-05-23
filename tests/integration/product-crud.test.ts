import { describe, it, expect } from "vitest";
import { ProductSchema } from "@/lib/validators/product";

describe("ProductSchema", () => {
  it("rejects when one translation is incomplete", () => {
    const incomplete = {
      sku: "BCT-TEST-001", basePriceCents: 690, weightGrams: 200, stockQuantity: 10,
      translations: {
        fr: full("Test FR"), nl: incompleteTrans(), de: full("Test DE"), en: full("Test EN"),
      },
    };
    expect(ProductSchema.safeParse(incomplete).success).toBe(false);
  });

  it("accepts when all 4 translations are present", () => {
    const ok = {
      sku: "BCT-TEST-001", basePriceCents: 690, weightGrams: 200, stockQuantity: 10,
      translations: {
        fr: full("Test FR"), nl: full("Test NL"), de: full("Test DE"), en: full("Test EN"),
      },
    };
    expect(ProductSchema.safeParse(ok).success).toBe(true);
  });
});

function full(name: string) {
  return {
    name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    shortDescription: "Short " + name, longDescription: "Long " + name, ingredients: "Ing",
    allergens: [],
    nutritionalFactsPer100g: { energy_kcal: 400, fat_g: 15, carbs_g: 60, protein_g: 6, salt_g: 0.5 },
    seoTitle: "SEO " + name, seoDescription: "SEO desc " + name,
  };
}

function incompleteTrans() {
  return {
    name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "",
    allergens: [], nutritionalFactsPer100g: { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 },
    seoTitle: "", seoDescription: "",
  };
}

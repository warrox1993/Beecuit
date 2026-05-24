import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { products, productTranslations, coffretContents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

vi.mock("@/lib/auth", () => ({
  auth: async () => ({ user: { id: "admin-test", role: "admin" } }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));

let biscuitIds: string[] = [];
let createdCoffretId: string | undefined;

beforeAll(async () => {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.type, "biscuit"))
    .limit(2);
  biscuitIds = rows.map((r) => r.id);
  if (biscuitIds.length < 2) throw new Error("Need at least 2 biscuits in DB for this test");
});

afterAll(async () => {
  if (createdCoffretId) {
    await db.delete(productTranslations).where(eq(productTranslations.productId, createdCoffretId));
    await db.delete(coffretContents).where(eq(coffretContents.coffretId, createdCoffretId));
    await db.delete(products).where(eq(products.id, createdCoffretId));
  }
});

describe("createCoffret (integration)", () => {
  it("inserts product + translations + coffret_contents", async () => {
    const { createCoffret } = await import("@/lib/actions/admin/coffrets.actions");

    createdCoffretId = await createCoffret({
      sku: "TEST-COF-INT-001",
      weightGrams: 300,
      discountPercent: 15,
      isActive: true,
      isFeatured: false,
      contents: [
        { biscuitId: biscuitIds[0], quantity: 2 },
        { biscuitId: biscuitIds[1], quantity: 3 },
      ],
      translations: {
        fr: {
          name: "Test Coffret",
          slug: "test-coffret-int-001",
          shortDescription: "x",
          longDescription: "y",
          seoTitle: "z",
          seoDescription: "w",
        },
        nl: {
          name: "Test Coffret NL",
          slug: "test-coffret-int-001-nl",
          shortDescription: "x",
          longDescription: "y",
          seoTitle: "z",
          seoDescription: "w",
        },
        en: {
          name: "Test Coffret EN",
          slug: "test-coffret-int-001-en",
          shortDescription: "x",
          longDescription: "y",
          seoTitle: "z",
          seoDescription: "w",
        },
        de: {
          name: "Test Coffret DE",
          slug: "test-coffret-int-001-de",
          shortDescription: "x",
          longDescription: "y",
          seoTitle: "z",
          seoDescription: "w",
        },
      },
    });

    const [prod] = await db
      .select()
      .from(products)
      .where(eq(products.id, createdCoffretId))
      .limit(1);
    expect(prod?.type).toBe("coffret");
    expect(prod?.discountPercent).toBe(15);

    const contents = await db
      .select()
      .from(coffretContents)
      .where(eq(coffretContents.coffretId, createdCoffretId));
    expect(contents).toHaveLength(2);

    const trads = await db
      .select()
      .from(productTranslations)
      .where(eq(productTranslations.productId, createdCoffretId));
    expect(trads).toHaveLength(4);
  });
});

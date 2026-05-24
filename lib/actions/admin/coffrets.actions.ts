"use server";
import { revalidatePath } from "next/cache";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, productTranslations, coffretContents } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { CoffretSchema } from "@/lib/validators/coffret";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const LOCALES = ["fr", "nl", "de", "en"] as const;
const PLACEHOLDER_NUTRITION = {
  energy_kcal: 0,
  fat_g: 0,
  carbs_g: 0,
  protein_g: 0,
  salt_g: 0,
};

export async function createCoffret(raw: unknown): Promise<string> {
  await requireAdmin();
  const data = CoffretSchema.parse(raw);

  const [prod] = await db
    .insert(products)
    .values({
      type: "coffret",
      sku: data.sku,
      basePriceCents: 0,
      weightGrams: data.weightGrams,
      stockQuantity: 0,
      discountPercent: data.discountPercent,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
    })
    .returning();
  if (!prod) throw new Error("Insert failed");

  for (const loc of LOCALES) {
    const t = data.translations[loc];
    await db.insert(productTranslations).values({
      productId: prod.id,
      locale: loc,
      name: t.name,
      slug: t.slug,
      shortDescription: t.shortDescription,
      longDescription: t.longDescription,
      ingredients: "—",
      allergens: [],
      nutritionalFactsPer100g: PLACEHOLDER_NUTRITION,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    });
  }

  for (const c of data.contents) {
    await db.insert(coffretContents).values({
      coffretId: prod.id,
      biscuitId: c.biscuitId,
      quantity: c.quantity,
    });
  }

  revalidatePath("/admin/coffrets");
  return prod.id;
}

export async function updateCoffret(raw: unknown): Promise<void> {
  await requireAdmin();
  const data = CoffretSchema.parse(raw);
  if (!data.id) throw new Error("id required");
  const coffretId = data.id;

  await db
    .update(products)
    .set({
      sku: data.sku,
      weightGrams: data.weightGrams,
      discountPercent: data.discountPercent,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, coffretId));

  for (const loc of LOCALES) {
    const t = data.translations[loc];
    await db
      .insert(productTranslations)
      .values({
        productId: coffretId,
        locale: loc,
        name: t.name,
        slug: t.slug,
        shortDescription: t.shortDescription,
        longDescription: t.longDescription,
        ingredients: "—",
        allergens: [],
        nutritionalFactsPer100g: PLACEHOLDER_NUTRITION,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
      })
      .onConflictDoUpdate({
        target: [productTranslations.productId, productTranslations.locale],
        set: {
          name: t.name,
          slug: t.slug,
          shortDescription: t.shortDescription,
          longDescription: t.longDescription,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        },
      });
  }

  // Upsert all new contents in a single statement, then delete any rows not in
  // the new list. Order matters: INSERT first so the table is never observed in
  // a "missing biscuits" state by concurrent readers (neon-http has no txns).
  const newBiscuitIds = data.contents.map((c) => c.biscuitId);
  if (data.contents.length > 0) {
    await db
      .insert(coffretContents)
      .values(
        data.contents.map((c) => ({
          coffretId,
          biscuitId: c.biscuitId,
          quantity: c.quantity,
        })),
      )
      .onConflictDoUpdate({
        target: [coffretContents.coffretId, coffretContents.biscuitId],
        set: { quantity: sql`excluded.quantity` },
      });
    await db
      .delete(coffretContents)
      .where(
        and(
          eq(coffretContents.coffretId, coffretId),
          notInArray(coffretContents.biscuitId, newBiscuitIds),
        ),
      );
  } else {
    await db.delete(coffretContents).where(eq(coffretContents.coffretId, coffretId));
  }

  revalidatePath("/admin/coffrets");
  revalidatePath(`/admin/coffrets/${coffretId}`);
}

export async function deleteCoffret(id: string): Promise<void> {
  await requireAdmin();
  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id));
  revalidatePath("/admin/coffrets");
}

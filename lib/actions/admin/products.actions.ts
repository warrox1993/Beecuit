"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, productTranslations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { ProductSchema } from "@/lib/validators/product";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const LOCALES = ["fr", "nl", "de", "en"] as const;

export async function createProduct(raw: unknown) {
  await requireAdmin();
  const data = ProductSchema.parse(raw);
  const [prod] = await db
    .insert(products)
    .values({
      type: "biscuit",
      sku: data.sku,
      categoryId: data.categoryId ?? null,
      basePriceCents: data.basePriceCents,
      weightGrams: data.weightGrams,
      stockQuantity: data.stockQuantity,
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
      ingredients: t.ingredients,
      allergens: t.allergens,
      nutritionalFactsPer100g: t.nutritionalFactsPer100g,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    });
  }
  revalidatePath("/admin/produits");
  return prod.id;
}

export async function updateProduct(raw: unknown) {
  await requireAdmin();
  const data = ProductSchema.parse(raw);
  if (!data.id) throw new Error("id required");
  await db
    .update(products)
    .set({
      sku: data.sku,
      categoryId: data.categoryId ?? null,
      basePriceCents: data.basePriceCents,
      weightGrams: data.weightGrams,
      stockQuantity: data.stockQuantity,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, data.id));
  for (const loc of LOCALES) {
    const t = data.translations[loc];
    await db
      .insert(productTranslations)
      .values({
        productId: data.id,
        locale: loc,
        name: t.name,
        slug: t.slug,
        shortDescription: t.shortDescription,
        longDescription: t.longDescription,
        ingredients: t.ingredients,
        allergens: t.allergens,
        nutritionalFactsPer100g: t.nutritionalFactsPer100g,
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
          ingredients: t.ingredients,
          allergens: t.allergens,
          nutritionalFactsPer100g: t.nutritionalFactsPer100g,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        },
      });
  }
  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${data.id}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/admin/produits");
}

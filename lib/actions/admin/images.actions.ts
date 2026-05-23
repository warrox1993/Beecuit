"use server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { productImages } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { uploadProductImage } from "@/lib/blob/upload";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

export async function uploadImage(productId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("file required");
  const url = await uploadProductImage(productId, file);
  const existing = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId));
  await db.insert(productImages).values({
    productId,
    url,
    altText: null,
    sortOrder: existing.length,
    isPrimary: existing.length === 0,
  });
  revalidatePath(`/admin/produits/${productId}`);
}

export async function deleteImage(imageId: string, productId: string) {
  await requireAdmin();
  await db.delete(productImages).where(eq(productImages.id, imageId));
  revalidatePath(`/admin/produits/${productId}`);
}

export async function setPrimaryImage(imageId: string, productId: string) {
  await requireAdmin();
  await db
    .update(productImages)
    .set({ isPrimary: false })
    .where(eq(productImages.productId, productId));
  await db
    .update(productImages)
    .set({ isPrimary: true })
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));
  revalidatePath(`/admin/produits/${productId}`);
}

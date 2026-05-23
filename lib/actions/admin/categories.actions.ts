"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, categoryTranslations, products } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const Trans = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
});
const Schema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  translations: z.object({ fr: Trans, nl: Trans, de: Trans, en: Trans }),
});

const LOCALES = ["fr", "nl", "de", "en"] as const;

export async function createCategory(raw: unknown) {
  await requireAdmin();
  const data = Schema.parse(raw);
  const [cat] = await db
    .insert(categories)
    .values({ slug: data.slug, sortOrder: data.sortOrder, isActive: data.isActive })
    .returning();
  if (!cat) throw new Error("Insert failed");
  for (const l of LOCALES) {
    const t = data.translations[l];
    await db
      .insert(categoryTranslations)
      .values({ categoryId: cat.id, locale: l, name: t.name, description: t.description ?? null });
  }
  revalidatePath("/admin/categories");
}

export async function updateCategory(raw: unknown) {
  await requireAdmin();
  const data = Schema.parse(raw);
  if (!data.id) throw new Error("id required");
  await db
    .update(categories)
    .set({ slug: data.slug, sortOrder: data.sortOrder, isActive: data.isActive })
    .where(eq(categories.id, data.id));
  for (const l of LOCALES) {
    const t = data.translations[l];
    await db
      .insert(categoryTranslations)
      .values({ categoryId: data.id, locale: l, name: t.name, description: t.description ?? null })
      .onConflictDoUpdate({
        target: [categoryTranslations.categoryId, categoryTranslations.locale],
        set: { name: t.name, description: t.description ?? null },
      });
  }
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await db.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
}

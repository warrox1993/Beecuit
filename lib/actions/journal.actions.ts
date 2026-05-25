"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { journalArticles, journalArticleTranslations } from "@/lib/db/schema";
import { toSlug } from "@/lib/slug";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { validateBody } from "@/lib/journal/validate-body";
import { calculateReadingMinutes } from "@/lib/journal/reading-time";
import { generateExcerpt } from "@/lib/journal/excerpt";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") throw new Error("Forbidden");
}

const createSchema = z.object({
  titleFr: z.string().min(3).max(200),
  category: z.enum(["recettes", "savoir-faire", "saisons", "atelier"]),
});

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let i = 1;
  while (true) {
    const found = await db
      .select()
      .from(journalArticles)
      .where(eq(journalArticles.slug, candidate))
      .limit(1);
    if (found.length === 0) return candidate;
    candidate = `${base}-${++i}`;
  }
}

export async function createArticle(formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      "Champs invalides : " + JSON.stringify(parsed.error.flatten().fieldErrors),
    );
  }

  const slug = await uniqueSlug(toSlug(parsed.data.titleFr));
  const [article] = await db
    .insert(journalArticles)
    .values({
      slug,
      category: parsed.data.category,
      coverImage: "",
      coverAltFr: "",
    })
    .returning();

  if (!article) throw new Error("Échec de la création de l'article");

  await db.insert(journalArticleTranslations).values({
    articleId: article.id,
    locale: "fr",
    title: parsed.data.titleFr,
    excerpt: "",
    bodyJson: { type: "doc", content: [{ type: "paragraph" }] },
  });

  redirect(`/admin/journal/${article.id}`);
}

const updateMetaSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(["recettes", "savoir-faire", "saisons", "atelier"]),
  coverImage: z.string().url(),
  coverAltFr: z.string().min(1),
  pinterestImage: z.string().url().optional().nullable(),
  recipePrepMin: z.number().int().positive().optional().nullable(),
  recipeCookMin: z.number().int().positive().optional().nullable(),
  recipeDifficulty: z.enum(["facile", "moyen", "avance"]).optional().nullable(),
  featuredProductSlugs: z.array(z.string()).default([]),
});

export async function updateArticleMeta(raw: unknown) {
  await requireAdmin();
  const data = updateMetaSchema.parse(raw);
  await db
    .update(journalArticles)
    .set({
      category: data.category,
      coverImage: data.coverImage,
      coverAltFr: data.coverAltFr,
      pinterestImage: data.pinterestImage ?? null,
      recipePrepMin: data.recipePrepMin ?? null,
      recipeCookMin: data.recipeCookMin ?? null,
      recipeDifficulty: data.recipeDifficulty ?? null,
      featuredProductSlugs: data.featuredProductSlugs,
      updatedAt: new Date(),
    })
    .where(eq(journalArticles.id, data.id));
  revalidatePath(`/admin/journal/${data.id}`);
  return { ok: true };
}

const updateTranslationSchema = z.object({
  articleId: z.string().uuid(),
  locale: z.enum(["fr", "nl", "en", "de"]),
  title: z.string().min(1),
  excerpt: z.string().max(200),
  bodyJson: z.unknown(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  recipeYieldLabel: z.string().optional().nullable(),
  recipeIngredients: z
    .array(z.object({ name: z.string(), qty: z.string(), unit: z.string() }))
    .optional()
    .nullable(),
  recipeSteps: z
    .array(z.object({ n: z.number(), text: z.string() }))
    .optional()
    .nullable(),
});

export async function upsertTranslation(raw: unknown) {
  await requireAdmin();
  const data = updateTranslationSchema.parse(raw);
  validateBody(data.bodyJson);

  // typed body for helpers
  type PMDoc = Parameters<typeof generateExcerpt>[0];
  const body = data.bodyJson as PMDoc;
  const excerpt = data.excerpt.trim() || generateExcerpt(body, 200);

  // Recompute reading time from FR body for the whole article
  let readingMinutes: number | undefined;
  if (data.locale === "fr") {
    readingMinutes = calculateReadingMinutes(body);
  }

  const existing = await db
    .select()
    .from(journalArticleTranslations)
    .where(
      and(
        eq(journalArticleTranslations.articleId, data.articleId),
        eq(journalArticleTranslations.locale, data.locale),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(journalArticleTranslations)
      .set({
        title: data.title,
        excerpt,
        bodyJson: data.bodyJson,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        recipeYieldLabel: data.recipeYieldLabel ?? null,
        recipeIngredients: data.recipeIngredients ?? null,
        recipeSteps: data.recipeSteps ?? null,
      })
      .where(eq(journalArticleTranslations.id, existing[0].id));
  } else {
    await db.insert(journalArticleTranslations).values({
      articleId: data.articleId,
      locale: data.locale,
      title: data.title,
      excerpt,
      bodyJson: data.bodyJson,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      recipeYieldLabel: data.recipeYieldLabel ?? null,
      recipeIngredients: data.recipeIngredients ?? null,
      recipeSteps: data.recipeSteps ?? null,
    });
  }

  if (readingMinutes !== undefined) {
    await db
      .update(journalArticles)
      .set({ readingMinutes, updatedAt: new Date() })
      .where(eq(journalArticles.id, data.articleId));
  } else {
    await db
      .update(journalArticles)
      .set({ updatedAt: new Date() })
      .where(eq(journalArticles.id, data.articleId));
  }

  revalidatePath(`/admin/journal/${data.articleId}`);
  return { ok: true };
}

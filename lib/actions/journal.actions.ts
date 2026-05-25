"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { journalArticles, journalArticleTranslations } from "@/lib/db/schema";
import { toSlug } from "@/lib/slug";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

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

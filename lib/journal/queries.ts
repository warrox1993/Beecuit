import "server-only";
import { db } from "@/lib/db";
import { journalArticles, journalArticleTranslations } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function listArticlesForAdmin() {
  const rows = await db.select().from(journalArticles).orderBy(desc(journalArticles.updatedAt));
  const translations = await db.select().from(journalArticleTranslations);
  return rows.map((a) => ({
    ...a,
    translations: translations.filter((t) => t.articleId === a.id).map((t) => t.locale),
  }));
}

export async function getArticleForAdmin(id: string) {
  const [article] = await db
    .select()
    .from(journalArticles)
    .where(eq(journalArticles.id, id))
    .limit(1);
  if (!article) return null;
  const translations = await db
    .select()
    .from(journalArticleTranslations)
    .where(eq(journalArticleTranslations.articleId, id));
  return { article, translations };
}

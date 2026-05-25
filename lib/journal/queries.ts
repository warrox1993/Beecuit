import "server-only";
import { db } from "@/lib/db";
import { journalArticles, journalArticleTranslations } from "@/lib/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";

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

export async function listPublishedArticles(opts: {
  locale: "fr" | "nl" | "en" | "de";
  category?: "recettes" | "savoir-faire" | "saisons" | "atelier";
  limit?: number;
  offset?: number;
}) {
  const rows = await db
    .select({ a: journalArticles, t: journalArticleTranslations })
    .from(journalArticles)
    .innerJoin(
      journalArticleTranslations,
      and(
        eq(journalArticleTranslations.articleId, journalArticles.id),
        eq(journalArticleTranslations.locale, opts.locale),
      ),
    )
    .where(
      and(
        eq(journalArticles.status, "published"),
        opts.category ? eq(journalArticles.category, opts.category) : undefined,
      ),
    )
    .orderBy(desc(journalArticles.publishedAt))
    .limit(opts.limit ?? 9)
    .offset(opts.offset ?? 0);
  return rows.map((r) => ({ ...r.a, translation: r.t }));
}

export async function countPublishedArticles(opts: {
  locale: "fr" | "nl" | "en" | "de";
  category?: "recettes" | "savoir-faire" | "saisons" | "atelier";
}) {
  const rows = await db
    .select({ id: journalArticles.id })
    .from(journalArticles)
    .innerJoin(
      journalArticleTranslations,
      and(
        eq(journalArticleTranslations.articleId, journalArticles.id),
        eq(journalArticleTranslations.locale, opts.locale),
      ),
    )
    .where(
      and(
        eq(journalArticles.status, "published"),
        opts.category ? eq(journalArticles.category, opts.category) : undefined,
      ),
    );
  return rows.length;
}

export async function getFeaturedArticle(locale: "fr" | "nl" | "en" | "de") {
  const rows = await db
    .select({ a: journalArticles, t: journalArticleTranslations })
    .from(journalArticles)
    .innerJoin(
      journalArticleTranslations,
      and(
        eq(journalArticleTranslations.articleId, journalArticles.id),
        eq(journalArticleTranslations.locale, locale),
      ),
    )
    .where(and(eq(journalArticles.isFeatured, true), eq(journalArticles.status, "published")))
    .limit(1);
  return rows[0] ? { ...rows[0].a, translation: rows[0].t } : null;
}

export async function getArticleBySlug(slug: string, locale: "fr" | "nl" | "en" | "de") {
  const [row] = await db
    .select({ a: journalArticles, t: journalArticleTranslations })
    .from(journalArticles)
    .leftJoin(
      journalArticleTranslations,
      and(
        eq(journalArticleTranslations.articleId, journalArticles.id),
        eq(journalArticleTranslations.locale, locale),
      ),
    )
    .where(eq(journalArticles.slug, slug))
    .limit(1);
  if (!row) return null;
  let fallback: typeof journalArticleTranslations.$inferSelect | null = null;
  if (!row.t && locale !== "fr") {
    const [fr] = await db
      .select()
      .from(journalArticleTranslations)
      .where(
        and(
          eq(journalArticleTranslations.articleId, row.a.id),
          eq(journalArticleTranslations.locale, "fr"),
        ),
      )
      .limit(1);
    fallback = fr ?? null;
  }
  return { article: row.a, translation: row.t, fallback };
}

export async function getAlsoRead(
  articleId: string,
  category: "recettes" | "savoir-faire" | "saisons" | "atelier",
  locale: "fr" | "nl" | "en" | "de",
  limit = 3,
) {
  return db
    .select({ a: journalArticles, t: journalArticleTranslations })
    .from(journalArticles)
    .innerJoin(
      journalArticleTranslations,
      and(
        eq(journalArticleTranslations.articleId, journalArticles.id),
        eq(journalArticleTranslations.locale, locale),
      ),
    )
    .where(
      and(
        eq(journalArticles.status, "published"),
        eq(journalArticles.category, category),
        ne(journalArticles.id, articleId),
      ),
    )
    .orderBy(sql`random()`)
    .limit(limit);
}

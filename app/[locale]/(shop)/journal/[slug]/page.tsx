import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalArticleTranslations } from "@/lib/db/schema";
import { getArticleBySlug, getAlsoRead } from "@/lib/journal/queries";
import { renderArticleBody } from "@/lib/journal/render";
import { JournalHero } from "@/components/journal/JournalHero";
import { JournalShareButtons } from "@/components/journal/JournalShareButtons";
import { RelatedProducts } from "@/components/journal/RelatedProducts";
import { JournalAlsoRead } from "@/components/journal/JournalAlsoRead";
import { JournalTableOfContents } from "@/components/journal/JournalTableOfContents";
import { RecipeBlock } from "@/components/journal/RecipeBlock";
import {
  articleJsonLd,
  recipeJsonLd,
  breadcrumbJsonLd,
} from "@/lib/journal/structured-data";
import { env } from "@/lib/env";
import type { ProseMirrorNode } from "@/lib/journal/prosemirror-types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "fr" | "nl" | "en" | "de"; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getArticleBySlug(slug, locale);
  if (!result) return {};
  const t = result.translation ?? result.fallback;
  if (!t) return {};

  // Look up every locale that has a translation for this article so we can
  // advertise accurate hreflang alternates. Slugs are shared across locales
  // (the article slug lives on `journalArticles`), so the URL pattern only
  // varies by the locale segment.
  const allTranslations = await db
    .select({ locale: journalArticleTranslations.locale })
    .from(journalArticleTranslations)
    .where(eq(journalArticleTranslations.articleId, result.article.id));

  const languages: Record<string, string> = {};
  for (const tr of allTranslations) {
    languages[tr.locale] = `/${tr.locale}/journal/${slug}`;
  }

  return {
    title: t.seoTitle ?? t.title,
    description: t.seoDescription ?? t.excerpt,
    alternates: {
      canonical: `/${locale}/journal/${slug}`,
      languages,
    },
    openGraph: {
      title: t.seoTitle ?? t.title,
      description: t.seoDescription ?? t.excerpt,
      type: "article",
      // The OG image is auto-discovered at /{locale}/journal/{slug}/opengraph-image
    },
  };
}

export default async function JournalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "fr" | "nl" | "en" | "de"; slug: string }>;
  searchParams: Promise<{ fallback?: string; preview?: string }>;
}) {
  const { locale, slug } = await params;
  const { fallback, preview } = await searchParams;
  setRequestLocale(locale);

  const result = await getArticleBySlug(slug, locale);
  if (!result) notFound();
  if (!preview && result.article.status !== "published") notFound();

  // Locale fallback: if translation missing for non-FR, redirect to FR with fallback flag
  if (!result.translation && locale !== "fr") {
    if (result.fallback) redirect(`/fr/journal/${slug}?fallback=1`);
    notFound();
  }
  const translation = (result.translation ?? result.fallback)!;

  const t = await getTranslations("journal");
  const body = translation.bodyJson as ProseMirrorNode;
  const isRecipe = result.article.category === "recettes";
  const alsoReadRaw = await getAlsoRead(
    result.article.id,
    result.article.category,
    locale,
  );
  const alsoRead = alsoReadRaw.map((r) => ({ ...r.a, translation: r.t }));

  const articleUrl = `${env.NEXT_PUBLIC_APP_URL}/${locale}/journal/${slug}`;
  const pinterestImage = result.article.pinterestImage || result.article.coverImage;

  return (
    <article className="bg-cream">
      {/* JSON-LD: Article + Breadcrumb (always) + Recipe (when applicable) */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd(result.article, translation, locale),
          ),
        }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(result.article, translation.title, locale),
          ),
        }}
      />
      {isRecipe &&
        (() => {
          const r = recipeJsonLd(result.article, translation);
          return r ? (
            <script
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: JSON.stringify(r) }}
            />
          ) : null;
        })()}
      <JournalHero article={result.article} translation={translation} locale={locale} />
      {fallback && (
        <div className="border-honey/40 bg-honey/10 container mx-auto my-4 max-w-prose rounded border p-3 text-center text-sm">
          {t("fallbackBanner")}
        </div>
      )}
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_3fr]">
        <aside className="hidden lg:block">
          <JournalTableOfContents body={body} />
        </aside>
        <div className="prose prose-warm-brown mx-auto max-w-prose">
          {isRecipe &&
            translation.recipeIngredients &&
            translation.recipeYieldLabel && (
              <RecipeBlock
                article={result.article}
                translation={translation}
                locale={locale}
              />
            )}
          {renderArticleBody(body)}
          {isRecipe && translation.recipeSteps && (
            <RecipeBlock.Steps steps={translation.recipeSteps} locale={locale} />
          )}
          <JournalShareButtons
            url={articleUrl}
            title={translation.title}
            excerpt={translation.excerpt}
            pinterestImage={pinterestImage}
          />
        </div>
      </div>
      <RelatedProducts
        body={body}
        featured={result.article.featuredProductSlugs}
        category={result.article.category}
        locale={locale}
      />
      <JournalAlsoRead articles={alsoRead} locale={locale} />
    </article>
  );
}

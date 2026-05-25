import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getArticleBySlug, getAlsoRead } from "@/lib/journal/queries";
import { renderArticleBody } from "@/lib/journal/render";
import { JournalHero } from "@/components/journal/JournalHero";
import { JournalShareButtons } from "@/components/journal/JournalShareButtons";
import { RelatedProducts } from "@/components/journal/RelatedProducts";
import { JournalAlsoRead } from "@/components/journal/JournalAlsoRead";
import { JournalTableOfContents } from "@/components/journal/JournalTableOfContents";
import { RecipeBlock } from "@/components/journal/RecipeBlock";
import { env } from "@/lib/env";
import type { ProseMirrorNode } from "@/lib/journal/prosemirror-types";

export const dynamic = "force-dynamic";

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
              <RecipeBlock article={result.article} translation={translation} />
            )}
          {renderArticleBody(body)}
          {isRecipe && translation.recipeSteps && (
            <RecipeBlock.Steps steps={translation.recipeSteps} />
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

import { setRequestLocale, getTranslations } from "next-intl/server";
import { listPublishedArticles, getFeaturedArticle } from "@/lib/journal/queries";
import { JournalCard } from "@/components/journal/JournalCard";
import { JournalFeaturedHero } from "@/components/journal/JournalFeaturedHero";
import { JournalCategoryFilter } from "@/components/journal/JournalCategoryFilter";
import { EmptyState } from "@/components/common/EmptyState";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "fr" | "nl" | "en" | "de" }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("journal");

  const PAGE_SIZE = 9;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const [articlesRaw, featured] = await Promise.all([
    listPublishedArticles({ locale, limit: PAGE_SIZE, offset: (pageNum - 1) * PAGE_SIZE }),
    getFeaturedArticle(locale),
  ]);
  // Exclude the featured article from the grid — it's already shown in the hero above
  const articles = featured ? articlesRaw.filter((a) => a.id !== featured.id) : articlesRaw;

  return (
    <section className="container mx-auto px-4 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-warm-brown font-display text-5xl">{t("title")}</h1>
        <p className="text-warm-brown/70 mx-auto mt-4 max-w-xl">{t("lead")}</p>
      </header>
      {featured && <JournalFeaturedHero article={featured} locale={locale} />}
      <JournalCategoryFilter locale={locale} />
      {articles.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <JournalCard key={a.id} article={a} locale={locale} />
          ))}
        </div>
      )}
      {articles.length === PAGE_SIZE && (
        <div className="mt-12 text-center">
          <a href={`/${locale}/journal?page=${pageNum + 1}`} className="text-honey-dark underline">
            Page suivante →
          </a>
        </div>
      )}
    </section>
  );
}

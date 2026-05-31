import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { listPublishedArticles } from "@/lib/journal/queries";
import { JournalCard } from "@/components/journal/JournalCard";
import { JournalCategoryFilter } from "@/components/journal/JournalCategoryFilter";
import { EmptyState } from "@/components/common/EmptyState";

const VALID_CATEGORIES = ["recettes", "savoir-faire", "saisons", "atelier"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "fr" | "nl" | "en" | "de"; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!VALID_CATEGORIES.includes(slug as (typeof VALID_CATEGORIES)[number])) {
    return {};
  }
  const tCat = await getTranslations({ locale, namespace: "journal.categories" });
  const tSeo = await getTranslations({ locale, namespace: "seo.journal" });
  return buildPageMetadata({
    title: `${tCat(slug)} — ${tSeo("title")}`,
    description: tSeo("description"),
    path: `/journal/categorie/${slug}`,
    locale,
  });
}

export const dynamic = "force-dynamic";

export default async function JournalCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "fr" | "nl" | "en" | "de"; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  const { page } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("journal");

  if (!VALID_CATEGORIES.includes(slug as Category)) notFound();
  const category = slug as Category;

  const PAGE_SIZE = 9;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const articles = await listPublishedArticles({
    locale,
    category,
    limit: PAGE_SIZE,
    offset: (pageNum - 1) * PAGE_SIZE,
  });

  return (
    <section className="container mx-auto px-4 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-warm-brown font-display text-5xl">{t("title")}</h1>
        <p className="text-warm-brown/70 mx-auto mt-4 max-w-xl">{t(`categories.${category}`)}</p>
      </header>
      <JournalCategoryFilter active={category} locale={locale} />
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
          <a
            href={`/${locale}/journal/categorie/${category}?page=${pageNum + 1}`}
            className="text-honey-dark underline"
          >
            Page suivante →
          </a>
        </div>
      )}
    </section>
  );
}

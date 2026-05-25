import { getTranslations } from "next-intl/server";
import { JournalCard } from "./JournalCard";

type Locale = "fr" | "nl" | "en" | "de";

export async function JournalAlsoRead({
  articles,
  locale,
}: {
  articles: Array<{
    id: string;
    slug: string;
    coverImage: string;
    coverAltFr: string;
    category: string;
    readingMinutes: number;
    publishedAt: Date | null;
    translation: { title: string; excerpt: string };
  }>;
  locale: Locale;
}) {
  if (articles.length === 0) return null;
  const t = await getTranslations("journal");
  return (
    <section className="container mx-auto my-16 px-4">
      <h2 className="text-warm-brown font-display mb-8 text-center text-3xl">
        {t("alsoRead")}
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {articles.map((a) => (
          <JournalCard key={a.id} article={a} locale={locale} />
        ))}
      </div>
    </section>
  );
}

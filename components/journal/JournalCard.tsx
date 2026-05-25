import Link from "next/link";
import Image from "next/image";

type Locale = "fr" | "nl" | "en" | "de";

const CATEGORY_LABELS: Record<string, Record<Locale, string>> = {
  recettes: { fr: "Recettes", nl: "Recepten", en: "Recipes", de: "Rezepte" },
  "savoir-faire": { fr: "Savoir-faire", nl: "Vakmanschap", en: "Craft", de: "Handwerk" },
  saisons: { fr: "Saisons", nl: "Seizoenen", en: "Seasons", de: "Jahreszeiten" },
  atelier: { fr: "L'atelier", nl: "Het atelier", en: "The atelier", de: "Die Werkstatt" },
};

export function JournalCard({
  article,
  locale,
}: {
  article: {
    slug: string;
    coverImage: string;
    coverAltFr: string;
    category: string;
    readingMinutes: number;
    publishedAt: Date | null;
    translation: { title: string; excerpt: string };
  };
  locale: Locale;
}) {
  const categoryLabel = CATEGORY_LABELS[article.category]?.[locale] ?? article.category;
  const dateLabel = article.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(article.publishedAt)
    : "";

  return (
    <Link
      href={`/${locale}/journal/${article.slug}`}
      prefetch
      className="group block overflow-hidden rounded-lg border border-warm-brown/10 bg-white transition hover:border-honey/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={article.coverImage}
          alt={article.coverAltFr}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="text-warm-brown/60 text-xs uppercase tracking-wider">
          {categoryLabel} · {article.readingMinutes} min
        </div>
        <h3 className="text-warm-brown font-display mt-2 line-clamp-2 text-xl">
          {article.translation.title}
        </h3>
        <p className="text-warm-brown/70 mt-2 line-clamp-3 text-sm">
          {article.translation.excerpt}
        </p>
        {dateLabel && (
          <div className="text-warm-brown/50 mt-3 text-xs italic">{dateLabel}</div>
        )}
      </div>
    </Link>
  );
}

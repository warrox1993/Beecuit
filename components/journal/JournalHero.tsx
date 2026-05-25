import Image from "next/image";

type Locale = "fr" | "nl" | "en" | "de";

const CATEGORY_LABELS: Record<string, Record<Locale, string>> = {
  recettes: { fr: "Recettes", nl: "Recepten", en: "Recipes", de: "Rezepte" },
  "savoir-faire": { fr: "Savoir-faire", nl: "Vakmanschap", en: "Craft", de: "Handwerk" },
  saisons: { fr: "Saisons", nl: "Seizoenen", en: "Seasons", de: "Jahreszeiten" },
  atelier: { fr: "L'atelier", nl: "Het atelier", en: "The atelier", de: "Die Werkstatt" },
};

export function JournalHero({
  article,
  translation,
  locale,
}: {
  article: {
    coverImage: string;
    coverAltFr: string;
    category: string;
    readingMinutes: number;
    publishedAt: Date | null;
    author: string;
  };
  translation: { title: string; excerpt: string };
  locale: Locale;
}) {
  const dateLabel = article.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(article.publishedAt)
    : "";
  const categoryLabel = CATEGORY_LABELS[article.category]?.[locale] ?? article.category;

  return (
    <header className="relative isolate w-full overflow-hidden">
      <div className="relative h-[60vh] min-h-[480px] w-full">
        <Image
          src={article.coverImage}
          alt={article.coverAltFr}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="from-warm-brown/30 via-warm-brown/40 to-warm-brown/70 absolute inset-0 bg-gradient-to-b" />
        <div className="absolute inset-0 flex items-center">
          <div className="text-cream container mx-auto max-w-3xl px-4 text-center">
            <div className="font-script text-honey text-2xl">
              {categoryLabel} · {article.readingMinutes} min
            </div>
            <h1 className="font-display mt-4 text-4xl md:text-6xl">{translation.title}</h1>
            <p className="mt-6 text-lg italic opacity-90">{translation.excerpt}</p>
            <div className="mt-8 text-sm opacity-80">
              {article.author}
              {dateLabel ? ` · ${dateLabel}` : ""}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

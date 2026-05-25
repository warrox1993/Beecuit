import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getFeaturedArticle } from "@/lib/journal/queries";

type Locale = "fr" | "nl" | "en" | "de";

const CATEGORY_LABELS: Record<string, Record<Locale, string>> = {
  recettes: { fr: "Recettes", nl: "Recepten", en: "Recipes", de: "Rezepte" },
  "savoir-faire": { fr: "Savoir-faire", nl: "Vakmanschap", en: "Craft", de: "Handwerk" },
  saisons: { fr: "Saisons", nl: "Seizoenen", en: "Seasons", de: "Jahreszeiten" },
  atelier: { fr: "L'atelier", nl: "Het atelier", en: "The atelier", de: "Die Werkstatt" },
};

export async function JournalFeatured({ locale }: { locale: string }) {
  const safeLocale: Locale = (["fr", "nl", "en", "de"] as const).includes(locale as Locale)
    ? (locale as Locale)
    : "fr";
  const featured = await getFeaturedArticle(safeLocale);
  if (!featured) return null;
  const t = await getTranslations("journal.featured");
  const categoryLabel = CATEGORY_LABELS[featured.category]?.[safeLocale] ?? featured.category;

  return (
    <section className="container mx-auto my-24 grid items-center gap-8 px-4 lg:grid-cols-[3fr_2fr]">
      <Link
        href={`/${locale}/journal/${featured.slug}`}
        prefetch
        className="block overflow-hidden rounded-lg"
      >
        <div className="relative aspect-video">
          <Image
            src={featured.coverImage}
            alt={featured.coverAltFr}
            width={960}
            height={540}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="aspect-video object-cover transition hover:scale-105"
          />
        </div>
      </Link>
      <div>
        <div className="font-script text-honey-dark text-2xl">{t("eyebrow")}</div>
        <div className="text-warm-brown/60 mt-2 text-sm uppercase tracking-wider">
          {categoryLabel} · {featured.readingMinutes} min
        </div>
        <h2 className="text-warm-brown font-display mt-4 line-clamp-2 text-4xl">
          {featured.translation.title}
        </h2>
        <p className="text-warm-brown/80 mt-2 line-clamp-2">{featured.translation.excerpt}</p>
        <div className="mt-6 flex items-center gap-6">
          <Link
            href={`/${locale}/journal/${featured.slug}`}
            className="border-warm-brown text-warm-brown hover:bg-warm-brown hover:text-cream rounded border px-6 py-3 text-sm transition"
          >
            {t("cta")}
          </Link>
          <Link
            href={`/${locale}/journal`}
            className="text-warm-brown/70 text-sm underline hover:no-underline"
          >
            {t("all")}
          </Link>
        </div>
      </div>
    </section>
  );
}

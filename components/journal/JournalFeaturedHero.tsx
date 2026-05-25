import Link from "next/link";
import Image from "next/image";

type Locale = "fr" | "nl" | "en" | "de";

export function JournalFeaturedHero({
  article,
  locale,
}: {
  article: {
    slug: string;
    coverImage: string;
    coverAltFr: string;
    category: string;
    readingMinutes: number;
    translation: { title: string; excerpt: string };
  };
  locale: Locale;
}) {
  return (
    <article className="mb-12 grid items-center gap-8 lg:grid-cols-[3fr_2fr]">
      <Link
        href={`/${locale}/journal/${article.slug}`}
        prefetch
        className="block overflow-hidden rounded-lg"
      >
        <div className="relative aspect-[16/9]">
          <Image
            src={article.coverImage}
            alt={article.coverAltFr}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
            className="object-cover transition hover:scale-105"
          />
        </div>
      </Link>
      <div>
        <div className="text-warm-brown/60 text-xs uppercase tracking-wider">
          {article.category} · {article.readingMinutes} min
        </div>
        <h2 className="text-warm-brown font-display mt-3 line-clamp-2 text-4xl">
          {article.translation.title}
        </h2>
        <p className="text-warm-brown/80 mt-3 line-clamp-3">
          {article.translation.excerpt}
        </p>
        <Link
          href={`/${locale}/journal/${article.slug}`}
          className="mt-6 inline-block rounded border border-warm-brown px-6 py-3 text-sm text-warm-brown transition hover:bg-warm-brown hover:text-cream"
        >
          Lire l&apos;article
        </Link>
      </div>
    </article>
  );
}

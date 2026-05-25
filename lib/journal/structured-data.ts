import { env } from "@/lib/env";
import { toIsoDuration } from "./duration";

export type StructuredArticle = {
  slug: string;
  category: string;
  coverImage: string;
  publishedAt: Date | null;
  updatedAt: Date;
  recipePrepMin: number | null;
  recipeCookMin: number | null;
  author: string;
};

export type StructuredTranslation = {
  title: string;
  excerpt: string;
  recipeYieldLabel: string | null;
  recipeIngredients: Array<{ name: string; qty: string; unit: string }> | null;
  recipeSteps: Array<{ n: number; text: string }> | null;
};

export function articleJsonLd(
  article: StructuredArticle,
  t: StructuredTranslation,
  locale: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t.title,
    image: [article.coverImage],
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { "@type": "Organization", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "Au Fil des Saveurs",
      logo: { "@type": "ImageObject", url: `${env.NEXT_PUBLIC_APP_URL}/logo.png` },
    },
    description: t.excerpt,
    mainEntityOfPage: `${env.NEXT_PUBLIC_APP_URL}/${locale}/journal/${article.slug}`,
  };
}

export function recipeJsonLd(article: StructuredArticle, t: StructuredTranslation) {
  if (!t.recipeIngredients || !t.recipeSteps) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: t.title,
    image: [article.coverImage],
    author: { "@type": "Organization", name: article.author },
    datePublished: article.publishedAt?.toISOString(),
    description: t.excerpt,
    prepTime: toIsoDuration(article.recipePrepMin),
    cookTime: toIsoDuration(article.recipeCookMin),
    totalTime: toIsoDuration(
      (article.recipePrepMin ?? 0) + (article.recipeCookMin ?? 0),
    ),
    recipeYield: t.recipeYieldLabel,
    recipeIngredient: t.recipeIngredients.map((i) =>
      `${i.qty}${i.unit ? ` ${i.unit}` : ""} ${i.name}`.trim(),
    ),
    recipeInstructions: t.recipeSteps.map((s) => ({
      "@type": "HowToStep",
      position: s.n,
      text: s.text,
    })),
  };
}

const CATEGORY_LABELS_FR: Record<string, string> = {
  recettes: "Recettes",
  "savoir-faire": "Savoir-faire",
  saisons: "Saisons",
  atelier: "L'atelier",
};

export function breadcrumbJsonLd(
  article: { slug: string; category: string },
  title: string,
  locale: string,
) {
  const base = `${env.NEXT_PUBLIC_APP_URL}/${locale}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: base },
      { "@type": "ListItem", position: 2, name: "Journal", item: `${base}/journal` },
      {
        "@type": "ListItem",
        position: 3,
        name: CATEGORY_LABELS_FR[article.category] ?? article.category,
        item: `${base}/journal/categorie/${article.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: title,
        item: `${base}/journal/${article.slug}`,
      },
    ],
  };
}

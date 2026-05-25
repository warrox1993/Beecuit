"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Cat = "recettes" | "savoir-faire" | "saisons" | "atelier";

export function JournalCategoryFilter({
  active,
  locale,
}: {
  active?: Cat;
  locale: "fr" | "nl" | "en" | "de";
}) {
  const t = useTranslations("journal.categories");
  const cats: Array<{ slug: Cat | null; label: string }> = [
    { slug: null, label: t("all") },
    { slug: "recettes", label: t("recettes") },
    { slug: "savoir-faire", label: t("savoir-faire") },
    { slug: "saisons", label: t("saisons") },
    { slug: "atelier", label: t("atelier") },
  ];

  return (
    <nav className="my-8 flex flex-wrap justify-center gap-2" aria-label="Catégories">
      {cats.map((c) => {
        const href = c.slug
          ? `/${locale}/journal/categorie/${c.slug}`
          : `/${locale}/journal`;
        const isActive = c.slug === (active ?? null);
        return (
          <Link
            key={c.slug ?? "all"}
            href={href}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              isActive
                ? "border-honey bg-honey/20 text-honey-dark"
                : "border-warm-brown/20 text-warm-brown hover:bg-cream/50"
            }`}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}

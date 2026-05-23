import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string };

export function CategoryFilter({
  categories,
  activeSlug,
  allLabel,
  variant = "chips",
}: {
  categories: Cat[];
  activeSlug?: string;
  allLabel: string;
  variant?: "chips" | "sidebar";
}) {
  const base = "/biscuits";
  if (variant === "sidebar") {
    return (
      <aside className="w-56 shrink-0 hidden md:block">
        <nav className="space-y-1">
          <Link
            href={base}
            className={cn(
              "block rounded px-3 py-2 text-sm transition-colors",
              !activeSlug
                ? "bg-honey/10 text-honey-dark font-medium"
                : "text-warm-brown hover:bg-honey/5",
            )}
          >
            {allLabel}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={{ pathname: base, query: { categorie: c.slug } }}
              className={cn(
                "block rounded px-3 py-2 text-sm transition-colors",
                activeSlug === c.slug
                  ? "bg-honey/10 text-honey-dark font-medium"
                  : "text-warm-brown hover:bg-honey/5",
              )}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </aside>
    );
  }
  return (
    <nav className="flex flex-wrap gap-2 pb-6 md:hidden">
      <Link
        href={base}
        className={cn(
          "rounded-full border px-3 py-1 text-sm",
          !activeSlug
            ? "border-honey bg-honey/10 text-honey-dark"
            : "border-warm-brown/20 text-warm-brown hover:border-honey/50",
        )}
      >
        {allLabel}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={{ pathname: base, query: { categorie: c.slug } }}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            activeSlug === c.slug
              ? "border-honey bg-honey/10 text-honey-dark"
              : "border-warm-brown/20 text-warm-brown hover:border-honey/50",
          )}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DotFlourish } from "@/components/brand/Ornaments";

type Cat = { slug: string; name: string };

/**
 * CategoryFilter — Au Fil des Saveurs (Phase 4C honey-cream pills).
 *
 * sidebar: vertical list of pill buttons honey-dark filled when active,
 * with a mini DotFlourish + eyebrow header.
 * chips: horizontal scroll on mobile, same pill styling.
 */
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
  const pillBase =
    "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200";
  const pillActive =
    "bg-honey-dark text-cream shadow-[0_4px_12px_-4px_rgba(176,122,14,0.45)] ring-1 ring-honey-dark/30";
  const pillInactive =
    "border border-warm-brown/25 text-warm-brown hover:border-honey-dark hover:bg-cream-light hover:text-honey-dark";

  if (variant === "sidebar") {
    return (
      <aside className="hidden w-60 shrink-0 md:block">
        <header className="mb-4 flex items-center gap-3 px-1">
          <p className="text-honey-dark text-[0.65rem] font-semibold tracking-[0.18em] uppercase">
            Filtrer
          </p>
          <DotFlourish className="text-honey-dark/55 h-2 w-12" />
        </header>
        <nav className="flex flex-col gap-2">
          <Link
            href={base}
            className={cn(pillBase, "w-fit", !activeSlug ? pillActive : pillInactive)}
          >
            {allLabel}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={{ pathname: base, query: { categorie: c.slug } }}
              className={cn(
                pillBase,
                "w-fit",
                activeSlug === c.slug ? pillActive : pillInactive,
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
    <nav
      className="-mx-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-6 pb-6 md:hidden"
      aria-label="Filtres catégories"
    >
      <Link
        href={base}
        className={cn(pillBase, "shrink-0 snap-start", !activeSlug ? pillActive : pillInactive)}
      >
        {allLabel}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={{ pathname: base, query: { categorie: c.slug } }}
          className={cn(
            pillBase,
            "shrink-0 snap-start",
            activeSlug === c.slug ? pillActive : pillInactive,
          )}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

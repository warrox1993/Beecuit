import { Link } from "@/i18n/navigation";

type Cat = { slug: string; name: string };

export function CategoryFilter({
  categories,
  activeSlug,
  allLabel,
}: {
  categories: Cat[];
  activeSlug?: string;
  allLabel: string;
}) {
  const base = "/biscuits";
  return (
    <nav className="flex flex-wrap gap-2 pb-6">
      <Link
        href={base}
        className={`rounded-full border px-3 py-1 text-sm ${!activeSlug ? "border-honey bg-honey/10 text-honey-dark" : "border-warm-brown/20 text-warm-brown hover:border-honey/50"}`}
      >
        {allLabel}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={{ pathname: base, query: { categorie: c.slug } }}
          className={`rounded-full border px-3 py-1 text-sm ${activeSlug === c.slug ? "border-honey bg-honey/10 text-honey-dark" : "border-warm-brown/20 text-warm-brown hover:border-honey/50"}`}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

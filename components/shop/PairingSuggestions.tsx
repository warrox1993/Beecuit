import { getPairingsForCategory } from "@/lib/pairings";
import { DotFlourish } from "@/components/brand/Ornaments";

/**
 * PairingSuggestions — Au Fil des Saveurs (Phase 4G).
 *
 * Three pairing cards on the biscuit detail page. Static mapping by
 * categorySlug in lib/pairings.ts.
 */
export function PairingSuggestions({
  categorySlug,
  title = "Suggestions d'accord",
  scriptAccent = "Pairing",
}: {
  categorySlug: string | null | undefined;
  title?: string;
  scriptAccent?: string;
}) {
  const pairings = getPairingsForCategory(categorySlug);
  return (
    <section className="bg-surface-elevated mt-12 rounded-3xl border border-warm-brown/10 px-6 py-10 md:px-10 md:py-12">
      <header className="mb-6 text-center">
        <DotFlourish className="text-honey-dark/55 mx-auto mb-3 h-2 w-14" />
        <h2 className="font-display text-warm-brown text-[1.5rem] leading-tight">
          {title}{" "}
          <span className="text-honey-dark font-script text-[1.5em] leading-none">
            {scriptAccent}
          </span>
        </h2>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {pairings.map((p) => (
          <div
            key={p.label}
            className="border-warm-brown/10 hover:border-honey-dark/35 bg-cream-light/60 rounded-2xl border p-5 text-center transition-colors"
          >
            <p aria-hidden className="text-3xl">
              {p.emoji}
            </p>
            <p className="text-warm-brown font-display mt-3 text-base leading-tight">
              {p.label}
            </p>
            <p className="text-warm-brown/70 mt-2 text-xs italic leading-snug">{p.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

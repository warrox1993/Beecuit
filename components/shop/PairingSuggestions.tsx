import Image from "next/image";
import { getPairingsForCategory, type Pairing } from "@/lib/pairings";
import { DotFlourish } from "@/components/brand/Ornaments";

/**
 * PairingSuggestions — Au Fil des Saveurs.
 *
 * Three pairing cards on the biscuit detail page. Static mapping by
 * categorySlug in lib/pairings.ts.
 *
 * Refactor 2026-05-25 : photo full-bleed en background avec gradient mocha
 * vertical, eyebrow doré + label Fraunces + hint italic ancrés en bas-gauche
 * et filet doré inset pour sertir la card façon menu Pierre Hermé.
 */

const ROMAN = ["I", "II", "III"];

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
    <section className="mt-12 rounded-3xl bg-surface-elevated border border-warm-brown/10 px-6 py-10 md:px-10 md:py-12">
      <header className="mb-8 text-center">
        <DotFlourish className="text-honey-dark/55 mx-auto mb-3 h-2 w-14" />
        <h2 className="font-display text-warm-brown text-[1.5rem] leading-tight">
          {title}{" "}
          <span className="text-honey-dark font-script text-[1.5em] leading-none">
            {scriptAccent}
          </span>
        </h2>
      </header>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {pairings.map((p, i) => (
          <PairingCard key={p.label} pairing={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function PairingCard({ pairing, index }: { pairing: Pairing; index: number }) {
  const roman = ROMAN[index] ?? String(index + 1);
  return (
    <article
      role="group"
      aria-label={`${pairing.label} — ${pairing.hint}`}
      className="group bg-warm-brown ring-cream-gold/30 hover:ring-cream-gold/60 relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_8px_24px_-12px_rgba(44,24,16,0.45)] ring-1 ring-inset transition-shadow duration-500 hover:shadow-[0_16px_40px_-16px_rgba(44,24,16,0.55)]"
    >
      <Image
        src={pairing.imageUrl}
        alt={pairing.imageAlt}
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      {/* Gradient overlay — image visible en haut, chocolat opaque en bas pour ancrer le texte */}
      <div
        aria-hidden
        className="from-warm-brown/95 via-warm-brown/40 group-hover:via-warm-brown/55 absolute inset-0 bg-gradient-to-t to-transparent transition-opacity duration-500"
      />
      {/* Watermark Pinyon en haut à droite */}
      <span
        aria-hidden
        className="font-script text-honey-dark/20 absolute top-2 right-4 select-none text-[5rem] leading-none"
      >
        {roman}
      </span>
      {/* Texte ancré bottom-left */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-12">
        <p className="text-cream-gold/85 mb-2 text-[0.65rem] uppercase tracking-[0.25em]">
          Accord {roman}
        </p>
        <h3 className="font-display text-cream-light text-[1.25rem] leading-tight">
          {pairing.label}
        </h3>
        <p className="font-display text-cream-light/80 mt-1.5 text-sm italic leading-snug">
          {pairing.hint}
        </p>
      </div>
    </article>
  );
}

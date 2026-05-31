import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { CornerScallop } from "@/components/brand/Ornaments";

type Props = {
  slug: string;
  name: string;
  primaryImageUrl: string | null;
  categoryName: string | null;
  basePriceCents: number;
  stockQuantity: number;
  outOfStockLabel: string;
  type?: "biscuit" | "coffret" | "subscription_plan" | "gift_card";
  displayedPriceCents?: number;
};

/**
 * ProductCard — Au Fil des Saveurs (Phase 4C premium).
 *
 * Premium frame with offset gold border, hover gold corner scallop +
 * subtle image zoom, price block as cartouche with gold border.
 * Used in `/biscuits` listing.
 */
export function ProductCard(p: Props) {
  const isCoffret = p.type === "coffret";
  // Coffrets have stockQuantity=0 by design; out-of-stock handled at coffret detail.
  const isOut = !isCoffret && p.stockQuantity <= 0;
  const priceCents = p.displayedPriceCents ?? p.basePriceCents;
  const priceEur = (priceCents / 100).toFixed(2).replace(".", ",");
  const href = isCoffret ? `/coffrets/${p.slug}` : `/biscuits/${p.slug}`;
  return (
    <Link href={href} className="group block">
      <div className="relative">
        {/* Offset gold frame, revealed at hover */}
        <div className="border-cream-gold/0 group-hover:border-cream-gold/55 pointer-events-none absolute -bottom-2 -left-2 z-0 h-full w-full rounded-[1.1rem] border transition-colors duration-300" />

        {/* Image */}
        <div className="bg-cookie/30 ring-warm-brown/5 group-hover:ring-honey-dark/30 relative z-10 aspect-[4/5] overflow-hidden rounded-2xl ring-1 transition-all duration-300">
          {p.primaryImageUrl ? (
            <Image
              src={p.primaryImageUrl}
              alt={p.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl opacity-30">
              {isCoffret ? "📦" : "🍪"}
            </div>
          )}

          {/* Coffret badge — ornamental gold */}
          {isCoffret && (
            <span className="bg-cream-gold text-brand-chocolate absolute top-3 left-3 rounded-full px-3 py-1 text-[0.65rem] font-semibold tracking-[0.15em] uppercase shadow-[0_2px_8px_rgba(44,24,16,0.2)]">
              Coffret
            </span>
          )}

          {/* Out of stock badge */}
          {isOut && (
            <span className="bg-terracotta text-cream absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-medium tracking-wider uppercase shadow-[0_2px_8px_rgba(44,24,16,0.25)]">
              {p.outOfStockLabel}
            </span>
          )}

          {/* Hover scallop ornament */}
          <CornerScallop
            corner="br"
            className="text-cream-gold absolute right-2 bottom-2 h-7 w-7 opacity-0 transition-opacity duration-300 group-hover:opacity-90"
          />

          {/* Bottom scrim for image cohesion */}
          <div className="from-brand-chocolate/0 group-hover:from-brand-chocolate/20 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent transition-all duration-300" />
        </div>
      </div>

      {/* Card text body */}
      <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {p.categoryName && <Eyebrow className="text-[0.65rem]">{p.categoryName}</Eyebrow>}
          <p className="text-warm-brown group-hover:text-honey-dark font-display truncate text-[1.05rem] leading-tight transition-colors">
            {p.name}
          </p>
        </div>
        {/* Price cartouche */}
        <span className="text-honey-dark border-honey-dark/30 group-hover:border-honey-dark/70 group-hover:bg-honey-dark/5 inline-flex shrink-0 items-baseline rounded-full border px-3 py-1 font-display text-[0.95rem] transition-colors">
          {priceEur}&nbsp;€
        </span>
      </div>
    </Link>
  );
}

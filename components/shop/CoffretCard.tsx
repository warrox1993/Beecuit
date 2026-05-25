import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RopeDivider } from "@/components/brand/Ornaments";

type Props = {
  locale: string;
  coffret: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    primaryImageUrl: string | null;
    price: {
      totalCents: number;
      subtotalCents: number;
      discountCents: number;
      discountPercent: number;
    };
    available: boolean;
    breakdownNames?: string[];
  };
};

function fmt(c: number) {
  return (c / 100).toFixed(2).replace(".", ",") + " €";
}

/**
 * CoffretCard — Au Fil des Saveurs (Phase 4C gift-box premium).
 *
 * Composition reveal on hover (max-h transition), gold ribbon under image,
 * coffret badge as cream-gold pill, discount strikethrough on subtotal.
 */
export async function CoffretCard({ locale, coffret }: Props) {
  const t = await getTranslations("catalog");
  const includesLabel = t("coffretIncludes");
  const breakdownNames = coffret.breakdownNames ?? [];
  return (
    <Link href={`/${locale}/coffrets/${coffret.slug}`} className="group block">
      <article className="bg-cream-light border-warm-brown/8 hover:border-honey-dark/35 relative overflow-hidden rounded-2xl border shadow-[0_8px_24px_-16px_rgba(44,24,16,0.22)] transition-all duration-300 hover:shadow-[0_18px_40px_-20px_rgba(44,24,16,0.32)]">
        {/* — Image — */}
        <div className="bg-cookie/30 relative aspect-[4/5] overflow-hidden">
          {coffret.primaryImageUrl ? (
            <Image
              src={coffret.primaryImageUrl}
              alt={coffret.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl opacity-30">
              📦
            </div>
          )}
          {/* Coffret badge ornamental */}
          <span className="bg-cream-gold text-brand-chocolate absolute top-3 left-3 rounded-full px-3 py-1 text-[0.65rem] font-semibold tracking-[0.15em] uppercase shadow-[0_2px_8px_rgba(44,24,16,0.2)]">
            {t("coffretBadge")}
          </span>
          {/* Discount badge */}
          {coffret.price.discountCents > 0 && (
            <span className="bg-leaf/90 text-cream absolute top-3 right-3 rounded-full px-3 py-1 text-[0.7rem] font-semibold shadow-[0_2px_8px_rgba(44,24,16,0.18)]">
              −{coffret.price.discountPercent}%
            </span>
          )}
          {/* Indisponible overlay badge */}
          {!coffret.available && (
            <span className="bg-warm-brown/90 text-cream absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs uppercase">
              Indisponible
            </span>
          )}
          {/* Bottom scrim for cohesion */}
          <div className="from-brand-chocolate/35 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />

          {/* — Composition reveal overlay (hover) — */}
          {breakdownNames.length > 0 && (
            <div className="bg-brand-chocolate/85 text-cream-gold pointer-events-none absolute right-3 bottom-3 left-3 max-h-0 overflow-hidden rounded-xl opacity-0 backdrop-blur-sm transition-all duration-400 ease-out group-hover:max-h-44 group-hover:opacity-100 motion-reduce:max-h-44 motion-reduce:opacity-100">
              <div className="p-3 text-left">
                <p className="font-script mb-1 text-base">{includesLabel}</p>
                <ul className="text-cream space-y-0.5 text-[0.78rem] leading-tight">
                  {breakdownNames.map((n) => (
                    <li key={n} className="flex items-start gap-1.5">
                      <span aria-hidden className="text-cream-gold mt-0.5">
                        ◆
                      </span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* — Gold ribbon below image — */}
        <RopeDivider variant="straight" className="text-honey-dark/60 -mt-px" />

        {/* — Card body — */}
        <div className="p-5">
          <h3 className="text-warm-brown group-hover:text-honey-dark font-display text-[1.15rem] leading-tight transition-colors">
            {coffret.name}
          </h3>
          <p className="text-warm-brown/70 mt-1.5 line-clamp-2 text-[0.85rem] leading-snug">
            {coffret.shortDescription}
          </p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-honey-dark border-honey-dark/30 group-hover:border-honey-dark/70 group-hover:bg-honey-dark/5 inline-flex items-baseline rounded-full border px-3 py-1 font-display text-[1rem] transition-colors">
              {fmt(coffret.price.totalCents)}
            </span>
            {coffret.price.discountCents > 0 && (
              <span className="text-warm-brown/55 text-xs line-through">
                {fmt(coffret.price.subtotalCents)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";

type Props = {
  slug: string;
  name: string;
  primaryImageUrl: string | null;
  categoryName: string | null;
  basePriceCents: number;
  stockQuantity: number;
  outOfStockLabel: string;
};

export function ProductCard(p: Props) {
  const isOut = p.stockQuantity <= 0;
  const priceEur = (p.basePriceCents / 100).toFixed(2);
  return (
    <Link href={`/biscuits/${p.slug}`} className="group block">
      <div className="bg-cookie/30 relative aspect-[4/5] overflow-hidden rounded-xl">
        {p.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.primaryImageUrl}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl opacity-30">🍪</div>
        )}
        {isOut && (
          <span className="bg-terracotta text-cream absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider">
            {p.outOfStockLabel}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1">
        {p.categoryName && <Eyebrow>{p.categoryName}</Eyebrow>}
        <p className="text-warm-brown font-display text-lg leading-tight">{p.name}</p>
        <p className="text-honey-dark font-display text-base">{priceEur} €</p>
      </div>
    </Link>
  );
}

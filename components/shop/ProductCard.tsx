import { Link } from "@/i18n/navigation";

type Props = {
  slug: string;
  name: string;
  shortDescription: string;
  primaryImageUrl: string | null;
  basePriceCents: number;
  stockQuantity: number;
  outOfStockLabel: string;
};

export function ProductCard(p: Props) {
  const isOut = p.stockQuantity <= 0;
  const priceEur = (p.basePriceCents / 100).toFixed(2);
  return (
    <Link
      href={`/biscuits/${p.slug}`}
      className={`group border-warm-brown/10 block overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md ${isOut ? "opacity-60" : ""}`}
    >
      <div className="bg-soft-rose aspect-square">
        {p.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.primaryImageUrl} alt={p.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-warm-brown font-display text-lg">{p.name}</h3>
        <p className="text-warm-brown/70 line-clamp-2 text-sm">{p.shortDescription}</p>
        <div className="flex items-center justify-between">
          <span className="text-honey-dark font-mono text-base">{priceEur} €</span>
          {isOut && <span className="text-terracotta text-xs">{p.outOfStockLabel}</span>}
        </div>
      </div>
    </Link>
  );
}

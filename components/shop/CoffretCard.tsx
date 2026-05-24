import Image from "next/image";
import Link from "next/link";

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
  };
};

function fmt(c: number) {
  return (c / 100).toFixed(2).replace(".", ",") + " €";
}

export function CoffretCard({ locale, coffret }: Props) {
  return (
    <Link
      href={`/${locale}/coffrets/${coffret.slug}`}
      className="block group"
    >
      <div className="bg-white rounded-2xl overflow-hidden border border-cookie/30 transition-shadow group-hover:shadow-xl">
        <div className="relative aspect-[4/5] bg-cookie/30">
          {coffret.primaryImageUrl ? (
            <Image
              src={coffret.primaryImageUrl}
              alt={coffret.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl opacity-30">
              📦
            </div>
          )}
          <span className="absolute top-3 left-3 bg-honey text-cream text-xs uppercase tracking-wider px-2 py-1 rounded">
            Coffret
          </span>
          {!coffret.available && (
            <span className="absolute bottom-3 left-3 bg-warm-brown/90 text-cream text-xs px-2 py-1 rounded">
              Indisponible
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-display text-lg text-warm-brown">
            {coffret.name}
          </h3>
          <p className="text-sm text-warm-brown/70 mt-1 line-clamp-2">
            {coffret.shortDescription}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-semibold text-warm-brown">
              {fmt(coffret.price.totalCents)}
            </span>
            {coffret.price.discountCents > 0 && (
              <span className="text-xs text-warm-brown/60 line-through">
                {fmt(coffret.price.subtotalCents)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

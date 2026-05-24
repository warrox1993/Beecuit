"use client";

function fmt(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function CoffretPricePreview({
  subtotalCents,
  discountPercent,
}: {
  subtotalCents: number;
  discountPercent: number;
}) {
  const discount = Math.max(0, Math.min(99, discountPercent | 0));
  const discountCents = Math.ceil((subtotalCents * discount) / 100);
  const totalCents = subtotalCents - discountCents;

  return (
    <div className="border-honey/30 bg-honey/5 rounded-md border p-3 text-sm">
      <div className="font-display text-warm-brown mb-1 text-xs uppercase tracking-wider">
        Prévisualisation du prix
      </div>
      {subtotalCents === 0 ? (
        <p className="text-warm-brown/60 italic">
          Ajoute au moins un biscuit pour voir le prix calculé.
        </p>
      ) : (
        <p className="text-warm-brown">
          <span className="font-mono">{fmt(subtotalCents)}</span>
          <span className="text-warm-brown/60 mx-1">−</span>
          <span className="font-mono">{discount}%</span>
          <span className="text-warm-brown/60 mx-1">=</span>
          <span className="text-honey-dark font-mono text-base font-semibold">
            {fmt(totalCents)}
          </span>
          <span className="text-warm-brown/60 ml-2 text-xs">
            (économie {fmt(discountCents)})
          </span>
        </p>
      )}
    </div>
  );
}

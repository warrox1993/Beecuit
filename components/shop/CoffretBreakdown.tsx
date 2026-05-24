import type { CoffretPrice } from "@/lib/coffret/pricing";

function fmt(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function CoffretBreakdown({ price }: { price: CoffretPrice }) {
  return (
    <div className="bg-white border border-cookie/40 rounded-xl p-4 my-4">
      {price.breakdown.map((line) => (
        <div
          key={line.biscuitId}
          className="flex justify-between py-1 text-sm text-warm-brown"
        >
          <span>
            {line.name} ×{line.quantity}
          </span>
          <span>{fmt(line.lineCents)}</span>
        </div>
      ))}
      <div className="border-t border-cookie/30 my-2" />
      <div className="flex justify-between py-1 text-sm text-warm-brown/70">
        <span>Sous-total biscuits</span>
        <span>{fmt(price.subtotalCents)}</span>
      </div>
      {price.discountCents > 0 && (
        <div className="flex justify-between py-1 text-sm text-honey-dark">
          <span>Remise coffret (−{price.discountPercent}%)</span>
          <span>−{fmt(price.discountCents)}</span>
        </div>
      )}
      <div className="border-t border-cookie/30 my-2" />
      <div className="flex justify-between text-xl font-bold text-warm-brown">
        <span>Prix coffret</span>
        <span>{fmt(price.totalCents)}</span>
      </div>
      <div className="text-xs text-warm-brown/60 text-right mt-1">
        TVA 6 % incluse
      </div>
    </div>
  );
}

import type { CoffretPrice } from "@/lib/coffret/pricing";

function fmt(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function CoffretBreakdown({ price }: { price: CoffretPrice }) {
  return (
    <div className="border-cookie/40 my-4 rounded-xl border bg-white p-4">
      {price.breakdown.map((line) => (
        <div key={line.biscuitId} className="text-warm-brown flex justify-between py-1 text-sm">
          <span>
            {line.name} ×{line.quantity}
          </span>
          <span>{fmt(line.lineCents)}</span>
        </div>
      ))}
      <div className="border-cookie/30 my-2 border-t" />
      <div className="text-warm-brown/70 flex justify-between py-1 text-sm">
        <span>Sous-total biscuits</span>
        <span>{fmt(price.subtotalCents)}</span>
      </div>
      {price.discountCents > 0 && (
        <div className="text-honey-dark flex justify-between py-1 text-sm">
          <span>Remise coffret (−{price.discountPercent}%)</span>
          <span>−{fmt(price.discountCents)}</span>
        </div>
      )}
      <div className="border-cookie/30 my-2 border-t" />
      <div className="text-warm-brown flex justify-between text-xl font-bold">
        <span>Prix coffret</span>
        <span>{fmt(price.totalCents)}</span>
      </div>
      <div className="text-warm-brown/60 mt-1 text-right text-xs">TVA 6 % incluse</div>
    </div>
  );
}

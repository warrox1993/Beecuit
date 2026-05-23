type Line = { name: string; unitPriceCents: number; quantity: number };

export function OrderSummary({
  lines,
  shippingCents,
  totalCents,
  vatCents,
}: {
  lines: Line[];
  shippingCents: number;
  totalCents: number;
  vatCents: number;
}) {
  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const eur = (c: number) => (c / 100).toFixed(2);
  return (
    <aside className="border-warm-brown/10 sticky top-28 rounded-2xl border bg-white p-6 shadow-md">
      <p className="text-honey-dark mb-6 text-xs font-semibold uppercase tracking-[0.1em]">RÉCAPITULATIF</p>
      <ul className="divide-warm-brown/10 mb-6 divide-y text-sm">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between py-3">
            <span className="text-warm-brown">{l.name} × {l.quantity}</span>
            <span className="text-warm-brown font-mono">{eur(l.unitPriceCents * l.quantity)} €</span>
          </li>
        ))}
      </ul>
      <div className="border-warm-brown/10 space-y-2 border-t pt-4 text-sm">
        <div className="text-warm-brown flex justify-between"><span>Sous-total</span><span className="font-mono">{eur(subtotalCents)} €</span></div>
        <div className="text-warm-brown flex justify-between"><span>Livraison</span><span className="font-mono">{eur(shippingCents)} €</span></div>
        <div className="text-warm-brown/60 flex justify-between text-xs"><span>dont TVA 6 % incluse</span><span className="font-mono">{eur(vatCents)} €</span></div>
        <div className="border-warm-brown/10 mt-3 flex items-baseline justify-between border-t pt-4">
          <span className="text-warm-brown font-display text-lg">Total</span>
          <span className="text-honey-dark font-display text-2xl">{eur(totalCents)} €</span>
        </div>
      </div>
    </aside>
  );
}

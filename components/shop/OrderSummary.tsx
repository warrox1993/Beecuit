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
    <aside className="border-warm-brown/10 sticky top-6 rounded-lg border bg-white p-6">
      <h2 className="text-honey-dark font-display mb-4 text-xl">Récapitulatif</h2>
      <ul className="divide-warm-brown/10 mb-4 divide-y text-sm">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between py-2">
            <span>{l.name} × {l.quantity}</span>
            <span className="font-mono">{eur(l.unitPriceCents * l.quantity)} €</span>
          </li>
        ))}
      </ul>
      <div className="border-warm-brown/10 space-y-1 border-t pt-3 text-sm">
        <div className="flex justify-between"><span>Sous-total</span><span className="font-mono">{eur(subtotalCents)} €</span></div>
        <div className="flex justify-between"><span>Livraison</span><span className="font-mono">{eur(shippingCents)} €</span></div>
        <div className="text-warm-brown/60 flex justify-between text-xs"><span>dont TVA 6 % incluse</span><span className="font-mono">{eur(vatCents)} €</span></div>
        <div className="border-warm-brown/10 mt-2 flex justify-between border-t pt-2 text-base font-medium">
          <span>Total</span><span className="font-mono">{eur(totalCents)} €</span>
        </div>
      </div>
    </aside>
  );
}

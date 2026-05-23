type Item = { productNameSnapshot: string; quantity: number; lineTotalCents: number };
type Address = Record<string, unknown>;

export function OrderDetailCard({
  orderNumber,
  status,
  totalCents,
  subtotalCents,
  shippingCents,
  taxCents,
  items,
  shippingAddress,
  shippingMethod,
  trackingNumber,
}: {
  orderNumber: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  items: Item[];
  shippingAddress: Address | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
}) {
  const eur = (c: number) => (c / 100).toFixed(2);
  return (
    <article className="border-warm-brown/10 rounded-lg border bg-white p-6">
      <header className="flex items-center justify-between">
        <h2 className="text-honey-dark font-display text-2xl">#{orderNumber}</h2>
        <span className="bg-honey/10 text-honey-dark rounded-full px-3 py-1 text-xs">{status}</span>
      </header>
      <h3 className="text-warm-brown mt-6 mb-2 text-sm font-medium">Articles</h3>
      <ul className="divide-warm-brown/10 divide-y text-sm">
        {items.map((i, idx) => (
          <li key={idx} className="flex justify-between py-2">
            <span>{i.productNameSnapshot} × {i.quantity}</span>
            <span className="font-mono">{eur(i.lineTotalCents)} €</span>
          </li>
        ))}
      </ul>
      <div className="border-warm-brown/10 mt-4 border-t pt-3 text-sm">
        <div className="flex justify-between"><span>Sous-total</span><span className="font-mono">{eur(subtotalCents)} €</span></div>
        <div className="flex justify-between"><span>Livraison ({shippingMethod ?? "—"})</span><span className="font-mono">{eur(shippingCents)} €</span></div>
        <div className="text-warm-brown/60 flex justify-between text-xs"><span>dont TVA 6 %</span><span className="font-mono">{eur(taxCents)} €</span></div>
        <div className="border-warm-brown/10 mt-2 flex justify-between border-t pt-2 text-base font-medium"><span>Total</span><span className="font-mono">{eur(totalCents)} €</span></div>
      </div>
      {shippingAddress && (
        <>
          <h3 className="text-warm-brown mt-6 mb-2 text-sm font-medium">Livraison</h3>
          <p className="text-warm-brown/80 text-sm">
            {String(shippingAddress.firstName ?? "")} {String(shippingAddress.lastName ?? "")}<br />
            {String(shippingAddress.line1 ?? "")}<br />
            {String(shippingAddress.postalCode ?? "")} {String(shippingAddress.city ?? "")} ({String(shippingAddress.country ?? "")})
          </p>
        </>
      )}
      {trackingNumber && (
        <p className="text-warm-brown mt-4 text-sm">
          N° de suivi : <code>{trackingNumber}</code>
        </p>
      )}
    </article>
  );
}

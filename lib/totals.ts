export function extractVatInclusive(amountCentsTtc: number, vatPercent: number) {
  const htRaw = (amountCentsTtc * 100) / (100 + vatPercent);
  const ht = Math.round(htRaw);
  const vat = amountCentsTtc - ht;
  return { ht, vat };
}

export type OrderLine = { unitPriceCents: number; quantity: number };

export function computeOrderTotals(args: {
  lines: OrderLine[];
  shippingCents: number;
  vatPercentInclusive: number;
}) {
  const subtotalCents = args.lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const totalCents = subtotalCents + args.shippingCents;
  const { ht: htCents, vat: vatCents } = extractVatInclusive(totalCents, args.vatPercentInclusive);
  return {
    subtotalCents,
    shippingCents: args.shippingCents,
    totalCents,
    htCents,
    vatCents,
  };
}

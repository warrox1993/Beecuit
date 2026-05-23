export type ShippingRate = {
  method: string;
  country: string;
  weightGramsMax: number;
  priceCents: number;
  freeShippingThresholdCents: number | null;
};

export function pickShippingRate(
  rates: ShippingRate[],
  weightGrams: number,
  subtotalCents: number,
): ShippingRate | null {
  const sorted = [...rates].sort((a, b) => a.weightGramsMax - b.weightGramsMax);
  const match = sorted.find((r) => r.weightGramsMax >= weightGrams);
  if (!match) return null;
  if (
    match.freeShippingThresholdCents !== null &&
    subtotalCents >= match.freeShippingThresholdCents
  ) {
    return { ...match, priceCents: 0 };
  }
  return match;
}

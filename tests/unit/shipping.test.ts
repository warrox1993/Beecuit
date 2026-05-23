import { describe, it, expect } from "vitest";
import { pickShippingRate, type ShippingRate } from "@/lib/shipping/bpost";

const rates: ShippingRate[] = [
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 1000, priceCents: 550, freeShippingThresholdCents: 5000 },
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 2000, priceCents: 750, freeShippingThresholdCents: 5000 },
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 5000, priceCents: 1200, freeShippingThresholdCents: 5000 },
];

describe("pickShippingRate", () => {
  it("picks the smallest bracket that covers the weight", () => {
    expect(pickShippingRate(rates, 500, 0)?.priceCents).toBe(550);
    expect(pickShippingRate(rates, 1500, 0)?.priceCents).toBe(750);
    expect(pickShippingRate(rates, 3000, 0)?.priceCents).toBe(1200);
  });
  it("returns null when weight exceeds all brackets", () => {
    expect(pickShippingRate(rates, 6000, 0)).toBeNull();
  });
  it("returns 0 when subtotal reaches free shipping threshold", () => {
    expect(pickShippingRate(rates, 1500, 5000)?.priceCents).toBe(0);
  });
});

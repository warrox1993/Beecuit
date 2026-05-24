export const FORMAT_SIZES = { mini: 6, classique: 12, famille: 24 } as const;
export type SubscriptionFormat = keyof typeof FORMAT_SIZES;

export const ENGAGEMENTS = [0, 6, 12] as const;
export type EngagementMonths = (typeof ENGAGEMENTS)[number];

export const ENGAGEMENT_KEY: Record<EngagementMonths, "none" | "6m" | "12m"> = {
  0: "none",
  6: "6m",
  12: "12m",
};

export const ENGAGEMENT_DISCOUNT_PERCENT: Record<EngagementMonths, number> = {
  0: 0,
  6: 5,
  12: 10,
};

// Display values; actual Stripe Prices are configured separately
export const BASE_PRICES_CENTS: Record<SubscriptionFormat, number> = {
  mini: 1990,
  classique: 2990,
  famille: 4990,
};

export function computeDisplayPrice(
  format: SubscriptionFormat,
  engagement: EngagementMonths,
): number {
  const base = BASE_PRICES_CENTS[format];
  const discount = ENGAGEMENT_DISCOUNT_PERCENT[engagement];
  return Math.round(base * (1 - discount / 100));
}

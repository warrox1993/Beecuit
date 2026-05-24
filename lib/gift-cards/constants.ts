// 5 fixed amounts in cents (per spec GC2)
export const GIFT_CARD_AMOUNTS_CENTS = [1500, 2500, 5000, 7500, 10000] as const;
export type GiftCardAmountCents = (typeof GIFT_CARD_AMOUNTS_CENTS)[number];

// SKU per tier (used by seed script + addGiftCardToCart lookup)
export const GIFT_CARD_SKUS: Record<GiftCardAmountCents, string> = {
  1500: "GIFT-015",
  2500: "GIFT-025",
  5000: "GIFT-050",
  7500: "GIFT-075",
  10000: "GIFT-100",
};

// Months added to delivery_at to compute expires_at (spec GC5)
export const EXPIRATION_MONTHS = 12;

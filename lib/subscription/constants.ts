// Tailles d'abonnement exprimées en SACHETS / BOÎTES (1 unité = 1 produit du
// catalogue, 180g ou 200g, prix unitaire ~4.90-5.50 €).
//
// Rebase 2026-05-25 : les anciennes valeurs (6/12/24) traitaient « 1 biscuit
// = 1 pièce » et aboutissaient à 10-17 €/kg, hors cible client (20-30 €/kg).
// Le code de validation `lib/actions/subscription.actions.ts` impose la somme
// des quantités par produit = FORMAT_SIZES[format] — l'utilisateur choisit
// donc des sachets entiers.
//
// Poids moyen catalogue : 5 produits = (200+200+180+180+200)/5 = 192g/sachet.
// €/kg cible : ~27.50 €.
export const FORMAT_SIZES = { mini: 2, classique: 4, famille: 8 } as const;
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

// Display values; actual Stripe Prices are configured separately.
//
// Calcul €/kg réel (poids moyen 192g/sachet) :
//   mini      2 sachets ≈ 384g  → 10.50 € → 27.34 €/kg
//   classique 4 sachets ≈ 768g  → 20.90 € → 27.21 €/kg
//   famille   8 sachets ≈ 1536g → 39.90 € → 25.98 €/kg
export const BASE_PRICES_CENTS: Record<SubscriptionFormat, number> = {
  mini: 1050,
  classique: 2090,
  famille: 3990,
};

export function computeDisplayPrice(
  format: SubscriptionFormat,
  engagement: EngagementMonths,
): number {
  const base = BASE_PRICES_CENTS[format];
  const discount = ENGAGEMENT_DISCOUNT_PERCENT[engagement];
  return Math.round(base * (1 - discount / 100));
}

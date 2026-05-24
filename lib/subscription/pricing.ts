import { env } from "@/lib/env";
import type { SubscriptionFormat, EngagementMonths } from "./constants";
import { ENGAGEMENT_KEY } from "./constants";

type Tier = "none" | "6m" | "12m";

const PRICE_MAP: Record<SubscriptionFormat, Record<Tier, string>> = {
  mini: {
    none: env.STRIPE_PRICE_MINI_NONE,
    "6m": env.STRIPE_PRICE_MINI_6M,
    "12m": env.STRIPE_PRICE_MINI_12M,
  },
  classique: {
    none: env.STRIPE_PRICE_CLASSIQUE_NONE,
    "6m": env.STRIPE_PRICE_CLASSIQUE_6M,
    "12m": env.STRIPE_PRICE_CLASSIQUE_12M,
  },
  famille: {
    none: env.STRIPE_PRICE_FAMILLE_NONE,
    "6m": env.STRIPE_PRICE_FAMILLE_6M,
    "12m": env.STRIPE_PRICE_FAMILLE_12M,
  },
};

export function getStripePriceId(
  format: SubscriptionFormat,
  engagement: EngagementMonths,
): string {
  return PRICE_MAP[format][ENGAGEMENT_KEY[engagement]];
}

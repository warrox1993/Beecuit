"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createSubscriptionCheckout } from "@/lib/actions/subscription.actions";
import {
  FORMAT_SIZES,
  ENGAGEMENT_DISCOUNT_PERCENT,
  computeDisplayPrice,
  type SubscriptionFormat,
  type EngagementMonths,
} from "@/lib/subscription/constants";

const FORMAT_LABELS: Record<SubscriptionFormat, string> = {
  mini: "Mini",
  classique: "Classique",
  famille: "Famille",
};
const ENGAGEMENT_LABELS: Record<EngagementMonths, string> = {
  0: "Sans engagement",
  6: "6 mois",
  12: "12 mois",
};

export function SubscriptionPricingTable({ locale }: { locale: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {(Object.keys(FORMAT_SIZES) as SubscriptionFormat[]).map((format) => (
        <div
          key={format}
          className="bg-white border border-cookie/30 rounded-2xl p-6 shadow-md"
        >
          <h3 className="text-xl font-display text-warm-brown">
            {FORMAT_LABELS[format]}
          </h3>
          <p className="text-sm text-warm-brown/70 mt-1">
            {FORMAT_SIZES[format]} sachets par mois
          </p>
          <div className="mt-6 space-y-3">
            {([0, 6, 12] as EngagementMonths[]).map((engagement) => {
              const cents = computeDisplayPrice(format, engagement);
              const discount = ENGAGEMENT_DISCOUNT_PERCENT[engagement];
              return (
                <div
                  key={engagement}
                  className="border border-cookie/20 rounded-xl p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-warm-brown">
                      {ENGAGEMENT_LABELS[engagement]}
                    </span>
                    {discount > 0 && (
                      <span className="text-xs bg-honey/20 text-honey-dark px-2 py-0.5 rounded">
                        −{discount}%
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-display text-2xl text-warm-brown">
                    {(cents / 100).toFixed(2).replace(".", ",")} €
                    <span className="text-xs font-normal text-warm-brown/60">
                      {" "}
                      /mois
                    </span>
                  </p>
                  <Button
                    disabled={pending}
                    className="w-full mt-3 bg-honey text-cream hover:bg-honey-dark"
                    onClick={() =>
                      start(async () => {
                        try {
                          await createSubscriptionCheckout(
                            { format, engagement },
                            locale as "fr" | "nl" | "de" | "en",
                          );
                        } catch (e) {
                          alert((e as Error).message);
                        }
                      })
                    }
                  >
                    {pending ? "..." : "S'abonner"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

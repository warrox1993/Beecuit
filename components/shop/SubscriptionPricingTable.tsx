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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {(Object.keys(FORMAT_SIZES) as SubscriptionFormat[]).map((format) => (
        <div key={format} className="border-cookie/30 rounded-2xl border bg-white p-6 shadow-md">
          <h3 className="font-display text-warm-brown text-xl">{FORMAT_LABELS[format]}</h3>
          <p className="text-warm-brown/70 mt-1 text-sm">{FORMAT_SIZES[format]} sachets par mois</p>
          <div className="mt-6 space-y-3">
            {([0, 6, 12] as EngagementMonths[]).map((engagement) => {
              const cents = computeDisplayPrice(format, engagement);
              const discount = ENGAGEMENT_DISCOUNT_PERCENT[engagement];
              return (
                <div key={engagement} className="border-cookie/20 rounded-xl border p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-warm-brown text-sm font-semibold">
                      {ENGAGEMENT_LABELS[engagement]}
                    </span>
                    {discount > 0 && (
                      <span className="bg-honey/20 text-honey-dark rounded px-2 py-0.5 text-xs">
                        −{discount}%
                      </span>
                    )}
                  </div>
                  <p className="font-display text-warm-brown mt-2 text-2xl">
                    {(cents / 100).toFixed(2).replace(".", ",")} €
                    <span className="text-warm-brown/60 text-xs font-normal"> /mois</span>
                  </p>
                  <Button
                    disabled={pending}
                    className="bg-honey text-cream hover:bg-honey-dark mt-3 w-full"
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

"use client";
import {
  GIFT_CARD_AMOUNTS_CENTS,
  type GiftCardAmountCents,
} from "@/lib/gift-cards/constants";

export function GiftCardAmountPicker({
  value,
  onChange,
}: {
  value: GiftCardAmountCents;
  onChange: (v: GiftCardAmountCents) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {GIFT_CARD_AMOUNTS_CENTS.map((cents) => {
        const active = cents === value;
        return (
          <button
            key={cents}
            type="button"
            onClick={() => onChange(cents)}
            className={`rounded-xl border-2 p-4 text-center transition-colors ${
              active ? "border-honey bg-honey/10" : "border-cookie/30 bg-white"
            }`}
          >
            <div className="font-display text-2xl text-warm-brown">
              {cents / 100} €
            </div>
          </button>
        );
      })}
    </div>
  );
}

"use client";
import { useState } from "react";

export function PackagingTierSelector({
  value = "standard",
  onChange,
  name = "packagingTier",
}: {
  value?: "standard" | "premium";
  onChange?: (v: "standard" | "premium") => void;
  name?: string;
}) {
  const [v, setV] = useState(value);
  const set = (next: "standard" | "premium") => {
    setV(next);
    onChange?.(next);
  };
  return (
    <div className="bg-white border border-cookie/40 rounded-xl p-4 my-3">
      <label className="block text-sm font-semibold mb-2 text-warm-brown">
        📦 Emballage
      </label>
      <input type="hidden" name={name} value={v} />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => set("standard")}
          className={`text-left p-3 rounded-lg border-2 transition-colors ${
            v === "standard"
              ? "border-honey bg-honey/10"
              : "border-cookie/30"
          }`}
        >
          <div className="font-semibold text-sm">Standard</div>
          <div className="text-xs text-warm-brown/70">Carton recyclé</div>
          <div className="text-xs text-honey-dark mt-1">Inclus</div>
        </button>
        <button
          type="button"
          onClick={() => set("premium")}
          className={`text-left p-3 rounded-lg border-2 transition-colors ${
            v === "premium"
              ? "border-honey bg-honey/10"
              : "border-cookie/30"
          }`}
        >
          <div className="font-semibold text-sm">Premium</div>
          <div className="text-xs text-warm-brown/70">Cire d'abeille + ruban</div>
          <div className="text-xs text-honey-dark mt-1">+ 2,50 €</div>
        </button>
      </div>
    </div>
  );
}

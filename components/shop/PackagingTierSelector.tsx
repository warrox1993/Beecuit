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
    <div className="border-cookie/40 my-3 rounded-xl border bg-white p-4">
      <label className="text-warm-brown mb-2 block text-sm font-semibold">📦 Emballage</label>
      <input type="hidden" name={name} value={v} />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => set("standard")}
          className={`rounded-lg border-2 p-3 text-left transition-colors ${
            v === "standard" ? "border-honey bg-honey/10" : "border-cookie/30"
          }`}
        >
          <div className="text-sm font-semibold">Standard</div>
          <div className="text-warm-brown/70 text-xs">Carton recyclé</div>
          <div className="text-honey-dark mt-1 text-xs">Inclus</div>
        </button>
        <button
          type="button"
          onClick={() => set("premium")}
          className={`rounded-lg border-2 p-3 text-left transition-colors ${
            v === "premium" ? "border-honey bg-honey/10" : "border-cookie/30"
          }`}
        >
          <div className="text-sm font-semibold">Premium</div>
          <div className="text-warm-brown/70 text-xs">Cire d&apos;abeille + ruban</div>
          <div className="text-honey-dark mt-1 text-xs">+ 2,50 €</div>
        </button>
      </div>
    </div>
  );
}

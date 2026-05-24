"use client";
import { useState, useTransition } from "react";
import { validateGiftCardCodeAction } from "@/lib/actions/gift-cards.actions";

export function GiftCardCodeInput({
  onApplied,
  onRemoved,
  appliedAmountCents,
}: {
  onApplied: (code: string, amountAvailableCents: number) => void;
  onRemoved: () => void;
  appliedAmountCents: number | null;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (appliedAmountCents !== null) {
    return (
      <div className="flex items-center justify-between bg-honey/10 border border-honey/30 rounded-lg p-3 text-sm">
        <span className="text-warm-brown">
          ✓ Carte cadeau appliquée (−
          {(appliedAmountCents / 100).toFixed(2).replace(".", ",")} €)
        </span>
        <button
          type="button"
          onClick={onRemoved}
          className="text-warm-brown/60 underline text-xs"
        >
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-warm-brown">
        🎁 Carte cadeau{" "}
        <span className="font-normal text-warm-brown/60">(optionnel)</span>
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="BC-XXXX-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="flex-1 border border-cookie/30 rounded-lg px-3 py-2 font-mono text-sm"
        />
        <button
          type="button"
          disabled={pending || !code}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await validateGiftCardCodeAction(code);
              if (!r.valid) setErr(r.error);
              else onApplied(code, r.amountAvailableCents);
            });
          }}
          className="bg-honey text-cream px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {pending ? "..." : "Appliquer"}
        </button>
      </div>
      {err && <p className="text-terracotta text-xs">{err}</p>}
    </div>
  );
}

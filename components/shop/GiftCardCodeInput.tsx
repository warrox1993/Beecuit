"use client";
import { useId, useState, useTransition } from "react";
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
  const baseId = useId();
  const inputId = `${baseId}-code`;
  const errorId = `${baseId}-error`;
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (appliedAmountCents !== null) {
    return (
      <div
        role="status"
        className="flex items-center justify-between bg-honey/10 border border-honey/30 rounded-lg p-3 text-sm"
      >
        <span className="text-warm-brown">
          <span aria-hidden>✓ </span>
          Carte cadeau appliquée (−
          {(appliedAmountCents / 100).toFixed(2).replace(".", ",")} €)
        </span>
        <button
          type="button"
          onClick={onRemoved}
          className="text-warm-brown/75 underline text-xs rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-dark/40"
        >
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-warm-brown">
        <span aria-hidden>🎁 </span>
        Carte cadeau{" "}
        <span className="font-normal text-warm-brown/75">(optionnel)</span>
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          placeholder="BC-XXXX-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? errorId : undefined}
          className="flex-1 border border-cookie/30 rounded-lg px-3 py-2 font-mono text-sm focus-visible:border-honey-dark focus-visible:ring-2 focus-visible:ring-honey-dark/30 focus-visible:outline-none"
        />
        <button
          type="button"
          disabled={pending || !code}
          aria-busy={pending || undefined}
          onClick={() => {
            setErr(null);
            start(async () => {
              const r = await validateGiftCardCodeAction(code);
              if (!r.valid) setErr(r.error);
              else onApplied(code, r.amountAvailableCents);
            });
          }}
          className="bg-honey text-cream px-4 py-2 rounded-lg text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-dark/50"
        >
          {pending ? "..." : "Appliquer"}
        </button>
      </div>
      {err && (
        <p id={errorId} role="alert" className="text-terracotta text-xs">
          {err}
        </p>
      )}
    </div>
  );
}

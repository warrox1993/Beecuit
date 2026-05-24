"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export type Biscuit = {
  id: string;
  sku: string;
  basePriceCents: number;
  name: string | null;
};

export type CompositionEntry = {
  biscuitId: string;
  quantity: number;
};

function fmt(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function CoffretCompositionEditor({
  biscuits,
  value,
  onChange,
}: {
  biscuits: Biscuit[];
  value: CompositionEntry[];
  onChange: (next: CompositionEntry[]) => void;
}) {
  const [picker, setPicker] = useState<string>("");

  const byId = useMemo(() => {
    const m = new Map<string, Biscuit>();
    for (const b of biscuits) m.set(b.id, b);
    return m;
  }, [biscuits]);

  const usedIds = new Set(value.map((v) => v.biscuitId));
  const available = biscuits.filter((b) => !usedIds.has(b.id));

  const subtotalCents = value.reduce((acc, entry) => {
    const b = byId.get(entry.biscuitId);
    if (!b) return acc;
    return acc + b.basePriceCents * entry.quantity;
  }, 0);

  const addBiscuit = () => {
    if (!picker) return;
    onChange([...value, { biscuitId: picker, quantity: 1 }]);
    setPicker("");
  };

  const setQty = (biscuitId: string, qty: number) => {
    const safe = Math.max(1, Math.min(99, qty | 0));
    onChange(value.map((v) => (v.biscuitId === biscuitId ? { ...v, quantity: safe } : v)));
  };

  const remove = (biscuitId: string) => {
    onChange(value.filter((v) => v.biscuitId !== biscuitId));
  };

  return (
    <div className="space-y-3">
      <h2 className="font-display text-warm-brown text-lg">Composition du coffret</h2>

      {value.length === 0 ? (
        <p className="text-warm-brown/60 text-sm italic">
          Aucun biscuit. Ajoute au moins un biscuit ci-dessous.
        </p>
      ) : (
        <ul className="divide-warm-brown/10 border-warm-brown/10 divide-y rounded border bg-white">
          {value.map((entry) => {
            const b = byId.get(entry.biscuitId);
            const unit = b?.basePriceCents ?? 0;
            const line = unit * entry.quantity;
            return (
              <li
                key={entry.biscuitId}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-warm-brown truncate">
                    {b?.name ?? "(biscuit supprimé)"}
                  </div>
                  <div className="text-warm-brown/60 font-mono text-xs">
                    {b?.sku ?? "—"} · {fmt(unit)} / unité
                  </div>
                </div>
                <label className="flex items-center gap-1 text-xs">
                  <span className="text-warm-brown/60">Qté</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={entry.quantity}
                    onChange={(e) => setQty(entry.biscuitId, Number(e.target.value))}
                    className="border-warm-brown/20 w-16 rounded border bg-white px-2 py-1 text-right font-mono"
                  />
                </label>
                <div className="w-20 text-right font-mono text-sm">{fmt(line)}</div>
                <button
                  type="button"
                  onClick={() => remove(entry.biscuitId)}
                  className="text-terracotta hover:text-terracotta/80 px-2 text-lg leading-none"
                  aria-label="Retirer"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <select
          value={picker}
          onChange={(e) => setPicker(e.target.value)}
          className="border-warm-brown/20 flex-1 rounded border bg-white px-3 py-2 text-sm"
          disabled={available.length === 0}
        >
          <option value="">
            {available.length === 0
              ? "— Tous les biscuits sont déjà ajoutés —"
              : "— Ajouter un biscuit —"}
          </option>
          {available.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name ?? b.sku} ({fmt(b.basePriceCents)})
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={addBiscuit}
          disabled={!picker}
          size="sm"
        >
          + Ajouter
        </Button>
      </div>

      <div className="border-warm-brown/10 flex items-center justify-between border-t pt-2 text-sm">
        <span className="text-warm-brown/70 text-xs uppercase tracking-wider">
          Sous-total des biscuits
        </span>
        <span className="font-mono text-base font-semibold">{fmt(subtotalCents)}</span>
      </div>
    </div>
  );
}

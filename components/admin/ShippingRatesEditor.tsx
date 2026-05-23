"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createRate, updateRate, deleteRate } from "@/lib/actions/admin/shipping.actions";
import { useRouter } from "next/navigation";

type Rate = {
  id: string;
  method: string;
  country: string;
  weightGramsMax: number;
  priceCents: number;
  freeShippingThresholdCents: number | null;
  sortOrder: number;
};

function RateRow({ rate, onDone }: { rate?: Rate; onDone: () => void }) {
  const router = useRouter();
  const [method, setMethod] = useState(rate?.method ?? "bpost_express_24h");
  const [country, setCountry] = useState(rate?.country ?? "BE");
  const [weightMax, setWeightMax] = useState(rate?.weightGramsMax ?? 1000);
  const [priceEur, setPriceEur] = useState((rate?.priceCents ?? 0) / 100);
  const [freeEur, setFreeEur] = useState(
    rate?.freeShippingThresholdCents != null ? rate.freeShippingThresholdCents / 100 : NaN,
  );
  const [sortOrder] = useState(rate?.sortOrder ?? 0);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const payload = {
            id: rate?.id,
            method,
            country,
            weightGramsMax: weightMax,
            priceCents: Math.round(priceEur * 100),
            freeShippingThresholdCents: isNaN(freeEur) ? null : Math.round(freeEur * 100),
            sortOrder,
          };
          if (rate?.id) await updateRate(payload);
          else await createRate(payload);
          router.refresh();
          onDone();
        });
      }}
      className="border-warm-brown/10 grid grid-cols-6 gap-2 rounded-lg border p-3 text-sm"
    >
      <input
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="border-warm-brown/20 rounded border bg-white px-2 py-1 font-mono text-xs"
      />
      <input
        value={country}
        onChange={(e) => setCountry(e.target.value.toUpperCase())}
        maxLength={2}
        className="border-warm-brown/20 rounded border bg-white px-2 py-1 font-mono text-xs"
      />
      <input
        type="number"
        value={weightMax}
        onChange={(e) => setWeightMax(Number(e.target.value))}
        className="border-warm-brown/20 rounded border bg-white px-2 py-1 text-right font-mono"
      />
      <input
        type="number"
        step="0.01"
        value={priceEur}
        onChange={(e) => setPriceEur(Number(e.target.value))}
        className="border-warm-brown/20 rounded border bg-white px-2 py-1 text-right font-mono"
      />
      <input
        type="number"
        step="0.01"
        placeholder="(facultatif)"
        value={isNaN(freeEur) ? "" : freeEur}
        onChange={(e) => setFreeEur(e.target.value === "" ? NaN : Number(e.target.value))}
        className="border-warm-brown/20 rounded border bg-white px-2 py-1 text-right font-mono"
      />
      <div className="flex gap-1">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-honey text-cream hover:bg-honey-dark"
        >
          {rate?.id ? "MAJ" : "+"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          ×
        </Button>
      </div>
    </form>
  );
}

export function ShippingRatesEditor({ rates }: { rates: Rate[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      <div className="text-warm-brown/60 grid grid-cols-6 gap-2 px-3 text-xs uppercase">
        <span>Méthode</span>
        <span>Pays</span>
        <span>Poids max (g)</span>
        <span>Prix TTC (€)</span>
        <span>Free ≥ (€)</span>
        <span>Actions</span>
      </div>
      {rates.map((r) =>
        editing === r.id ? (
          <RateRow key={r.id} rate={r} onDone={() => setEditing(null)} />
        ) : (
          <div
            key={r.id}
            className="border-warm-brown/10 grid grid-cols-6 gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs">{r.method}</span>
            <span className="font-mono text-xs">{r.country}</span>
            <span className="text-right font-mono">{r.weightGramsMax}</span>
            <span className="text-right font-mono">{(r.priceCents / 100).toFixed(2)}</span>
            <span className="text-warm-brown/60 text-right font-mono">
              {r.freeShippingThresholdCents != null
                ? (r.freeShippingThresholdCents / 100).toFixed(2)
                : "—"}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setEditing(r.id)}>
                Éditer
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deleteRate(r.id);
                    router.refresh();
                  })
                }
              >
                ×
              </Button>
            </div>
          </div>
        ),
      )}
      {creating ? (
        <RateRow onDone={() => setCreating(false)} />
      ) : (
        <Button
          onClick={() => setCreating(true)}
          className="bg-honey text-cream hover:bg-honey-dark"
        >
          + Ajouter un tarif
        </Button>
      )}
    </div>
  );
}

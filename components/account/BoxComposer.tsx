"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { composeBox } from "@/lib/actions/subscription.actions";

type Biscuit = {
  id: string;
  name: string;
  stockQuantity: number;
  primaryImageUrl: string | null;
};

export function BoxComposer({
  boxId,
  boxSize,
  biscuits,
  initialItems,
}: {
  boxId: string;
  boxSize: number;
  biscuits: Biscuit[];
  initialItems: Array<{ biscuitId: string; quantity: number }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [picks, setPicks] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const it of initialItems) m[it.biscuitId] = it.quantity;
    return m;
  });

  const total = Object.values(picks).reduce((s, q) => s + q, 0);
  const remaining = boxSize - total;

  const inc = (id: string) => {
    if (remaining <= 0) return;
    setPicks((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  };
  const dec = (id: string) => {
    setPicks((p) => {
      const next = (p[id] ?? 0) - 1;
      const r = { ...p };
      if (next <= 0) delete r[id];
      else r[id] = next;
      return r;
    });
  };

  const submit = () => {
    setErr(null);
    if (total !== boxSize) {
      setErr(`Total doit être ${boxSize}, actuellement ${total}`);
      return;
    }
    start(async () => {
      try {
        await composeBox({
          boxId,
          items: Object.entries(picks).map(([biscuitId, quantity]) => ({
            biscuitId,
            quantity,
          })),
        });
        router.refresh();
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-honey/10 border border-honey/30 rounded-xl p-4">
        <p className="text-warm-brown font-semibold">
          {total} / {boxSize} biscuits sélectionnés (
          {remaining > 0 ? `${remaining} restants` : "complet"})
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {biscuits.map((b) => {
          const qty = picks[b.id] ?? 0;
          return (
            <div
              key={b.id}
              className="bg-white border border-cookie/30 rounded-xl overflow-hidden"
            >
              <div className="relative aspect-[4/3] bg-cookie/30">
                {b.primaryImageUrl ? (
                  <Image
                    src={b.primaryImageUrl}
                    alt={b.name}
                    fill
                    sizes="33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl opacity-30">
                    🍪
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-warm-brown">{b.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => dec(b.id)}
                    disabled={qty === 0 || pending}
                    className="w-8 h-8 rounded-full border border-cookie/30 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="text-warm-brown font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => inc(b.id)}
                    disabled={remaining === 0 || pending}
                    className="w-8 h-8 rounded-full border border-cookie/30 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {err && <p className="text-terracotta text-sm">{err}</p>}
      <Button
        disabled={pending || total !== boxSize}
        onClick={submit}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6"
      >
        {pending ? "..." : "Valider ma composition"}
      </Button>
    </div>
  );
}

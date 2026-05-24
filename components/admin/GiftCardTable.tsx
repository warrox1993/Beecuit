"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disableGiftCard } from "@/lib/actions/gift-cards.actions";

type Row = {
  id: string;
  code: string;
  initialAmountCents: number;
  remainingAmountCents: number;
  recipientEmail: string;
  purchaserEmail: string;
  deliveryAt: Date;
  deliveredAt: Date | null;
  expiresAt: Date;
  isActive: boolean;
};

const fmt = (c: number) => `${(c / 100).toFixed(2).replace(".", ",")} €`;
const dt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("fr-BE") : "—";

function status(r: Row): string {
  const now = Date.now();
  if (!r.isActive) return "Désactivée";
  if (!r.deliveredAt) return "En attente";
  if (r.expiresAt.getTime() < now) return "Expirée";
  if (r.remainingAmountCents === 0) return "Utilisée";
  return "Active";
}

export function GiftCardTable({ rows }: { rows: Row[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-warm-brown/60 text-xs uppercase tracking-wider">
          <th className="py-2">Code</th>
          <th>Montant</th>
          <th>Solde</th>
          <th>Pour</th>
          <th>Envoi</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-cookie/30">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="py-2 font-mono text-xs">{r.code}</td>
            <td>{fmt(r.initialAmountCents)}</td>
            <td>{fmt(r.remainingAmountCents)}</td>
            <td className="text-xs">{r.recipientEmail}</td>
            <td className="text-xs">{dt(r.deliveryAt)}</td>
            <td className="text-xs">{status(r)}</td>
            <td>
              {r.isActive && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await disableGiftCard(r.id);
                      router.refresh();
                    })
                  }
                  className="text-xs text-terracotta underline"
                >
                  Désactiver
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

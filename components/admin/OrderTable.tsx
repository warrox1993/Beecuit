import Link from "next/link";

type Row = {
  orderNumber: string;
  status: string;
  guestEmail: string | null;
  totalCents: number;
  createdAt: Date;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Payée", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Préparation", color: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Expédiée", color: "bg-green-100 text-green-800" },
  delivered: { label: "Livrée", color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800" },
  refunded: { label: "Remboursée", color: "bg-gray-100 text-gray-800" },
};

export function OrderTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0)
    return <p className="text-warm-brown/60">Aucune commande pour le moment.</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-warm-brown/60 text-left text-xs uppercase">
        <tr>
          <th className="py-2">N°</th>
          <th>Date</th>
          <th>Email</th>
          <th className="text-right">Total</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="divide-warm-brown/10 divide-y">
        {rows.map((r) => {
          const s = STATUS_LABEL[r.status] ?? { label: r.status, color: "" };
          return (
            <tr key={r.orderNumber}>
              <td className="py-2 font-mono text-xs">{r.orderNumber}</td>
              <td>{r.createdAt.toLocaleDateString("fr-BE")}</td>
              <td className="text-warm-brown/70">{r.guestEmail ?? "—"}</td>
              <td className="text-right font-mono">{(r.totalCents / 100).toFixed(2)} €</td>
              <td>
                <span className={`rounded-full px-2 py-0.5 text-xs ${s.color}`}>{s.label}</span>
              </td>
              <td className="text-right">
                <Link
                  href={`/admin/commandes/${r.orderNumber}`}
                  className="text-honey-dark hover:underline"
                >
                  Voir
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

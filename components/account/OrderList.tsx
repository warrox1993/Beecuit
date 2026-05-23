import { Link } from "@/i18n/navigation";

type Row = {
  orderNumber: string;
  status: string;
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

export function OrderList({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-warm-brown/70">Tu n&apos;as pas encore passé de commande.</p>;
  }
  return (
    <ul className="divide-warm-brown/10 divide-y">
      {rows.map((r) => {
        const s = STATUS_LABEL[r.status] ?? { label: r.status, color: "" };
        return (
          <li key={r.orderNumber} className="py-3">
            <Link
              href={`/compte/commandes/${r.orderNumber}`}
              className="flex items-center justify-between hover:underline"
            >
              <div>
                <p className="text-warm-brown text-sm font-medium">#{r.orderNumber}</p>
                <p className="text-warm-brown/60 text-xs">
                  {r.createdAt.toLocaleDateString("fr-BE")}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>{s.label}</span>
              <span className="font-mono text-sm">{(r.totalCents / 100).toFixed(2)} €</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

import Link from "next/link";

type Row = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  status: string;
  quotedAmountCents: number | null;
  createdAt: Date;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  quoted: "Devis envoyé",
  paid: "Payé",
  rejected: "Refusé",
  expired: "Expiré",
};

export function DevisTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded border border-dashed border-amber-200 p-6 text-amber-800">
        Aucun devis.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-amber-50 text-left text-amber-900">
          <tr>
            <th className="px-3 py-2">Entreprise</th>
            <th className="px-3 py-2">Contact</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Statut</th>
            <th className="px-3 py-2 text-right">Montant</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-amber-100">
              <td className="px-3 py-2 font-medium">{r.companyName}</td>
              <td className="px-3 py-2">{r.contactName}</td>
              <td className="px-3 py-2">{r.email}</td>
              <td className="px-3 py-2">{r.createdAt.toLocaleDateString("fr-BE")}</td>
              <td className="px-3 py-2">{STATUS_LABELS[r.status] ?? r.status}</td>
              <td className="px-3 py-2 text-right">
                {r.quotedAmountCents !== null
                  ? (r.quotedAmountCents / 100).toLocaleString("fr-BE", {
                      style: "currency",
                      currency: "EUR",
                    })
                  : "—"}
              </td>
              <td className="px-3 py-2">
                <Link className="text-amber-700 underline" href={`/admin/devis/${r.id}`}>
                  Ouvrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

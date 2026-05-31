import Link from "next/link";

type Row = { id: string; name: string; email: string; reason: string; status: string; createdAt: Date };

const STATUS_LABELS: Record<string, string> = { new: "Nouveau", read: "Lu", archived: "Archivé" };
const REASON_LABELS: Record<string, string> = { order: "Commande", b2b: "Professionnels", press: "Presse", delivery: "Livraison", other: "Autre" };

export function MessagesTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="rounded border border-dashed border-amber-200 p-6 text-amber-800">Aucun message.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-amber-50 text-left text-amber-900">
          <tr>
            <th className="px-3 py-2">Nom</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Raison</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Statut</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-amber-100">
              <td className="px-3 py-2 font-medium">{r.name}</td>
              <td className="px-3 py-2">{r.email}</td>
              <td className="px-3 py-2">{REASON_LABELS[r.reason] ?? r.reason}</td>
              <td className="px-3 py-2">{r.createdAt.toLocaleDateString("fr-BE")}</td>
              <td className="px-3 py-2">{STATUS_LABELS[r.status] ?? r.status}</td>
              <td className="px-3 py-2">
                <Link className="text-amber-700 underline" href={`/admin/messages/${r.id}`}>Ouvrir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import Link from "next/link";

// Reduced row shape (the query projects only displayed columns — no PII / Stripe ids).
type Row = {
  id: string;
  format: string;
  engagementMonths: number;
  status: string;
  startedAt: Date | null;
};

const dt = (d: Date | null) => (d ? new Date(d).toLocaleDateString("fr-BE") : "—");

export function SubscriptionTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-warm-brown/60 text-left text-xs tracking-wider uppercase">
          <th className="py-2">ID</th>
          <th>Format</th>
          <th>Engagement</th>
          <th>Status</th>
          <th>Début</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="divide-cookie/30 divide-y">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="py-2 font-mono text-xs">{r.id.slice(0, 8)}</td>
            <td>{r.format}</td>
            <td>{r.engagementMonths === 0 ? "Sans" : `${r.engagementMonths}m`}</td>
            <td>
              <span className="bg-cookie/40 text-warm-brown rounded px-2 py-1 text-xs">
                {r.status}
              </span>
            </td>
            <td>{dt(r.startedAt)}</td>
            <td>
              <Link
                href={`/admin/abonnements/${r.id}`}
                className="text-warm-brown/60 text-xs underline"
              >
                Détails
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

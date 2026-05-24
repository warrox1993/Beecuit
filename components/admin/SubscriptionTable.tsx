import Link from "next/link";
import type { InferSelectModel } from "drizzle-orm";
import type { subscriptions } from "@/lib/db/schema";

const dt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("fr-BE") : "—";

export function SubscriptionTable({
  rows,
}: {
  rows: InferSelectModel<typeof subscriptions>[];
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-warm-brown/60 text-xs uppercase tracking-wider">
          <th className="py-2">ID</th>
          <th>Format</th>
          <th>Engagement</th>
          <th>Status</th>
          <th>Début</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-cookie/30">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="py-2 font-mono text-xs">{r.id.slice(0, 8)}</td>
            <td>{r.format}</td>
            <td>{r.engagementMonths === 0 ? "Sans" : `${r.engagementMonths}m`}</td>
            <td>
              <span className="text-xs bg-cookie/40 text-warm-brown px-2 py-1 rounded">
                {r.status}
              </span>
            </td>
            <td>{dt(r.startedAt)}</td>
            <td>
              <Link
                href={`/admin/abonnements/${r.id}`}
                className="text-xs underline text-warm-brown/60"
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

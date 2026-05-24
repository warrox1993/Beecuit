import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSubscriptionById,
  listSubscriptionHistory,
} from "@/lib/queries/subscriptions";

export const dynamic = "force-dynamic";

export default async function AdminAbonnementDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sub = await getSubscriptionById(id);
  if (!sub) notFound();
  const history = await listSubscriptionHistory(sub.id);
  return (
    <div className="space-y-6">
      <Link
        href="/admin/abonnements"
        className="text-xs text-warm-brown/60 underline"
      >
        ← retour
      </Link>
      <h1 className="text-honey font-display text-3xl">
        Abonnement {sub.id.slice(0, 8)}
      </h1>
      <div className="bg-white border border-cookie/30 rounded-xl p-4 space-y-2 text-sm">
        <p>
          <strong>User :</strong> {sub.userId}
        </p>
        <p>
          <strong>Stripe sub ID :</strong>{" "}
          <code className="text-xs">{sub.stripeSubscriptionId}</code>
        </p>
        <p>
          <strong>Format :</strong> {sub.format}
        </p>
        <p>
          <strong>Engagement :</strong> {sub.engagementMonths} mois
        </p>
        <p>
          <strong>Status :</strong> {sub.status}
        </p>
        <p>
          <strong>Début :</strong>{" "}
          {new Date(sub.startedAt).toLocaleDateString("fr-BE")}
        </p>
      </div>
      <h2 className="text-xl font-display text-warm-brown">Historique des box</h2>
      {history.length === 0 ? (
        <p className="text-warm-brown/60 text-sm">Aucune box pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((h) => (
            <li
              key={h.id}
              className="bg-white border border-cookie/30 rounded p-3 text-sm"
            >
              {h.cycleYearMonth} — {h.status} (composé par {h.composedBy ?? "—"})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

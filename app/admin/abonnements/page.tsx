import { listAllSubscriptions } from "@/lib/queries/subscriptions";
import { SubscriptionTable } from "@/components/admin/SubscriptionTable";

export const dynamic = "force-dynamic";

export default async function AdminAbonnementsPage() {
  const rows = await listAllSubscriptions();
  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Abonnements</h1>
      <div className="border-warm-brown/10 rounded-lg border bg-white p-4">
        {rows.length === 0 ? (
          <p className="text-warm-brown/60 p-4 text-sm">Aucun abonnement pour le moment.</p>
        ) : (
          <SubscriptionTable rows={rows} />
        )}
      </div>
    </div>
  );
}

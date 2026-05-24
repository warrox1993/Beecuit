import { listAllSubscriptions } from "@/lib/queries/subscriptions";
import { SubscriptionTable } from "@/components/admin/SubscriptionTable";

export const dynamic = "force-dynamic";

export default async function AdminAbonnementsPage() {
  const rows = await listAllSubscriptions();
  return (
    <div>
      <h1 className="text-honey font-display text-3xl mb-6">Abonnements</h1>
      <div className="border-warm-brown/10 rounded-lg border bg-white p-4">
        {rows.length === 0 ? (
          <p className="text-warm-brown/60 text-sm p-4">
            Aucun abonnement pour le moment.
          </p>
        ) : (
          <SubscriptionTable rows={rows} />
        )}
      </div>
    </div>
  );
}

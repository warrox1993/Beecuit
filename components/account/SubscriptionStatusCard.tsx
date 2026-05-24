import type { InferSelectModel } from "drizzle-orm";
import type { subscriptions } from "@/lib/db/schema";
import { FORMAT_SIZES } from "@/lib/subscription/constants";

const STATUS_LABEL: Record<string, string> = {
  trialing: "En attente du 1er du mois",
  active: "Actif",
  paused: "En pause",
  cancelled: "Annulé (actif jusqu'à expiration)",
  expired: "Terminé",
  past_due: "Paiement en retard",
};

export function SubscriptionStatusCard({
  subscription: s,
}: {
  subscription: InferSelectModel<typeof subscriptions>;
}) {
  const fmtDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("fr-BE") : "—";
  return (
    <div className="bg-white border border-cookie/30 rounded-2xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-warm-brown/60">
          Statut
        </span>
        <span className="bg-honey/20 text-honey-dark text-xs px-3 py-1 rounded">
          {STATUS_LABEL[s.status] ?? s.status}
        </span>
      </div>
      <div>
        <p className="font-display text-2xl text-warm-brown">
          {s.format[0]!.toUpperCase() + s.format.slice(1)} (
          {FORMAT_SIZES[s.format as keyof typeof FORMAT_SIZES]} biscuits/mois)
        </p>
        <p className="text-sm text-warm-brown/70">
          Engagement :{" "}
          {s.engagementMonths === 0 ? "Sans" : `${s.engagementMonths} mois`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-warm-brown/60 text-xs">Souscrit le</p>
          <p>{fmtDate(s.startedAt)}</p>
        </div>
        {s.engagementEndsAt && (
          <div>
            <p className="text-warm-brown/60 text-xs">
              Fin d&apos;engagement
            </p>
            <p>{fmtDate(s.engagementEndsAt)}</p>
          </div>
        )}
        {s.pausedAt && (
          <div>
            <p className="text-warm-brown/60 text-xs">En pause depuis</p>
            <p>{fmtDate(s.pausedAt)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

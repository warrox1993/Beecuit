"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from "@/lib/actions/subscription.actions";
import type { InferSelectModel } from "drizzle-orm";
import type { subscriptions } from "@/lib/db/schema";

export function SubscriptionActions({
  subscription: s,
  locale,
}: {
  subscription: InferSelectModel<typeof subscriptions>;
  locale: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const openPortal = async () => {
    setErr(null);
    const res = await fetch(`/api/account/portal-session?locale=${locale}`, {
      method: "POST",
    });
    if (!res.ok) {
      setErr("Impossible d'ouvrir le portail Stripe");
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="flex flex-wrap gap-3">
      {s.status === "active" && (
        <>
          <Button
            disabled={pending}
            variant="outline"
            onClick={() =>
              start(async () => {
                if (
                  !confirm(
                    "Pauser l'abonnement ? Aucune box ne sera envoyée jusqu'à la reprise.",
                  )
                )
                  return;
                await pauseSubscription(s.id);
                router.refresh();
              })
            }
          >
            Pauser
          </Button>
          <Button
            disabled={pending}
            variant="outline"
            onClick={() =>
              start(async () => {
                const msg = s.engagementEndsAt
                  ? `Annuler l'abonnement ? Tu continueras à payer jusqu'au ${new Date(s.engagementEndsAt).toLocaleDateString("fr-BE")} (engagement actif).`
                  : "Annuler l'abonnement ?";
                if (!confirm(msg)) return;
                await cancelSubscription(s.id);
                router.refresh();
              })
            }
          >
            Annuler
          </Button>
        </>
      )}
      {s.status === "paused" && (
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await resumeSubscription(s.id);
              router.refresh();
            })
          }
        >
          Reprendre
        </Button>
      )}
      <Button variant="outline" onClick={openPortal} disabled={pending}>
        Gérer ma CB &amp; factures
      </Button>
      {err && <p className="text-terracotta text-xs basis-full">{err}</p>}
    </div>
  );
}

import { setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getActiveSubscriptionForUser,
  listSubscriptionHistory,
} from "@/lib/queries/subscriptions";
import { Container } from "@/components/ui-primitives/Container";

export const dynamic = "force-dynamic";

export default async function HistoriquePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);
  const sub = await getActiveSubscriptionForUser(session.user.id);
  if (!sub) notFound();
  const history = await listSubscriptionHistory(sub.id);

  return (
    <Container className="py-12 space-y-6">
      <h1 className="text-3xl font-display text-warm-brown">
        Historique de mes box
      </h1>
      {history.length === 0 ? (
        <p className="text-warm-brown/70">Aucune box passée pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {history.map((h) => (
            <li
              key={h.id}
              className="bg-white border border-cookie/30 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{h.cycleYearMonth}</span>
                <span className="text-xs bg-cookie/40 text-warm-brown px-2 py-1 rounded">
                  {h.status}
                </span>
              </div>
              <p className="text-xs text-warm-brown/60 mt-1">
                Composé par : {h.composedBy ?? "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

import { setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveSubscriptionForUser, listSubscriptionHistory } from "@/lib/queries/subscriptions";
import { Container } from "@/components/ui-primitives/Container";

export const dynamic = "force-dynamic";

export default async function HistoriquePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);
  const sub = await getActiveSubscriptionForUser(session.user.id);
  if (!sub) notFound();
  const history = await listSubscriptionHistory(sub.id);

  return (
    <Container className="space-y-6 py-12">
      <h1 className="font-display text-warm-brown text-3xl">Historique de mes box</h1>
      {history.length === 0 ? (
        <p className="text-warm-brown/70">Aucune box passée pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {history.map((h) => (
            <li key={h.id} className="border-cookie/30 rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{h.cycleYearMonth}</span>
                <span className="bg-cookie/40 text-warm-brown rounded px-2 py-1 text-xs">
                  {h.status}
                </span>
              </div>
              <p className="text-warm-brown/60 mt-1 text-xs">Composé par : {h.composedBy ?? "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveSubscriptionForUser } from "@/lib/queries/subscriptions";
import { SubscriptionStatusCard } from "@/components/account/SubscriptionStatusCard";
import { SubscriptionActions } from "@/components/account/SubscriptionActions";
import { Container } from "@/components/ui-primitives/Container";

export const dynamic = "force-dynamic";

export default async function CompteAbonnementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const sub = await getActiveSubscriptionForUser(session.user.id);

  if (!sub) {
    return (
      <Container className="py-12">
        <h1 className="text-3xl font-display text-warm-brown mb-4">
          Mon abonnement
        </h1>
        <p className="text-warm-brown/70 mb-6">
          Tu n&apos;as pas encore d&apos;abonnement actif.
        </p>
        <Link
          href={`/${locale}/abonnement`}
          className="text-honey-dark underline"
        >
          Découvrir les formules →
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12 space-y-8">
      <h1 className="text-3xl font-display text-warm-brown">Mon abonnement</h1>
      <SubscriptionStatusCard subscription={sub} />
      <SubscriptionActions subscription={sub} locale={locale} />
      <div className="space-y-2 text-sm">
        <Link
          href={`/${locale}/compte/abonnement/prochaine-box`}
          className="text-honey-dark underline block"
        >
          Composer ma prochaine box →
        </Link>
        <Link
          href={`/${locale}/compte/abonnement/historique`}
          className="text-honey-dark underline block"
        >
          Historique de mes box →
        </Link>
      </div>
    </Container>
  );
}

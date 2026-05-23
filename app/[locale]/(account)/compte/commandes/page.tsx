import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { OrderList } from "@/components/account/OrderList";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";

export default async function MyOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });
  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, session!.user!.id!))
    .orderBy(desc(orders.createdAt));
  return (
    <section>
      <Eyebrow>MON COMPTE</Eyebrow>
      <Heading as="h1" size="h1" className="mt-3 mb-8">Mes commandes</Heading>
      <OrderList rows={rows} />
    </section>
  );
}

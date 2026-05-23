import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { OrderList } from "@/components/account/OrderList";

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
      <h1 className="text-honey font-display mb-6 text-3xl">Mes commandes</h1>
      <OrderList rows={rows} />
    </section>
  );
}

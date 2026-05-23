import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { OrderDetailCard } from "@/components/account/OrderDetailCard";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect({ href: "/sign-in", locale });
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, session!.user!.id!)))
    .limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return (
    <section>
      <Eyebrow>COMMANDE</Eyebrow>
      <Heading as="h1" size="h1" className="mt-3 mb-8">
        #{order.orderNumber}
      </Heading>
      <OrderDetailCard
        orderNumber={order.orderNumber}
        status={order.status}
        totalCents={order.totalCents}
        subtotalCents={order.subtotalCents}
        shippingCents={order.shippingCents}
        taxCents={order.taxCents}
        items={items.map((i) => ({
          productNameSnapshot: i.productNameSnapshot,
          quantity: i.quantity,
          lineTotalCents: i.lineTotalCents,
        }))}
        shippingAddress={order.shippingAddressSnapshot as Record<string, unknown> | null}
        shippingMethod={order.shippingMethod}
        trackingNumber={order.shippingTrackingNumber}
      />
    </section>
  );
}

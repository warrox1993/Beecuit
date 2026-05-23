import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { OrderDetailAdmin } from "@/components/admin/OrderDetailAdmin";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return (
    <OrderDetailAdmin
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
      guestEmail={order.guestEmail}
      stripePaymentIntentId={order.stripePaymentIntentId}
    />
  );
}

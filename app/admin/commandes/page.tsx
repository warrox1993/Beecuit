import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { OrderTable } from "@/components/admin/OrderTable";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const rows = await db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      guestEmail: orders.guestEmail,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt));

  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Commandes</h1>
      <div className="mt-6 rounded-lg border border-warm-brown/10 bg-white p-4">
        <OrderTable rows={rows} />
      </div>
    </div>
  );
}

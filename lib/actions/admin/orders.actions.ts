"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email/client";
import { OrderShipped } from "@/lib/email/templates/OrderShipped";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const MarkShipped = z.object({
  orderNumber: z.string().min(1),
  trackingNumber: z.string().min(1).max(100),
});

export async function markAsShipped(raw: unknown) {
  await requireAdmin();
  const { orderNumber, trackingNumber } = MarkShipped.parse(raw);
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) throw new Error("Order not found");
  await db
    .update(orders)
    .set({ status: "shipped", shippingTrackingNumber: trackingNumber })
    .where(eq(orders.id, order.id));
  const recipient = order.guestEmail ?? null;
  if (recipient) {
    const trackingUrl = `https://track.bpost.cloud/btr/web/#/search?itemCode=${encodeURIComponent(trackingNumber)}&postalCode=`;
    try {
      await sendEmail({
        to: recipient,
        subject: `Ta commande BeeCuit #${orderNumber} est en route`,
        react: OrderShipped({ orderNumber, trackingUrl }),
      });
    } catch (e) {
      console.error("[admin] shipped email failed", e);
    }
  }
  revalidatePath(`/admin/commandes/${orderNumber}`);
  revalidatePath(`/admin/commandes`);
}

export async function markAsDelivered(orderNumber: string) {
  await requireAdmin();
  await db.update(orders).set({ status: "delivered" }).where(eq(orders.orderNumber, orderNumber));
  revalidatePath(`/admin/commandes/${orderNumber}`);
  revalidatePath(`/admin/commandes`);
}

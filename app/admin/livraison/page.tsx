import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { ShippingRatesEditor } from "@/components/admin/ShippingRatesEditor";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const rates = await db.select().from(shippingRates).orderBy(shippingRates.sortOrder);
  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Tarifs livraison</h1>
      <ShippingRatesEditor rates={rates} />
    </div>
  );
}

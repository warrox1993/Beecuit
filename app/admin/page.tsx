import { db } from "@/lib/db";
import { products, orders } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export default async function AdminDashboard() {
  const [pStats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      active: sql<number>`COUNT(*) FILTER (WHERE ${products.isActive})::int`,
      lowStock: sql<number>`COUNT(*) FILTER (WHERE ${products.stockQuantity} < 5)::int`,
    })
    .from(products);
  const [oStats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')::int`,
      paid: sql<number>`COUNT(*) FILTER (WHERE status = 'paid')::int`,
      shipped: sql<number>`COUNT(*) FILTER (WHERE status = 'shipped')::int`,
    })
    .from(orders);

  const Card = ({ label, value }: { label: string; value: number }) => (
    <div className="border-warm-brown/10 rounded-lg border bg-white p-4">
      <p className="text-warm-brown/60 text-xs">{label}</p>
      <p className="text-honey-dark mt-1 font-mono text-2xl">{value}</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Produits actifs" value={pStats?.active ?? 0} />
        <Card label="Stock faible (<5)" value={pStats?.lowStock ?? 0} />
        <Card label="Commandes en attente" value={oStats?.pending ?? 0} />
        <Card label="Commandes payées" value={oStats?.paid ?? 0} />
        <Card label="Commandes expédiées" value={oStats?.shipped ?? 0} />
        <Card label="Total commandes" value={oStats?.total ?? 0} />
        <Card label="Total produits" value={pStats?.total ?? 0} />
      </div>
    </div>
  );
}

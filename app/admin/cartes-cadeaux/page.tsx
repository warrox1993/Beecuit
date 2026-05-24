import { listAllGiftCards } from "@/lib/queries/gift-cards";
import { GiftCardTable } from "@/components/admin/GiftCardTable";

export const dynamic = "force-dynamic";

export default async function AdminGiftCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const rows = await listAllGiftCards({
    search: q,
    statusFilter:
      status === "pending" ||
      status === "delivered" ||
      status === "used" ||
      status === "expired"
        ? status
        : undefined,
  });

  return (
    <div>
      <h1 className="text-honey font-display text-3xl mb-6">Cartes cadeaux</h1>
      <form className="flex gap-2 mb-4" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher code, email…"
          className="border border-cookie/30 rounded px-3 py-2 text-sm flex-1"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border border-cookie/30 rounded px-3 py-2 text-sm"
        >
          <option value="">Tous</option>
          <option value="pending">En attente</option>
          <option value="delivered">Active</option>
          <option value="used">Utilisée</option>
          <option value="expired">Expirée</option>
        </select>
        <button
          type="submit"
          className="bg-honey text-cream px-4 py-2 rounded text-sm"
        >
          Filtrer
        </button>
      </form>
      <div className="border-warm-brown/10 rounded-lg border bg-white p-4">
        <GiftCardTable rows={rows} />
      </div>
    </div>
  );
}

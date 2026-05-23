import Link from "next/link";

type Row = {
  id: string;
  sku: string;
  nameFr: string | null;
  categorySlug: string | null;
  basePriceCents: number;
  stockQuantity: number;
  isActive: boolean;
  primaryImageUrl: string | null;
};

export function ProductTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-warm-brown/60">Aucun produit. Crée le premier !</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-warm-brown/60 text-left text-xs uppercase">
        <tr>
          <th className="py-2">Photo</th>
          <th>SKU</th>
          <th>Nom (FR)</th>
          <th>Catégorie</th>
          <th className="text-right">Prix</th>
          <th className="text-right">Stock</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-warm-brown/10">
        {rows.map((r) => {
          const lowStock = r.stockQuantity < 5;
          const out = r.stockQuantity === 0;
          return (
            <tr key={r.id} className={out ? "bg-gray-50" : lowStock ? "bg-red-50/50" : ""}>
              <td className="py-2">
                {r.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.primaryImageUrl} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded bg-soft-rose" />
                )}
              </td>
              <td className="font-mono text-xs">{r.sku}</td>
              <td>{r.nameFr ?? "—"}</td>
              <td className="text-warm-brown/70">{r.categorySlug ?? "—"}</td>
              <td className="text-right font-mono">{(r.basePriceCents / 100).toFixed(2)} €</td>
              <td className="text-right">{r.stockQuantity}</td>
              <td>{r.isActive ? "Actif" : "Inactif"}</td>
              <td className="text-right">
                <Link href={`/admin/produits/${r.id}`} className="text-honey-dark hover:underline">Éditer</Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

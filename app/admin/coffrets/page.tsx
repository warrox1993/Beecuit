import Link from "next/link";
import { db } from "@/lib/db";
import {
  products,
  productTranslations,
  coffretContents,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { isCoffretAvailable } from "@/lib/coffret/availability";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  sku: string;
  nameFr: string | null;
  discountPercent: number | null;
  isActive: boolean;
  isFeatured: boolean;
  contentsCount: number;
  primaryImageUrl: string | null;
};

export default async function AdminCoffretsPage() {
  const rows: Row[] = await db
    .select({
      id: products.id,
      sku: products.sku,
      nameFr: productTranslations.name,
      discountPercent: products.discountPercent,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      contentsCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${coffretContents} WHERE ${coffretContents.coffretId} = ${products.id}
      )`,
      primaryImageUrl: sql<string | null>`(
        SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1
      )`,
    })
    .from(products)
    .leftJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "fr")),
    )
    .where(eq(products.type, "coffret"))
    .orderBy(products.createdAt);

  const availability = await Promise.all(
    rows.map(async (r) => {
      try {
        const a = await isCoffretAvailable(r.id, 1, "fr");
        return { id: r.id, ok: a.available };
      } catch {
        return { id: r.id, ok: false };
      }
    }),
  );
  const availMap = new Map(availability.map((a) => [a.id, a.ok]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-honey font-display text-3xl">Coffrets</h1>
        <Link href="/admin/coffrets/nouveau">
          <Button className="bg-honey text-cream hover:bg-honey-dark">+ Nouveau coffret</Button>
        </Link>
      </div>
      <div className="border-warm-brown/10 mt-6 rounded-lg border bg-white p-4">
        {rows.length === 0 ? (
          <p className="text-warm-brown/60">Aucun coffret. Crée le premier !</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-warm-brown/60 text-left text-xs uppercase">
              <tr>
                <th className="py-2">Photo</th>
                <th>SKU</th>
                <th>Nom (FR)</th>
                <th className="text-right">Réduction</th>
                <th className="text-right">Biscuits</th>
                <th>Disponibilité</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-warm-brown/10 divide-y">
              {rows.map((r) => {
                const ok = availMap.get(r.id) ?? false;
                return (
                  <tr key={r.id}>
                    <td className="py-2">
                      {r.primaryImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.primaryImageUrl}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="bg-soft-rose h-12 w-12 rounded" />
                      )}
                    </td>
                    <td className="font-mono text-xs">{r.sku}</td>
                    <td>
                      {r.nameFr ?? "—"}
                      {r.isFeatured && (
                        <span className="bg-honey/20 text-honey-dark ml-2 rounded-full px-2 py-0.5 text-xs">
                          vedette
                        </span>
                      )}
                    </td>
                    <td className="text-right font-mono">
                      {r.discountPercent != null ? `${r.discountPercent}%` : "—"}
                    </td>
                    <td className="text-right">{r.contentsCount}</td>
                    <td>
                      {ok ? (
                        <span className="text-emerald-700">En stock</span>
                      ) : (
                        <span className="text-terracotta">Rupture</span>
                      )}
                    </td>
                    <td>{r.isActive ? "Actif" : "Inactif"}</td>
                    <td className="text-right">
                      <Link
                        href={`/admin/coffrets/${r.id}`}
                        className="text-honey-dark hover:underline"
                      >
                        Éditer
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

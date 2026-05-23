"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ProductTranslationTabs, type LocaleTranslations } from "./ProductTranslationTabs";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/admin/products.actions";
import { useRouter } from "next/navigation";

type Category = { id: string; slug: string; nameFr: string | null };

const EMPTY_NUTRI = { energy_kcal: 0, fat_g: 0, carbs_g: 0, protein_g: 0, salt_g: 0 };
const EMPTY_TRANS = { name: "", slug: "", shortDescription: "", longDescription: "", ingredients: "", allergens: [] as string[], nutritionalFactsPer100g: EMPTY_NUTRI, seoTitle: "", seoDescription: "" };

export function ProductForm({
  initial,
  categories,
}: {
  initial?: {
    id: string; sku: string; categoryId: string | null; basePriceCents: number; weightGrams: number;
    stockQuantity: number; isActive: boolean; isFeatured: boolean; translations: LocaleTranslations;
  };
  categories: Category[];
}) {
  const router = useRouter();
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [priceEur, setPriceEur] = useState((initial?.basePriceCents ?? 0) / 100);
  const [weightGrams, setWeight] = useState(initial?.weightGrams ?? 0);
  const [stockQuantity, setStock] = useState(initial?.stockQuantity ?? 0);
  const [isActive, setActive] = useState(initial?.isActive ?? true);
  const [isFeatured, setFeatured] = useState(initial?.isFeatured ?? false);
  const [trans, setTrans] = useState<LocaleTranslations>(initial?.translations ?? { fr: EMPTY_TRANS, nl: EMPTY_TRANS, de: EMPTY_TRANS, en: EMPTY_TRANS });
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const isInvalid = (Object.keys(trans) as Array<keyof LocaleTranslations>).some((l) => {
    const t = trans[l];
    return !t.name || !t.slug || !t.shortDescription || !t.longDescription || !t.ingredients || !t.seoTitle || !t.seoDescription;
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          try {
            const payload = {
              id: initial?.id,
              sku, categoryId, basePriceCents: Math.round(priceEur * 100),
              weightGrams, stockQuantity, isActive, isFeatured, translations: trans,
            };
            if (initial?.id) await updateProduct(payload);
            else {
              const newId = await createProduct(payload);
              router.push(`/admin/produits/${newId}`);
            }
            router.refresh();
          } catch (e2) {
            setErr((e2 as Error).message);
          }
        });
      }}
      className="grid grid-cols-1 gap-6 md:grid-cols-2"
    >
      <div className="space-y-3">
        <h2 className="font-display text-warm-brown text-lg">Données partagées</h2>
        <label className="block text-sm"><span className="text-xs text-warm-brown">SKU (A-Z, 0-9, -)</span>
          <input required pattern="[A-Z0-9-]+" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} />
        </label>
        <label className="block text-sm"><span className="text-xs text-warm-brown">Catégorie</span>
          <select className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2" value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value || null)}>
            <option value="">— Aucune —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nameFr ?? c.slug}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-sm"><span className="text-xs text-warm-brown">Prix TTC €</span>
            <input required type="number" step="0.01" min="0" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-right font-mono" value={priceEur} onChange={(e) => setPriceEur(Number(e.target.value))} />
          </label>
          <label className="block text-sm"><span className="text-xs text-warm-brown">Poids (g)</span>
            <input required type="number" min="1" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-right font-mono" value={weightGrams} onChange={(e) => setWeight(Number(e.target.value))} />
          </label>
          <label className="block text-sm"><span className="text-xs text-warm-brown">Stock</span>
            <input required type="number" min="0" className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-right font-mono" value={stockQuantity} onChange={(e) => setStock(Number(e.target.value))} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} /> Actif</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(e) => setFeatured(e.target.checked)} /> En vedette</label>
      </div>
      <div>
        <h2 className="font-display text-warm-brown text-lg">Traductions (toutes obligatoires)</h2>
        <ProductTranslationTabs value={trans} onChange={setTrans} />
      </div>
      <div className="md:col-span-2 flex items-center justify-between border-t border-warm-brown/10 pt-4">
        {err && <p className="text-terracotta text-sm">{err}</p>}
        <div className="ml-auto flex gap-2">
          {initial?.id && (
            <Button type="button" variant="outline" disabled={pending} onClick={() => start(async () => { await deleteProduct(initial.id); router.push("/admin/produits"); })}>
              Désactiver
            </Button>
          )}
          <Button type="submit" disabled={pending || isInvalid} className="bg-honey text-cream hover:bg-honey-dark">
            {pending ? "..." : (initial?.id ? "Mettre à jour" : "Créer")}
          </Button>
        </div>
      </div>
    </form>
  );
}

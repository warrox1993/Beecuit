"use client";
import { useState, useTransition } from "react";
import { CategoryForm } from "./CategoryForm";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "@/lib/actions/admin/categories.actions";

type Trans = { name: string; description: string };
type LT = Record<"fr" | "nl" | "de" | "en", Trans>;

type Row = {
  id: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  translations: LT;
};

export function CategoryListClient({ rows }: { rows: Row[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      {rows.map((r) =>
        editing === r.id ? (
          <div key={r.id} className="rounded-lg border border-warm-brown/10 p-4">
            <CategoryForm
              initial={{ id: r.id, slug: r.slug, sortOrder: r.sortOrder, isActive: r.isActive, translations: r.translations }}
              onDone={() => setEditing(null)}
            />
          </div>
        ) : (
          <div key={r.id} className="flex justify-between rounded-lg border border-warm-brown/10 p-4">
            <div>
              <p className="font-mono text-xs text-warm-brown/60">{r.slug}</p>
              <p className="text-warm-brown">{r.translations.fr.name}</p>
              <p className="text-warm-brown/60 text-xs">{r.productCount} produit(s) · sort {r.sortOrder} · {r.isActive ? "active" : "inactive"}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => setEditing(r.id)}>Éditer</Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Supprimer "${r.translations.fr.name}" ? Les produits perdront leur catégorie.`)) return;
                  start(async () => { await deleteCategory(r.id); });
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        ),
      )}
      {creating ? (
        <div className="rounded-lg border border-warm-brown/10 p-4">
          <CategoryForm onDone={() => setCreating(false)} />
        </div>
      ) : (
        <Button onClick={() => setCreating(true)} className="bg-honey text-cream hover:bg-honey-dark">+ Ajouter une catégorie</Button>
      )}
    </div>
  );
}

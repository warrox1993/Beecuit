"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCategory, updateCategory } from "@/lib/actions/admin/categories.actions";
import { useRouter } from "next/navigation";

type Trans = { name: string; description: string };
type LT = Record<"fr" | "nl" | "de" | "en", Trans>;

export function CategoryForm({
  initial,
  onDone,
}: {
  initial?: { id: string; slug: string; sortOrder: number; isActive: boolean; translations: LT };
  onDone: () => void;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [sortOrder, setSort] = useState(initial?.sortOrder ?? 0);
  const [isActive, setActive] = useState(initial?.isActive ?? true);
  const [trans, setTrans] = useState<LT>(
    initial?.translations ?? {
      fr: { name: "", description: "" },
      nl: { name: "", description: "" },
      de: { name: "", description: "" },
      en: { name: "", description: "" },
    },
  );
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          if (initial?.id)
            await updateCategory({
              id: initial.id,
              slug,
              sortOrder,
              isActive,
              translations: trans,
            });
          else await createCategory({ slug, sortOrder, isActive, translations: trans });
          router.refresh();
          onDone();
        });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-3 gap-2">
        <label className="text-sm">
          <span className="text-warm-brown text-xs">Slug</span>
          <input
            required
            pattern="[a-z0-9-]+"
            className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-warm-brown text-xs">Sort order</span>
          <input
            type="number"
            className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono"
            value={sortOrder}
            onChange={(e) => setSort(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 pt-5 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setActive(e.target.checked)} />{" "}
          Active
        </label>
      </div>
      {(["fr", "nl", "de", "en"] as const).map((l) => (
        <div key={l} className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <span className="text-warm-brown text-xs">{l.toUpperCase()} nom</span>
            <input
              required
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2"
              value={trans[l].name}
              onChange={(e) => setTrans({ ...trans, [l]: { ...trans[l], name: e.target.value } })}
            />
          </label>
          <label className="text-sm">
            <span className="text-warm-brown text-xs">{l.toUpperCase()} description</span>
            <input
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2"
              value={trans[l].description}
              onChange={(e) =>
                setTrans({ ...trans, [l]: { ...trans[l], description: e.target.value } })
              }
            />
          </label>
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-honey text-cream hover:bg-honey-dark"
        >
          {initial ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </form>
  );
}

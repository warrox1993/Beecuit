"use client";
import { useState } from "react";

type Trans = {
  name: string; slug: string; shortDescription: string; longDescription: string;
  ingredients: string; allergens: string[];
  nutritionalFactsPer100g: { energy_kcal: number; fat_g: number; carbs_g: number; protein_g: number; salt_g: number };
  seoTitle: string; seoDescription: string;
};

const ALLERGENS = ["Gluten","Crustacés","Œufs","Poissons","Arachides","Soja","Lait","Fruits à coque","Céleri","Moutarde","Sésame","Sulfites","Lupin","Mollusques"];

export type LocaleTranslations = Record<"fr" | "nl" | "de" | "en", Trans>;

export function ProductTranslationTabs({
  value,
  onChange,
}: {
  value: LocaleTranslations;
  onChange: (v: LocaleTranslations) => void;
}) {
  const [active, setActive] = useState<"fr" | "nl" | "de" | "en">("fr");
  const incomplete = (l: "fr" | "nl" | "de" | "en") => {
    const t = value[l];
    return !t.name || !t.slug || !t.shortDescription || !t.longDescription || !t.ingredients || !t.seoTitle || !t.seoDescription;
  };
  const t = value[active];
  const set = (patch: Partial<Trans>) => onChange({ ...value, [active]: { ...t, ...patch } });

  return (
    <div>
      <div className="flex gap-1 border-b border-warm-brown/10">
        {(["fr", "nl", "de", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setActive(l)}
            className={`relative px-4 py-2 text-sm uppercase ${active === l ? "border-b-2 border-honey text-honey-dark" : "text-warm-brown/60"}`}
          >
            {l}
            {incomplete(l) && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <label className="block"><span className="text-xs text-warm-brown">Nom</span>
          <input className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">Slug (kebab-case)</span>
          <input className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono text-sm" value={t.slug} onChange={(e) => set({ slug: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">Description courte (max 160)</span>
          <input maxLength={160} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">Description longue (max 2000)</span>
          <textarea maxLength={2000} rows={4} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.longDescription} onChange={(e) => set({ longDescription: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">Ingrédients</span>
          <textarea rows={3} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.ingredients} onChange={(e) => set({ ingredients: e.target.value })} />
        </label>
        <fieldset>
          <legend className="text-xs text-warm-brown">Allergènes</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {ALLERGENS.map((a) => {
              const on = t.allergens.includes(a);
              return (
                <button
                  type="button"
                  key={a}
                  onClick={() => set({ allergens: on ? t.allergens.filter((x) => x !== a) : [...t.allergens, a] })}
                  className={`rounded-full border px-3 py-1 text-xs ${on ? "border-honey bg-honey/10 text-honey-dark" : "border-warm-brown/20 text-warm-brown"}`}
                >{a}</button>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs text-warm-brown">Valeurs nutritionnelles /100 g</legend>
          <div className="mt-1 grid grid-cols-5 gap-2 text-xs">
            {(["energy_kcal","fat_g","carbs_g","protein_g","salt_g"] as const).map((k) => (
              <label key={k}>
                <span className="block">{k}</span>
                <input type="number" step="0.1" value={t.nutritionalFactsPer100g[k]} onChange={(e) => set({ nutritionalFactsPer100g: { ...t.nutritionalFactsPer100g, [k]: Number(e.target.value) } })} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-2 py-1" />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block"><span className="text-xs text-warm-brown">SEO title (max 60)</span>
          <input maxLength={60} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
        </label>
        <label className="block"><span className="text-xs text-warm-brown">SEO description (max 160)</span>
          <input maxLength={160} className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm" value={t.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
        </label>
      </div>
    </div>
  );
}

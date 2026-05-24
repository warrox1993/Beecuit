"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  createCoffret,
  updateCoffret,
  deleteCoffret,
} from "@/lib/actions/admin/coffrets.actions";
import {
  CoffretCompositionEditor,
  type Biscuit,
  type CompositionEntry,
} from "./CoffretCompositionEditor";
import { CoffretPricePreview } from "./CoffretPricePreview";

type CoffretTrans = {
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
};

export type CoffretLocaleTranslations = Record<"fr" | "nl" | "de" | "en", CoffretTrans>;

const LOCALES: ReadonlyArray<"fr" | "nl" | "de" | "en"> = ["fr", "nl", "de", "en"];

const EMPTY_TRANS: CoffretTrans = {
  name: "",
  slug: "",
  shortDescription: "",
  longDescription: "",
  seoTitle: "",
  seoDescription: "",
};

const EMPTY_TRANSLATIONS: CoffretLocaleTranslations = {
  fr: { ...EMPTY_TRANS },
  nl: { ...EMPTY_TRANS },
  de: { ...EMPTY_TRANS },
  en: { ...EMPTY_TRANS },
};

export function CoffretForm({
  initial,
  biscuits,
}: {
  initial?: {
    id: string;
    sku: string;
    weightGrams: number;
    discountPercent: number;
    isActive: boolean;
    isFeatured: boolean;
    contents: CompositionEntry[];
    translations: CoffretLocaleTranslations;
  };
  biscuits: Biscuit[];
}) {
  const router = useRouter();
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [weightGrams, setWeight] = useState(initial?.weightGrams ?? 250);
  const [discountPercent, setDiscount] = useState(initial?.discountPercent ?? 10);
  const [isActive, setActive] = useState(initial?.isActive ?? true);
  const [isFeatured, setFeatured] = useState(initial?.isFeatured ?? false);
  const [contents, setContents] = useState<CompositionEntry[]>(initial?.contents ?? []);
  const [trans, setTrans] = useState<CoffretLocaleTranslations>(
    initial?.translations ?? EMPTY_TRANSLATIONS,
  );
  const [activeLocale, setActiveLocale] = useState<"fr" | "nl" | "de" | "en">("fr");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const biscuitById = useMemo(() => {
    const m = new Map<string, Biscuit>();
    for (const b of biscuits) m.set(b.id, b);
    return m;
  }, [biscuits]);

  const subtotalCents = contents.reduce((acc, entry) => {
    const b = biscuitById.get(entry.biscuitId);
    return acc + (b?.basePriceCents ?? 0) * entry.quantity;
  }, 0);

  const localeIncomplete = (loc: "fr" | "nl" | "de" | "en"): boolean => {
    const t = trans[loc];
    return (
      !t.name ||
      !t.slug ||
      !t.shortDescription ||
      !t.longDescription ||
      !t.seoTitle ||
      !t.seoDescription
    );
  };

  const isInvalid =
    LOCALES.some(localeIncomplete) || contents.length === 0 || !sku || weightGrams < 1;

  const t = trans[activeLocale];
  const setT = (patch: Partial<CoffretTrans>) =>
    setTrans({ ...trans, [activeLocale]: { ...t, ...patch } });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    start(async () => {
      try {
        const payload = {
          id: initial?.id,
          sku,
          weightGrams,
          discountPercent,
          isActive,
          isFeatured,
          contents,
          translations: trans,
        };
        if (initial?.id) {
          await updateCoffret(payload);
        } else {
          const newId = await createCoffret(payload);
          router.push(`/admin/coffrets/${newId}`);
        }
        router.refresh();
      } catch (e2) {
        setErr((e2 as Error).message);
      }
    });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <h2 className="font-display text-warm-brown text-lg">Données du coffret</h2>
        <label className="block text-sm">
          <span className="text-warm-brown text-xs">SKU (A-Z, 0-9, -)</span>
          <input
            required
            pattern="[A-Z0-9-]+"
            className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            <span className="text-warm-brown text-xs">Poids (g)</span>
            <input
              required
              type="number"
              min={1}
              max={10000}
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-right font-mono"
              value={weightGrams}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="text-warm-brown text-xs">Réduction (%)</span>
            <input
              required
              type="number"
              min={0}
              max={99}
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-right font-mono"
              value={discountPercent}
              onChange={(e) =>
                setDiscount(Math.max(0, Math.min(99, Number(e.target.value) | 0)))
              }
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setActive(e.target.checked)}
          />{" "}
          Actif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setFeatured(e.target.checked)}
          />{" "}
          En vedette
        </label>

        <div className="border-warm-brown/10 mt-4 rounded-lg border bg-white p-4">
          <CoffretCompositionEditor
            biscuits={biscuits}
            value={contents}
            onChange={setContents}
          />
        </div>

        <CoffretPricePreview
          subtotalCents={subtotalCents}
          discountPercent={discountPercent}
        />
      </div>

      <div>
        <h2 className="font-display text-warm-brown text-lg">
          Traductions (toutes obligatoires)
        </h2>
        <div className="border-warm-brown/10 mt-2 flex gap-1 border-b">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setActiveLocale(loc)}
              className={`relative px-4 py-2 text-sm uppercase ${
                activeLocale === loc
                  ? "border-honey text-honey-dark border-b-2"
                  : "text-warm-brown/60"
              }`}
            >
              {loc}
              {localeIncomplete(loc) && (
                <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-warm-brown text-xs">Nom (max 120)</span>
            <input
              maxLength={120}
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
              value={t.name}
              onChange={(e) => setT({ name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-warm-brown text-xs">Slug (kebab-case, max 140)</span>
            <input
              maxLength={140}
              pattern="[a-z0-9-]+"
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 font-mono text-sm"
              value={t.slug}
              onChange={(e) => setT({ slug: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-warm-brown text-xs">Description courte (max 280)</span>
            <input
              maxLength={280}
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
              value={t.shortDescription}
              onChange={(e) => setT({ shortDescription: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-warm-brown text-xs">Description longue (max 2000)</span>
            <textarea
              maxLength={2000}
              rows={5}
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
              value={t.longDescription}
              onChange={(e) => setT({ longDescription: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-warm-brown text-xs">SEO title (max 70)</span>
            <input
              maxLength={70}
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
              value={t.seoTitle}
              onChange={(e) => setT({ seoTitle: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-warm-brown text-xs">SEO description (max 160)</span>
            <input
              maxLength={160}
              className="border-warm-brown/20 mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
              value={t.seoDescription}
              onChange={(e) => setT({ seoDescription: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="border-warm-brown/10 flex items-center justify-between border-t pt-4 md:col-span-2">
        {err && <p className="text-terracotta text-sm">{err}</p>}
        <div className="ml-auto flex gap-2">
          {initial?.id && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await deleteCoffret(initial.id);
                  router.push("/admin/coffrets");
                })
              }
            >
              Désactiver
            </Button>
          )}
          <Button
            type="submit"
            disabled={pending || isInvalid}
            className="bg-honey text-cream hover:bg-honey-dark"
          >
            {pending ? "..." : initial?.id ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </div>
    </form>
  );
}

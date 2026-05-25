"use client";
import { useState, useTransition } from "react";
import { upsertTranslation } from "@/lib/actions/journal.actions";

type Article = {
  id: string;
  category: "recettes" | "savoir-faire" | "saisons" | "atelier";
};

type Translation = {
  id: string;
  articleId: string;
  locale: "fr" | "nl" | "en" | "de";
  title: string;
  excerpt: string;
  bodyJson: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  recipeYieldLabel: string | null;
  recipeIngredients: Array<{ name: string; qty: string; unit: string }> | null;
  recipeSteps: Array<{ n: number; text: string }> | null;
};

const LOCALES: Array<"fr" | "nl" | "en" | "de"> = ["fr", "nl", "en", "de"];

export function JournalLocaleTabs({
  article,
  translations,
}: {
  article: Article;
  translations: Translation[];
}) {
  const [activeLocale, setActiveLocale] = useState<"fr" | "nl" | "en" | "de">("fr");
  const current = translations.find((t) => t.locale === activeLocale);
  return (
    <div>
      <div role="tablist" className="border-warm-brown/10 flex gap-1 border-b">
        {LOCALES.map((l) => {
          const tr = translations.find((t) => t.locale === l);
          return (
            <button
              key={l}
              role="tab"
              type="button"
              aria-selected={activeLocale === l}
              onClick={() => setActiveLocale(l)}
              className={`px-3 py-2 text-sm ${
                activeLocale === l
                  ? "border-honey text-warm-brown border-b-2"
                  : "text-warm-brown/60"
              }`}
            >
              {l.toUpperCase()}
              {!tr && <span className="text-warm-brown/40 ml-1 text-xs">·</span>}
              {tr && tr.title && <span className="text-leaf ml-1 text-xs">✓</span>}
            </button>
          );
        })}
      </div>
      <TranslationForm
        key={activeLocale}
        article={article}
        locale={activeLocale}
        initial={current}
      />
    </div>
  );
}

function TranslationForm({
  article,
  locale,
  initial,
}: {
  article: Article;
  locale: "fr" | "nl" | "en" | "de";
  initial: Translation | undefined;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [bodyJsonStr, setBodyJsonStr] = useState(
    JSON.stringify(
      initial?.bodyJson ?? { type: "doc", content: [{ type: "paragraph" }] },
      null,
      2,
    ),
  );
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [recipeYieldLabel, setRecipeYieldLabel] = useState(initial?.recipeYieldLabel ?? "");
  const [recipeIngredientsStr, setRecipeIngredientsStr] = useState(
    JSON.stringify(initial?.recipeIngredients ?? [], null, 2),
  );
  const [recipeStepsStr, setRecipeStepsStr] = useState(
    JSON.stringify(initial?.recipeSteps ?? [], null, 2),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const isRecipe = article.category === "recettes";

  return (
    <div className="mt-6 space-y-4">
      <label className="block text-sm">
        <span className="text-warm-brown font-medium">Titre</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="text-warm-brown font-medium">Excerpt (200 chars max)</span>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          maxLength={200}
          className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-2"
          rows={2}
        />
        <span className="text-warm-brown/50 text-xs">{excerpt.length}/200</span>
      </label>
      <label className="block text-sm">
        <span className="text-warm-brown font-medium">
          Body (JSON ProseMirror — Tiptap editor à venir)
        </span>
        <textarea
          value={bodyJsonStr}
          onChange={(e) => setBodyJsonStr(e.target.value)}
          className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
          rows={16}
        />
      </label>
      <details className="text-sm">
        <summary className="text-warm-brown/70 cursor-pointer">SEO (optionnel)</summary>
        <div className="mt-2 space-y-2">
          <label className="block">
            <span className="text-warm-brown/80 text-xs">SEO title (fallback sur title)</span>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-1"
            />
          </label>
          <label className="block">
            <span className="text-warm-brown/80 text-xs">
              SEO description (fallback sur excerpt)
            </span>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-1"
              rows={2}
            />
          </label>
        </div>
      </details>

      {isRecipe && (
        <details open className="text-sm">
          <summary className="text-warm-brown cursor-pointer font-medium">
            Recette ({locale})
          </summary>
          <div className="mt-2 space-y-2">
            <label className="block">
              <span className="text-warm-brown/80 text-xs">Yield (ex: 24 biscuits)</span>
              <input
                type="text"
                value={recipeYieldLabel}
                onChange={(e) => setRecipeYieldLabel(e.target.value)}
                className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-1"
              />
            </label>
            <label className="block">
              <span className="text-warm-brown/80 text-xs">
                Ingrédients (JSON [{`{name, qty, unit}`}])
              </span>
              <textarea
                value={recipeIngredientsStr}
                onChange={(e) => setRecipeIngredientsStr(e.target.value)}
                className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-1 font-mono text-xs"
                rows={6}
              />
            </label>
            <label className="block">
              <span className="text-warm-brown/80 text-xs">
                Étapes (JSON [{`{n, text}`}])
              </span>
              <textarea
                value={recipeStepsStr}
                onChange={(e) => setRecipeStepsStr(e.target.value)}
                className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-1 font-mono text-xs"
                rows={6}
              />
            </label>
          </div>
        </details>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            try {
              const bodyJson = JSON.parse(bodyJsonStr);
              const recipeIngredients = isRecipe ? JSON.parse(recipeIngredientsStr) : null;
              const recipeSteps = isRecipe ? JSON.parse(recipeStepsStr) : null;
              const r = await upsertTranslation({
                articleId: article.id,
                locale,
                title,
                excerpt,
                bodyJson,
                seoTitle: seoTitle || null,
                seoDescription: seoDescription || null,
                recipeYieldLabel: recipeYieldLabel || null,
                recipeIngredients,
                recipeSteps,
              });
              setMsg(r.ok ? `Traduction ${locale} sauvegardée` : "Erreur");
            } catch (e) {
              setMsg(e instanceof Error ? `Erreur : ${e.message}` : "Erreur JSON");
            }
          });
        }}
        className="bg-honey hover:bg-honey-dark rounded px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Sauvegarde…" : `Sauvegarder ${locale}`}
      </button>
      {msg && <p className="text-warm-brown/70 text-xs">{msg}</p>}
    </div>
  );
}

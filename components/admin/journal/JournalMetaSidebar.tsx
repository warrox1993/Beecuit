"use client";
import { useRef, useState, useTransition } from "react";
import { updateArticleMeta } from "@/lib/actions/journal.actions";
import { uploadToBlob } from "@/lib/actions/blob-upload.actions";

type Article = {
  id: string;
  category: "recettes" | "savoir-faire" | "saisons" | "atelier";
  coverImage: string;
  coverAltFr: string;
  pinterestImage: string | null;
  recipePrepMin: number | null;
  recipeCookMin: number | null;
  recipeDifficulty: "facile" | "moyen" | "avance" | null;
  featuredProductSlugs: string[];
};

export function JournalMetaSidebar({ article }: { article: Article }) {
  const [category, setCategory] = useState(article.category);
  const [coverImage, setCoverImage] = useState(article.coverImage);
  const [coverAltFr, setCoverAltFr] = useState(article.coverAltFr);
  const [pinterestImage, setPinterestImage] = useState(article.pinterestImage ?? "");
  const [recipePrepMin, setRecipePrepMin] = useState<number | "">(article.recipePrepMin ?? "");
  const [recipeCookMin, setRecipeCookMin] = useState<number | "">(article.recipeCookMin ?? "");
  const [recipeDifficulty, setRecipeDifficulty] = useState<
    "facile" | "moyen" | "avance" | ""
  >(article.recipeDifficulty ?? "");
  const [featuredProductSlugs, setFeaturedProductSlugs] = useState(
    article.featuredProductSlugs.join(", "),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const coverInputRef = useRef<HTMLInputElement>(null);
  const pinterestInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPinterest, setUploadingPinterest] = useState(false);

  const isRecipe = category === "recettes";

  return (
    <div className="border-warm-brown/10 sticky top-4 space-y-4 rounded border bg-white p-4">
      <h2 className="text-warm-brown font-display text-lg">Méta</h2>

      <label className="block text-sm">
        <span className="text-warm-brown font-medium">Catégorie</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Article["category"])}
          className="border-warm-brown/20 mt-1 w-full rounded border px-2 py-1"
        >
          <option value="recettes">Recettes</option>
          <option value="savoir-faire">Savoir-faire</option>
          <option value="saisons">Saisons</option>
          <option value="atelier">L&apos;atelier</option>
        </select>
      </label>

      <div className="block text-sm">
        <span className="text-warm-brown font-medium">Image de couverture (URL)</span>
        <div className="mt-1 flex gap-2">
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="border-warm-brown/20 flex-1 rounded border px-2 py-1"
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingCover(true);
              try {
                const url = await downsizeAndUpload(file, uploadToBlob);
                setCoverImage(url);
              } catch (err) {
                setMsg(
                  err instanceof Error
                    ? `Erreur upload : ${err.message}`
                    : "Erreur upload",
                );
              } finally {
                setUploadingCover(false);
                if (coverInputRef.current) coverInputRef.current.value = "";
              }
            }}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="bg-warm-brown/10 text-warm-brown hover:bg-warm-brown/20 rounded px-2 py-1 text-xs disabled:opacity-50"
          >
            {uploadingCover ? "…" : "Upload"}
          </button>
        </div>
      </div>

      <label className="block text-sm">
        <span className="text-warm-brown font-medium">Alt FR de la couverture</span>
        <input
          type="text"
          value={coverAltFr}
          onChange={(e) => setCoverAltFr(e.target.value)}
          className="border-warm-brown/20 mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <div className="block text-sm">
        <span className="text-warm-brown font-medium">
          Image Pinterest (URL, optionnel)
        </span>
        <div className="mt-1 flex gap-2">
          <input
            type="url"
            value={pinterestImage}
            onChange={(e) => setPinterestImage(e.target.value)}
            className="border-warm-brown/20 flex-1 rounded border px-2 py-1"
          />
          <input
            ref={pinterestInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingPinterest(true);
              try {
                const url = await downsizeAndUpload(file, uploadToBlob);
                setPinterestImage(url);
              } catch (err) {
                setMsg(
                  err instanceof Error
                    ? `Erreur upload : ${err.message}`
                    : "Erreur upload",
                );
              } finally {
                setUploadingPinterest(false);
                if (pinterestInputRef.current) pinterestInputRef.current.value = "";
              }
            }}
          />
          <button
            type="button"
            onClick={() => pinterestInputRef.current?.click()}
            disabled={uploadingPinterest}
            className="bg-warm-brown/10 text-warm-brown hover:bg-warm-brown/20 rounded px-2 py-1 text-xs disabled:opacity-50"
          >
            {uploadingPinterest ? "…" : "Upload"}
          </button>
        </div>
      </div>

      {isRecipe && (
        <>
          <label className="block text-sm">
            <span className="text-warm-brown font-medium">Préparation (min)</span>
            <input
              type="number"
              min="1"
              value={recipePrepMin}
              onChange={(e) =>
                setRecipePrepMin(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              className="border-warm-brown/20 mt-1 w-full rounded border px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-warm-brown font-medium">Cuisson (min)</span>
            <input
              type="number"
              min="1"
              value={recipeCookMin}
              onChange={(e) =>
                setRecipeCookMin(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              className="border-warm-brown/20 mt-1 w-full rounded border px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-warm-brown font-medium">Difficulté</span>
            <select
              value={recipeDifficulty}
              onChange={(e) =>
                setRecipeDifficulty(e.target.value as "facile" | "moyen" | "avance" | "")
              }
              className="border-warm-brown/20 mt-1 w-full rounded border px-2 py-1"
            >
              <option value="">—</option>
              <option value="facile">Facile</option>
              <option value="moyen">Moyen</option>
              <option value="avance">Avancé</option>
            </select>
          </label>
        </>
      )}

      <label className="block text-sm">
        <span className="text-warm-brown font-medium">
          Produits liés (slugs séparés par virgule)
        </span>
        <input
          type="text"
          value={featuredProductSlugs}
          onChange={(e) => setFeaturedProductSlugs(e.target.value)}
          className="border-warm-brown/20 mt-1 w-full rounded border px-2 py-1"
        />
      </label>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            try {
              const r = await updateArticleMeta({
                id: article.id,
                category,
                coverImage,
                coverAltFr,
                pinterestImage: pinterestImage || null,
                recipePrepMin: typeof recipePrepMin === "number" ? recipePrepMin : null,
                recipeCookMin: typeof recipeCookMin === "number" ? recipeCookMin : null,
                recipeDifficulty: recipeDifficulty || null,
                featuredProductSlugs: featuredProductSlugs
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              });
              setMsg(r.ok ? "Méta sauvegardée" : "Erreur");
            } catch (e) {
              setMsg(e instanceof Error ? `Erreur : ${e.message}` : "Erreur");
            }
          });
        }}
        className="bg-honey hover:bg-honey-dark w-full rounded px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Sauvegarde…" : "Sauvegarder méta"}
      </button>
      {msg && <p className="text-warm-brown/70 text-xs">{msg}</p>}
    </div>
  );
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new window.Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

async function downsizeAndUpload(
  file: File,
  uploadFn: typeof uploadToBlob,
): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const maxW = 2000;
  const ratio = Math.min(1, maxW / img.width);
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/jpeg",
      0.85,
    );
  });
  const fd = new FormData();
  fd.append(
    "file",
    new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }),
  );
  const result = await uploadFn(fd);
  return result.url;
}

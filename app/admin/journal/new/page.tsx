import { createArticle } from "@/lib/actions/journal.actions";

export default function NewArticlePage() {
  return (
    <section className="max-w-xl">
      <h1 className="text-warm-brown font-display mb-6 text-3xl">Nouvel article</h1>
      <form action={createArticle} className="space-y-4">
        <label className="block">
          <span className="text-warm-brown text-sm font-medium">Titre (FR)</span>
          <input
            name="titleFr"
            type="text"
            required
            minLength={3}
            className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-warm-brown text-sm font-medium">Catégorie</span>
          <select
            name="category"
            required
            className="border-warm-brown/20 mt-1 w-full rounded border px-3 py-2"
          >
            <option value="recettes">Recettes</option>
            <option value="savoir-faire">Savoir-faire</option>
            <option value="saisons">Saisons</option>
            <option value="atelier">L&apos;atelier</option>
          </select>
        </label>
        <button type="submit" className="bg-honey rounded px-4 py-2 text-white">
          Créer
        </button>
      </form>
    </section>
  );
}

import Link from "next/link";
import { listArticlesForAdmin } from "@/lib/journal/queries";

export const dynamic = "force-dynamic";

export default async function AdminJournalListPage() {
  const articles = await listArticlesForAdmin();
  return (
    <section>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-warm-brown font-display text-3xl">Journal</h1>
        <Link
          href="/admin/journal/new"
          className="bg-honey hover:bg-honey-dark rounded px-4 py-2 text-white"
        >
          Nouvel article
        </Link>
      </header>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-warm-brown/10 border-b text-left">
            <th className="p-2">Titre (FR)</th>
            <th className="p-2">Catégorie</th>
            <th className="p-2">Statut</th>
            <th className="p-2">À la une</th>
            <th className="p-2">Locales</th>
            <th className="p-2">Modifié</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id} className="border-warm-brown/5 border-b">
              <td className="p-2">
                <Link href={`/admin/journal/${a.id}`} className="hover:text-honey-dark">
                  {a.slug}
                </Link>
              </td>
              <td className="p-2">{a.category}</td>
              <td className="p-2">{a.status}</td>
              <td className="p-2">{a.isFeatured ? "★" : ""}</td>
              <td className="p-2">{a.translations.join(", ")}</td>
              <td className="p-2">{a.updatedAt.toISOString().slice(0, 10)}</td>
            </tr>
          ))}
          {articles.length === 0 && (
            <tr>
              <td colSpan={6} className="text-warm-brown/60 p-6 text-center">
                Aucun article pour l&apos;instant.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

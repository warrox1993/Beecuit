import { notFound } from "next/navigation";
import { getArticleForAdmin } from "@/lib/journal/queries";
import { JournalMetaSidebar } from "@/components/admin/journal/JournalMetaSidebar";
import { JournalLocaleTabs } from "@/components/admin/journal/JournalLocaleTabs";
import {
  publishArticle,
  unpublishArticle,
  setFeatured,
  clearFeatured,
} from "@/lib/actions/journal.actions";

export const dynamic = "force-dynamic";

export default async function AdminJournalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getArticleForAdmin(id);
  if (!data) notFound();
  const articleId = data.article.id;
  async function publishAction() {
    "use server";
    await publishArticle(articleId);
  }
  async function unpublishAction() {
    "use server";
    await unpublishArticle(articleId);
  }
  async function setFeaturedAction() {
    "use server";
    await setFeatured(articleId);
  }
  async function clearFeaturedAction() {
    "use server";
    await clearFeatured();
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <main className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-warm-brown font-display text-2xl">{data.article.slug}</h1>
            <span className="bg-warm-brown/10 rounded px-2 py-1 text-xs">
              {data.article.status}
            </span>
            {data.article.isFeatured && (
              <span className="bg-honey/20 text-honey-dark rounded px-2 py-1 text-xs">
                {"★ À la une"}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data.article.status === "draft" ? (
              <form action={publishAction}>
                <button
                  type="submit"
                  className="bg-honey hover:bg-honey-dark rounded px-4 py-2 text-sm text-white"
                >
                  Publier
                </button>
              </form>
            ) : (
              <form action={unpublishAction}>
                <button
                  type="submit"
                  className="border-warm-brown/30 text-warm-brown hover:bg-warm-brown/10 rounded border px-4 py-2 text-sm"
                >
                  Dépublier
                </button>
              </form>
            )}
            {data.article.isFeatured ? (
              <form action={clearFeaturedAction}>
                <button
                  type="submit"
                  className="border-warm-brown/30 text-warm-brown hover:bg-warm-brown/10 rounded border px-4 py-2 text-sm"
                >
                  Retirer de la une
                </button>
              </form>
            ) : (
              <form action={setFeaturedAction}>
                <button
                  type="submit"
                  className="border-honey/40 text-honey-dark hover:bg-honey/10 rounded border px-4 py-2 text-sm"
                >
                  Marquer à la une
                </button>
              </form>
            )}
          </div>
        </header>
        <JournalLocaleTabs article={data.article} translations={data.translations} />
      </main>
      <aside>
        <JournalMetaSidebar article={data.article} />
      </aside>
    </div>
  );
}

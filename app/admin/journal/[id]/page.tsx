import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleForAdmin } from "@/lib/journal/queries";
import { signPreviewToken } from "@/lib/journal/preview-token";
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
  // Guard against a malformed id: the column is uuid, so a non-uuid would throw
  // a Postgres "invalid input syntax" → 500 instead of a clean 404.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }
  const data = await getArticleForAdmin(id);
  if (!data) notFound();
  const articleId = data.article.id;
  // Signed, short-lived preview URL so the admin can view a draft on the public
  // route (which now requires a valid HMAC token, not a bare ?preview=1).
  const previewToken = signPreviewToken(articleId, 900);
  const previewUrl = `/fr/journal/${data.article.slug}?preview=${previewToken}`;
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
            <Link
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-warm-brown/30 text-warm-brown hover:bg-warm-brown/10 rounded border px-4 py-2 text-sm"
            >
              Aperçu
            </Link>
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

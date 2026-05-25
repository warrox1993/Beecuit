import { notFound } from "next/navigation";
import { getArticleForAdmin } from "@/lib/journal/queries";
import { JournalMetaSidebar } from "@/components/admin/journal/JournalMetaSidebar";
import { JournalLocaleTabs } from "@/components/admin/journal/JournalLocaleTabs";

export const dynamic = "force-dynamic";

export default async function AdminJournalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getArticleForAdmin(id);
  if (!data) notFound();
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <main className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-warm-brown font-display text-2xl">{data.article.slug}</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-warm-brown/10 rounded px-2 py-1">{data.article.status}</span>
            {data.article.isFeatured && (
              <span className="bg-honey/20 text-honey-dark rounded px-2 py-1">
                {"★ À la une"}
              </span>
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

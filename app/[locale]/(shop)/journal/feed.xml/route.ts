import { listPublishedArticles } from "@/lib/journal/queries";
import { env } from "@/lib/env";

export const revalidate = 600;

const SUPPORTED = new Set(["fr", "nl", "en", "de"]);

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ locale: string }> },
) {
  const { locale } = await ctx.params;
  if (!SUPPORTED.has(locale)) return new Response("Not found", { status: 404 });

  const articles = await listPublishedArticles({
    locale: locale as "fr" | "nl" | "en" | "de",
    limit: 20,
  });
  const base = env.NEXT_PUBLIC_APP_URL;
  const updated =
    articles[0]?.publishedAt?.toISOString() ?? new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Journal — Au Fil des Saveurs</title>
  <link href="${base}/${locale}/journal" rel="alternate"/>
  <link href="${base}/${locale}/journal/feed.xml" rel="self"/>
  <id>${base}/${locale}/journal</id>
  <updated>${updated}</updated>
${articles
  .map(
    (a) => `  <entry>
    <title>${escape(a.translation.title)}</title>
    <link href="${base}/${locale}/journal/${a.slug}"/>
    <id>${base}/${locale}/journal/${a.slug}</id>
    <updated>${(a.publishedAt ?? a.updatedAt).toISOString()}</updated>
    <summary>${escape(a.translation.excerpt)}</summary>
    <category term="${a.category}"/>
    <author><name>${escape(a.author)}</name></author>
  </entry>`,
  )
  .join("\n")}
</feed>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}

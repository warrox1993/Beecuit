import { ImageResponse } from "next/og";
import {
  OG_SIZE,
  OG_COLORS,
  OG_FONT_STACK,
  OG_CONTENT_TYPE,
} from "@/lib/seo/og-image";
import { db } from "@/lib/db";
import { journalArticles, journalArticleTranslations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: { locale: "fr" | "nl" | "en" | "de"; slug: string };
}) {
  const [row] = await db
    .select({ a: journalArticles, t: journalArticleTranslations })
    .from(journalArticles)
    .innerJoin(
      journalArticleTranslations,
      and(
        eq(journalArticleTranslations.articleId, journalArticles.id),
        eq(journalArticleTranslations.locale, params.locale),
      ),
    )
    .where(eq(journalArticles.slug, params.slug))
    .limit(1);

  const title = row?.t.title ?? "Au Fil des Saveurs";
  const eyebrow = row?.a.category ?? "Journal";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${OG_COLORS.cream}, ${OG_COLORS.creamGold})`,
          padding: 80,
          fontFamily: OG_FONT_STACK.display,
        }}
      >
        <div
          style={{
            fontFamily: OG_FONT_STACK.script,
            fontSize: 36,
            color: OG_COLORS.honeyDark,
            display: "flex",
          }}
        >
          Au Fil des Saveurs · Le journal
        </div>
        <div
          style={{
            fontSize: 28,
            color: OG_COLORS.honey,
            marginTop: 16,
            textTransform: "uppercase",
            letterSpacing: 3,
            display: "flex",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 72,
            color: OG_COLORS.warmBrown,
            marginTop: 32,
            fontWeight: 700,
            lineHeight: 1.1,
            display: "flex",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: "auto",
            fontSize: 22,
            color: OG_COLORS.terracotta,
            display: "flex",
          }}
        >
          aufildessaveurs.be
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

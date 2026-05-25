import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalArticles } from "@/lib/db/schema";

export const runtime = "edge";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const [article] = await db
    .select()
    .from(journalArticles)
    .where(eq(journalArticles.slug, slug))
    .limit(1);
  if (!article) return new Response("Not found", { status: 404 });

  const src = article.pinterestImage || article.coverImage;
  if (!src) return new Response("No image", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "1000px",
          height: "1500px",
          display: "flex",
          background: "#fbf6ee",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    ),
    { width: 1000, height: 1500 },
  );
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const found = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.unsubscribeToken, token))
    .limit(1);
  if (!found[0]) {
    return NextResponse.redirect(
      new URL(`/fr/newsletter/unsubscribed?error=1`, _req.url),
    );
  }
  await db
    .update(newsletterSubscribers)
    .set({
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    })
    .where(eq(newsletterSubscribers.id, found[0].id));
  return NextResponse.redirect(
    new URL(`/${found[0].locale}/newsletter/unsubscribed`, _req.url),
  );
}

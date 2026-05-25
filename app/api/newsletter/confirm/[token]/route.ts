import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const found = await db
    .select()
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.confirmToken, token),
        eq(newsletterSubscribers.status, "pending"),
      ),
    )
    .limit(1);
  if (!found[0]) {
    return NextResponse.redirect(
      new URL(`/fr/newsletter/confirmed?error=1`, _req.url),
    );
  }
  await db
    .update(newsletterSubscribers)
    .set({
      status: "confirmed",
      confirmedAt: new Date(),
    })
    .where(eq(newsletterSubscribers.id, found[0].id));
  return NextResponse.redirect(
    new URL(`/${found[0].locale}/newsletter/confirmed`, _req.url),
  );
}

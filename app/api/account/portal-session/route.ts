import { NextResponse, type NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { createPortalSession } from "@/lib/stripe/portal";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("unauthorized", { status: 401 });

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  if (!sub) return new NextResponse("no subscription", { status: 404 });

  const locale = new URL(req.url).searchParams.get("locale") ?? "fr";
  const portalUrl = await createPortalSession(sub.stripeCustomerId, locale);
  return NextResponse.json({ url: portalUrl });
}

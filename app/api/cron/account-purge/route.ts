import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { purgeUser } from "@/lib/auth/account-purge";
import { isCronAuthorized } from "@/lib/auth/cron";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      sql`${users.deletedAt} IS NOT NULL AND ${users.deletedAt} < NOW() - INTERVAL '30 days' AND ${users.purgedAt} IS NULL`,
    );

  let purged = 0;
  for (const row of rows) {
    try {
      await purgeUser(row.id);
      purged += 1;
    } catch (e) {
      console.error("[cron account-purge] failed for user", row.id, e);
    }
  }

  return NextResponse.json({
    purged,
    candidates: rows.length,
    processedAt: new Date().toISOString(),
  });
}

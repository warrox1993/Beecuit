import "server-only";
import { db } from "@/lib/db";
import { b2bQuoteRequests } from "@/lib/db/schemas/b2b";
import { eq, desc } from "drizzle-orm";

type B2BStatus = "pending" | "quoted" | "paid" | "rejected" | "expired";

export async function listQuoteRequests(opts?: { status?: string; limit?: number }) {
  const limit = opts?.limit ?? 100;
  const allowed: B2BStatus[] = ["pending", "quoted", "paid", "rejected", "expired"];
  if (opts?.status && allowed.includes(opts.status as B2BStatus)) {
    return db
      .select()
      .from(b2bQuoteRequests)
      .where(eq(b2bQuoteRequests.status, opts.status as B2BStatus))
      .orderBy(desc(b2bQuoteRequests.createdAt))
      .limit(limit);
  }
  return db
    .select()
    .from(b2bQuoteRequests)
    .orderBy(desc(b2bQuoteRequests.createdAt))
    .limit(limit);
}

export async function getQuoteRequest(id: string) {
  const rows = await db
    .select()
    .from(b2bQuoteRequests)
    .where(eq(b2bQuoteRequests.id, id))
    .limit(1);
  return rows[0] ?? null;
}

import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages, contactStatus, type ContactStatus } from "@/lib/db/schemas/contact";

const STATUSES = contactStatus.enumValues as readonly string[];

export async function listContactMessages(opts: { status?: string; limit?: number }) {
  const where =
    opts.status && STATUSES.includes(opts.status)
      ? eq(contactMessages.status, opts.status as ContactStatus)
      : undefined;
  return db
    .select()
    .from(contactMessages)
    .where(where)
    .orderBy(desc(contactMessages.createdAt))
    .limit(opts.limit ?? 100);
}

export async function getContactMessage(id: string) {
  const [row] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
  return row ?? null;
}

/** Nombre de messages enregistrés depuis cette IP dans la fenêtre (anti-spam). */
export async function countRecentByIp(ip: string, withinMinutes: number): Promise<number> {
  const since = new Date(Date.now() - withinMinutes * 60_000);
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(and(eq(contactMessages.sourceIp, ip), gt(contactMessages.createdAt, since)));
  return rows[0]?.n ?? 0;
}

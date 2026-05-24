import "server-only";
import { db } from "@/lib/db";
import { giftCards, giftCardRedemptions } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function listPurchasedByUser(userId: string) {
  return db
    .select()
    .from(giftCards)
    .where(eq(giftCards.purchaserUserId, userId))
    .orderBy(desc(giftCards.createdAt));
}

export async function listReceivedByEmail(email: string) {
  return db
    .select({
      id: giftCards.id,
      code: giftCards.code,
      initialAmountCents: giftCards.initialAmountCents,
      remainingAmountCents: giftCards.remainingAmountCents,
      deliveredAt: giftCards.deliveredAt,
      expiresAt: giftCards.expiresAt,
      message: giftCards.message,
      purchaserEmail: giftCards.purchaserEmail,
      isActive: giftCards.isActive,
    })
    .from(giftCards)
    .where(and(eq(giftCards.recipientEmail, email), sql`${giftCards.deliveredAt} IS NOT NULL`))
    .orderBy(desc(giftCards.deliveredAt));
}

export async function getRedemptionsForCard(cardId: string) {
  return db
    .select()
    .from(giftCardRedemptions)
    .where(eq(giftCardRedemptions.giftCardId, cardId))
    .orderBy(desc(giftCardRedemptions.createdAt));
}

export type AdminGiftCardStatusFilter = "pending" | "delivered" | "used" | "expired";

export async function listAllGiftCards(opts: {
  search?: string;
  statusFilter?: AdminGiftCardStatusFilter;
}) {
  // For V1 (small volume), fetch all + filter in memory. Refactor to SQL when volume grows.
  const all = await db.select().from(giftCards).orderBy(desc(giftCards.createdAt));
  let filtered = all;
  if (opts.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.recipientEmail.toLowerCase().includes(q) ||
        c.purchaserEmail.toLowerCase().includes(q),
    );
  }
  if (opts.statusFilter) {
    const now = Date.now();
    filtered = filtered.filter((c) => {
      const delivered = c.deliveredAt != null;
      const expired = c.expiresAt.getTime() < now;
      const used = c.remainingAmountCents === 0;
      if (opts.statusFilter === "pending") return !delivered;
      if (opts.statusFilter === "delivered") return delivered && !used && !expired;
      if (opts.statusFilter === "used") return used;
      if (opts.statusFilter === "expired") return expired && !used;
      return true;
    });
  }
  return filtered;
}
